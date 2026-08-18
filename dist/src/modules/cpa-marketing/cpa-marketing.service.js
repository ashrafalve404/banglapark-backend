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
exports.CpaMarketingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
let CpaMarketingService = class CpaMarketingService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    get db() {
        return this.prisma;
    }
    async adminCreateTask(dto) {
        return this.db.cpaTask.create({
            data: {
                title: dto.title,
                description: dto.description,
                price: dto.price,
                redirectLink: dto.redirectLink,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async adminGetAllTasks() {
        const tasks = await this.db.cpaTask.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                purchases: {
                    select: { pricePaid: true },
                },
                _count: { select: { purchases: true } },
            },
        });
        return tasks.map((t) => {
            const totalRevenue = (t.purchases || []).reduce((sum, p) => sum + Number(p.pricePaid), 0);
            const { purchases, ...rest } = t;
            return {
                ...rest,
                totalRevenue,
            };
        });
    }
    async adminGetStats() {
        const totalRevenueAgg = await this.db.cpaTaskPurchase.aggregate({
            _sum: { pricePaid: true },
            _count: { id: true },
        });
        const totalTasks = await this.db.cpaTask.count();
        const activeTasks = await this.db.cpaTask.count({ where: { isActive: true } });
        const uniqueBuyersAgg = await this.db.cpaTaskPurchase.groupBy({
            by: ['userId'],
        });
        return {
            totalRevenue: Number(totalRevenueAgg._sum.pricePaid ?? 0),
            totalPurchases: totalRevenueAgg._count.id ?? 0,
            totalTasks,
            activeTasks,
            inactiveTasks: totalTasks - activeTasks,
            uniqueBuyers: uniqueBuyersAgg.length,
        };
    }
    async adminGetAllPurchases() {
        const purchases = await this.db.cpaTaskPurchase.findMany({
            orderBy: { purchasedAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                    },
                },
                cpaTask: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                    },
                },
            },
        });
        return purchases.map((p) => ({
            id: p.id,
            purchasedAt: p.purchasedAt,
            pricePaid: Number(p.pricePaid),
            status: p.status,
            user: {
                id: p.user?.id || '',
                fullName: p.user?.fullName || 'User',
                phone: p.user?.phone || 'N/A',
                email: p.user?.email || 'N/A',
            },
            cpaTask: {
                id: p.cpaTask?.id || '',
                title: p.cpaTask?.title || 'CPA Task',
                price: Number(p.cpaTask?.price ?? 0),
            },
        }));
    }
    async adminUpdateTask(id, dto) {
        const task = await this.db.cpaTask.findUnique({ where: { id } });
        if (!task)
            throw new common_1.NotFoundException('CPA Task not found');
        return this.db.cpaTask.update({
            where: { id },
            data: { ...dto },
        });
    }
    async adminDeleteTask(id) {
        const task = await this.db.cpaTask.findUnique({ where: { id } });
        if (!task)
            throw new common_1.NotFoundException('CPA Task not found');
        await this.db.cpaTask.delete({ where: { id } });
        return { message: 'CPA Task deleted successfully' };
    }
    async userGetPublicTasks(userId) {
        const tasks = await this.db.cpaTask.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        const myPurchases = await this.db.cpaTaskPurchase.findMany({
            where: { userId },
            select: { cpaTaskId: true },
        });
        const purchasedTaskIds = new Set(myPurchases.map((p) => p.cpaTaskId));
        return tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            price: Number(t.price),
            isActive: t.isActive,
            isPurchased: purchasedTaskIds.has(t.id),
            createdAt: t.createdAt,
        }));
    }
    async userBuyTask(userId, taskId) {
        const task = await this.db.cpaTask.findUnique({
            where: { id: taskId, isActive: true },
        });
        if (!task)
            throw new common_1.NotFoundException('CPA Task not found or inactive');
        const existing = await this.db.cpaTaskPurchase.findFirst({
            where: { userId, cpaTaskId: taskId },
        });
        if (existing)
            throw new common_1.BadRequestException('You have already started this task');
        const purchase = await this.db.cpaTaskPurchase.create({
            data: {
                userId,
                cpaTaskId: taskId,
                pricePaid: 0,
                status: 'PURCHASED',
            },
            include: {
                cpaTask: true,
            },
        });
        return {
            message: 'CPA Task started for free! It is now available in your Daily Work page.',
            purchase: {
                id: purchase.id,
                taskId: purchase.cpaTaskId,
                title: purchase.cpaTask.title,
                description: purchase.cpaTask.description,
                redirectLink: purchase.cpaTask.redirectLink,
                pricePaid: 0,
                status: purchase.status,
                purchasedAt: purchase.purchasedAt,
            },
        };
    }
    async userGetMyPurchases(userId) {
        const purchases = await this.db.cpaTaskPurchase.findMany({
            where: { userId, status: 'PURCHASED' },
            include: {
                cpaTask: true,
            },
            orderBy: { purchasedAt: 'desc' },
        });
        return purchases.map((p) => ({
            id: p.id,
            taskId: p.cpaTaskId,
            title: p.cpaTask?.title || 'CPA Task',
            description: p.cpaTask?.description || '',
            redirectLink: p.cpaTask?.redirectLink || '#',
            pricePaid: Number(p.pricePaid),
            status: p.status,
            purchasedAt: p.purchasedAt,
        }));
    }
    async userCompleteTask(userId, purchaseId) {
        const purchase = await this.db.cpaTaskPurchase.findFirst({
            where: { id: purchaseId, userId },
            include: { cpaTask: true },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchased task not found');
        if (purchase.status !== 'COMPLETED') {
            await this.db.cpaTaskPurchase.update({
                where: { id: purchaseId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
        }
        return {
            message: 'Task completed',
            redirectLink: purchase.cpaTask?.redirectLink || '#',
        };
    }
};
exports.CpaMarketingService = CpaMarketingService;
exports.CpaMarketingService = CpaMarketingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], CpaMarketingService);
//# sourceMappingURL=cpa-marketing.service.js.map