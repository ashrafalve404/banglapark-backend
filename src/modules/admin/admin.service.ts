import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
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
            totalRevenue,
            totalCommissions,
            pendingWithdrawals,
            products,
            deliveredOrderIds,
            approvedWithdrawals,
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: 'USER' } }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { status: 'INACTIVE' } }),
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'DELIVERED' } }),
            this.prisma.order.aggregate({ _sum: { total: true } }),
            this.prisma.generationCommission.aggregate({ _sum: { amount: true } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.product.findMany({
                where: { isActive: true },
                select: { price: true, costPrice: true, stock: true },
            }),
            this.prisma.order.findMany({
                where: { status: 'DELIVERED' },
                select: { id: true },
            }),
            this.prisma.withdrawalRequest.aggregate({
                where: { status: 'APPROVED' },
                _sum: { amount: true },
            }),
        ]);

        // Calculate sold product cost from delivered orders
        const deliveredIdList = deliveredOrderIds.map((o) => o.id);
        let soldCost = 0;
        if (deliveredIdList.length > 0) {
            const deliveredItems = await this.prisma.orderItem.findMany({
                where: { orderId: { in: deliveredIdList } },
                include: { product: { select: { costPrice: true, price: true } } },
            });
            for (const item of deliveredItems) {
                const cost = item.product.costPrice ?? item.product.price;
                soldCost += Number(cost) * item.quantity;
            }
        }

        const salesRevenue = Number(totalRevenue._sum.total ?? 0);
        const commissionsPaid = Number(totalCommissions._sum.amount ?? 0);
        const withdrawalsApproved = Number(approvedWithdrawals._sum.amount ?? 0);
        const totalProducts = products.length;
        let productValue = 0;
        let costValue = 0;
        for (const p of products) {
            productValue += Number(p.price) * p.stock;
            if (p.costPrice) costValue += Number(p.costPrice) * p.stock;
        }

        const grossProfit = salesRevenue - soldCost;
        const netProfit = grossProfit - commissionsPaid - withdrawalsApproved;

        return {
            users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
            orders: { total: totalOrders, delivered: deliveredOrders },
            totalRevenue: salesRevenue,
            totalCommissionsPaid: commissionsPaid,
            pendingWithdrawals,
            totalProducts,
            totalProductValue: productValue,
            totalCostValue: costValue,
            totalWithdrawalsApproved: withdrawalsApproved,
            totalSales: salesRevenue,
            totalSoldCost: soldCost,
            grossProfit,
            netProfit,
        };
    }

    async createUser(dto: { name: string; email: string; phone: string; password: string; role?: string }) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (existing) {
            throw new ConflictException('Email or phone already in use');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const maxMemberId = await this.prisma.user.aggregate({ _max: { memberId: true } });
        const nextMemberId = (maxMemberId._max.memberId ?? 100) + 1;

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                role: (dto.role as any) || 'USER',
                memberId: nextMemberId,
                referralCode: `BP${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                referralLink: '',
            },
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                status: true, memberId: true, referralCode: true, createdAt: true,
            },
        });

        // Create wallet
        await this.prisma.wallet.create({ data: { userId: user.id } });

        return user;
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

    async getUserDetails(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                status: true, memberId: true, referralCode: true, referralLink: true,
                parentId: true, isBanned: true, activeFrom: true, activeUntil: true,
                createdAt: true, updatedAt: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');

        const [wallet, ordersCount, referralsCount, earningsAgg, totalCommission, totalWithdrawn] = await Promise.all([
            this.prisma.wallet.findUnique({
                where: { userId },
                select: { balance: true, pendingWithdrawal: true },
            }),
            this.prisma.order.count({ where: { userId } }),
            this.prisma.user.count({ where: { parentId: userId } }),
            this.prisma.walletTransaction.aggregate({
                where: { wallet: { userId }, amount: { gt: 0 } },
                _sum: { amount: true },
            }),
            this.prisma.generationCommission.aggregate({
                where: { toUserId: userId },
                _sum: { amount: true },
            }),
            this.prisma.withdrawalRequest.aggregate({
                where: { userId, status: 'APPROVED' },
                _sum: { amount: true },
            }),
        ]);

        const parent = user.parentId
            ? await this.prisma.user.findUnique({
                where: { id: user.parentId },
                select: { id: true, name: true, email: true, memberId: true },
            })
            : null;

        return {
            ...user,
            wallet: {
                balance: wallet?.balance ?? 0,
                pendingWithdrawal: wallet?.pendingWithdrawal ?? 0,
                totalEarned: earningsAgg._sum?.amount ?? 0,
            },
            ordersCount,
            referralsCount,
            totalCommission: totalCommission._sum?.amount ?? 0,
            totalWithdrawnApproved: totalWithdrawn._sum?.amount ?? 0,
            parent,
        };
    }

    async getUserStatement(userId: string) {
        return this.usersService.getStatement(userId);
    }

    async updateUser(userId: string, dto: { name?: string; email?: string; phone?: string; password?: string; role?: string }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const data: any = {};

        if (dto.name !== undefined) data.name = dto.name;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.phone !== undefined) data.phone = dto.phone;
        if (dto.password !== undefined) data.passwordHash = await bcrypt.hash(dto.password, 12);
        if (dto.role !== undefined) {
            if (![Role.USER, Role.ADMIN, Role.SUPER_ADMIN].includes(dto.role as Role)) {
                throw new BadRequestException('Invalid role');
            }
            data.role = dto.role;
        }

        if (dto.email || dto.phone) {
            const conflicts = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        dto.email ? { email: dto.email } : null,
                        dto.phone ? { phone: dto.phone } : null,
                    ].filter(Boolean) as any,
                    NOT: { id: userId },
                },
            });
            if (conflicts) throw new ConflictException('Email or phone already in use');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                status: true, memberId: true, referralCode: true, isBanned: true,
                createdAt: true, updatedAt: true,
            },
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
