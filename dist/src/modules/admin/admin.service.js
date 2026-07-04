"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let AdminService = class AdminService {
    prisma;
    usersService;
    constructor(prisma, usersService) {
        this.prisma = prisma;
        this.usersService = usersService;
    }
    async getPlatformStats() {
        const [totalUsers, activeUsers, inactiveUsers, totalOrders, deliveredOrders, totalCommissions, pendingWithdrawals,] = await Promise.all([
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
    async getUsers(page = 1, limit = 20, search) {
        return this.usersService.findAll(page, limit, search);
    }
    async banUser(userId) {
        return this.usersService.setUserBan(userId, true);
    }
    async unbanUser(userId) {
        return this.usersService.setUserBan(userId, false);
    }
    async overrideActivation(userId, activate) {
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
    async deleteUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.user.updateMany({
                where: { parentId: userId },
                data: { parentId: null },
            });
            await tx.generationCommission.deleteMany({
                where: { OR: [{ toUserId: userId }, { fromUserId: userId }] },
            });
            await tx.dailyBenefitLog.deleteMany({ where: { userId } });
            await tx.notification.deleteMany({ where: { userId } });
            await tx.withdrawalRequest.deleteMany({ where: { userId } });
            const orderIds = (await tx.order.findMany({ where: { userId }, select: { id: true } })).map((o) => o.id);
            if (orderIds.length > 0) {
                await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
                await tx.order.deleteMany({ where: { id: { in: orderIds } } });
            }
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (wallet) {
                await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
                await tx.wallet.delete({ where: { userId } });
            }
            await tx.user.delete({ where: { id: userId } });
        });
        return { message: 'User deleted successfully' };
    }
    async deleteOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        await this.prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            await tx.generationCommission.deleteMany({ where: { orderId } });
            await tx.orderItem.deleteMany({ where: { orderId } });
            await tx.order.delete({ where: { id: orderId } });
        });
        return { message: 'Order deleted successfully' };
    }
    async getConfig(key) {
        return this.prisma.platformConfig.findUnique({ where: { key } });
    }
    async setConfig(key, value) {
        return this.prisma.platformConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
    async getAllConfigs() {
        return this.prisma.platformConfig.findMany();
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], AdminService);
//# sourceMappingURL=admin.service.js.map