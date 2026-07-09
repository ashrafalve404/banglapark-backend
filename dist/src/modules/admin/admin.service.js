"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
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
    async createUser(dto) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (existing) {
            throw new common_1.ConflictException('Email or phone already in use');
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
                role: dto.role || 'USER',
                memberId: nextMemberId,
                referralCode: `BP${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                referralLink: '',
            },
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                status: true, memberId: true, referralCode: true, createdAt: true,
            },
        });
        await this.prisma.wallet.create({ data: { userId: user.id } });
        return user;
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