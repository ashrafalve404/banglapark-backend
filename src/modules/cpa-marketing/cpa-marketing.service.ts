import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateCpaTaskDto, UpdateCpaTaskDto } from './dto/cpa-marketing.dto';
import { TxType } from '@prisma/client';

@Injectable()
export class CpaMarketingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    private get db(): any {
        return this.prisma;
    }

    // ── Admin Methods ────────────────────────────────────────────────────────

    async adminCreateTask(dto: CreateCpaTaskDto) {
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

        return tasks.map((t: any) => {
            const totalRevenue = (t.purchases || []).reduce(
                (sum: number, p: any) => sum + Number(p.pricePaid),
                0,
            );
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

        return purchases.map((p: any) => ({
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

    async adminUpdateTask(id: string, dto: UpdateCpaTaskDto) {
        const task = await this.db.cpaTask.findUnique({ where: { id } });
        if (!task) throw new NotFoundException('CPA Task not found');

        return this.db.cpaTask.update({
            where: { id },
            data: { ...dto },
        });
    }

    async adminDeleteTask(id: string) {
        const task = await this.db.cpaTask.findUnique({ where: { id } });
        if (!task) throw new NotFoundException('CPA Task not found');

        await this.db.cpaTask.delete({ where: { id } });
        return { message: 'CPA Task deleted successfully' };
    }

    // ── User Methods ─────────────────────────────────────────────────────────

    async userGetPublicTasks(userId: string) {
        const tasks = await this.db.cpaTask.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        const myPurchases = await this.db.cpaTaskPurchase.findMany({
            where: { userId },
            select: { cpaTaskId: true },
        });
        const purchasedTaskIds = new Set(myPurchases.map((p: any) => p.cpaTaskId));

        // SECURITY: Omit redirectLink from public response!
        return tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            price: Number(t.price),
            isActive: t.isActive,
            isPurchased: purchasedTaskIds.has(t.id),
            createdAt: t.createdAt,
        }));
    }

    async userBuyTask(userId: string, taskId: string) {
        const task = await this.db.cpaTask.findUnique({
            where: { id: taskId, isActive: true },
        });
        if (!task) throw new NotFoundException('CPA Task not found or inactive');

        const existing = await this.db.cpaTaskPurchase.findFirst({
            where: { userId, cpaTaskId: taskId },
        });
        if (existing) throw new BadRequestException('You have already started this task');

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

    async userGetMyPurchases(userId: string) {
        const purchases = await this.db.cpaTaskPurchase.findMany({
            where: { userId, status: 'PURCHASED' },
            include: {
                cpaTask: true,
            },
            orderBy: { purchasedAt: 'desc' },
        });

        return purchases.map((p: any) => ({
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

    async userCompleteTask(userId: string, purchaseId: string) {
        const purchase = await this.db.cpaTaskPurchase.findFirst({
            where: { id: purchaseId, userId },
            include: { cpaTask: true },
        });
        if (!purchase) throw new NotFoundException('Purchased task not found');

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
}
