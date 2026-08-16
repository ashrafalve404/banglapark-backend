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
        return this.db.cpaTask.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { purchases: true } },
            },
        });
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
        if (existing) throw new BadRequestException('You have already purchased this task');

        const price = Number(task.price);
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        if (Number(wallet.balance) < price) {
            throw new BadRequestException('Insufficient wallet balance to purchase this CPA task');
        }

        const txType = (TxType as any).CPA_TASK_PURCHASE ?? TxType.PURCHASE;

        const purchase = await this.prisma.$transaction(async (tx: any) => {
            if (price > 0) {
                await this.walletService.debit(
                    tx,
                    wallet.id,
                    price,
                    txType,
                    `CPA Task purchase: ${task.title}`,
                    taskId,
                );
            }

            return tx.cpaTaskPurchase.create({
                data: {
                    userId,
                    cpaTaskId: taskId,
                    pricePaid: price,
                    status: 'PURCHASED',
                },
                include: {
                    cpaTask: true,
                },
            });
        });

        return {
            message: 'CPA Task purchased successfully! It is now available in your Daily Work page.',
            purchase: {
                id: purchase.id,
                taskId: purchase.cpaTaskId,
                title: purchase.cpaTask.title,
                description: purchase.cpaTask.description,
                redirectLink: purchase.cpaTask.redirectLink,
                pricePaid: Number(purchase.pricePaid),
                status: purchase.status,
                purchasedAt: purchase.purchasedAt,
            },
        };
    }

    async userGetMyPurchases(userId: string) {
        const purchases = await this.db.cpaTaskPurchase.findMany({
            where: { userId },
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
}
