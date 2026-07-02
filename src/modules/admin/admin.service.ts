import { Injectable } from '@nestjs/common';
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
                activeUntil: activate ? new Date(now.getTime() + 30 * 86_400_000) : null,
            },
            select: { id: true, name: true, status: true, activeUntil: true },
        });
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
