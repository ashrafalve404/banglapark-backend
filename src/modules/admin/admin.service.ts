import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
    ) { }

    async getPlatformStats() {
        const [
            totalUsers,
            activeUsers,
            inactiveUsers,
            totalOrders,
            deliveredOrders,
            totalCommissions,
            pendingWithdrawals,
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: 'USER' } }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { status: 'INACTIVE' } }),
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'DELIVERED' } }),
            this.prisma.generationCommission.aggregate({ _sum: { amount: true } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
        ]);

        return {
            users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
            orders: { total: totalOrders, delivered: deliveredOrders },
            totalCommissionsPaid: totalCommissions._sum.amount ?? 0,
            pendingWithdrawals,
        };
    }

    async getUsers(page = 1, limit = 20, search?: string) {
        return this.usersService.findAll(page, limit, search);
    }

    async banUser(userId: string) {
        return this.usersService.setUserBan(userId, true);
    }

    async unbanUser(userId: string) {
        return this.usersService.setUserBan(userId, false);
    }

    async overrideActivation(userId: string, activate: boolean) {
        const now = new Date();
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                status: activate ? 'ACTIVE' : 'INACTIVE',
                activeFrom: activate ? now : null,
                activeUntil: activate ? new Date(now.getTime() + 30 * 86_400_000) : null,
            },
            select: { id: true, name: true, status: true, activeFrom: true, activeUntil: true },
        });
    }

    async deleteUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.$transaction(async (tx) => {
            // Orphan referral children
            await tx.user.updateMany({
                where: { parentId: userId },
                data: { parentId: null },
            });
            // Delete generation commissions
            await tx.generationCommission.deleteMany({
                where: { OR: [{ toUserId: userId }, { fromUserId: userId }] },
            });
            // Delete daily benefit logs
            await tx.dailyBenefitLog.deleteMany({ where: { userId } });
            // Delete notifications
            await tx.notification.deleteMany({ where: { userId } });
            // Delete withdrawal requests
            await tx.withdrawalRequest.deleteMany({ where: { userId } });
            // Delete order items then orders
            const orderIds = (
                await tx.order.findMany({ where: { userId }, select: { id: true } })
            ).map((o) => o.id);
            if (orderIds.length > 0) {
                await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
                await tx.order.deleteMany({ where: { id: { in: orderIds } } });
            }
            // Delete wallet transactions then wallet
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (wallet) {
                await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
                await tx.wallet.delete({ where: { userId } });
            }
            // Delete user
            await tx.user.delete({ where: { id: userId } });
        });

        return { message: 'User deleted successfully' };
    }

    async deleteOrder(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');

        await this.prisma.$transaction(async (tx) => {
            // Restore stock
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            // Delete commission records linked to this order
            await tx.generationCommission.deleteMany({ where: { orderId } });
            // Delete order items then order
            await tx.orderItem.deleteMany({ where: { orderId } });
            await tx.order.delete({ where: { id: orderId } });
        });

        return { message: 'Order deleted successfully' };
    }

    // Platform config (income rules)
    async getConfig(key: string) {
        return this.prisma.platformConfig.findUnique({ where: { key } });
    }

    async setConfig(key: string, value: any) {
        return this.prisma.platformConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async getAllConfigs() {
        return this.prisma.platformConfig.findMany();
    }
}
