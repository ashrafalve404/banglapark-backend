import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type AnyPrismaTx = {
    wallet: {
        update: (args: unknown) => Promise<{ balance: any }>;
        findUnique: (args: unknown) => Promise<{ balance: unknown } | null>;
    };
    walletTransaction: {
        create: (args: unknown) => Promise<unknown>;
    };
};

@Injectable()
export class WalletService {
    constructor(private readonly prisma: PrismaService) { }

    // ── Central credit/debit ─────────────────────────────────────────────────

    async credit(
        tx: AnyPrismaTx,
        walletId: string,
        amount: number,
        type: string,
        description: string,
        referenceId?: string,
        benefitCategory?: string,
    ) {
        const wallet = await (tx.wallet.update as (args: Record<string, unknown>) => Promise<{ balance: unknown }>)({
            where: { id: walletId },
            data: { balance: { increment: amount } },
        });

        await (tx.walletTransaction.create as (args: Record<string, unknown>) => Promise<unknown>)({
            data: {
                walletId,
                type,
                amount,
                balanceAfter: wallet.balance,
                referenceId: referenceId ?? null,
                description,
                benefitCategory: benefitCategory ?? null,
            },
        });

        return wallet;
    }

    async debit(
        tx: AnyPrismaTx,
        walletId: string,
        amount: number,
        type: string,
        description: string,
        referenceId?: string,
    ) {
        const current = await (tx.wallet.findUnique as (args: Record<string, unknown>) => Promise<{ balance: string | number } | null>)({
            where: { id: walletId },
        });

        if (!current) throw new NotFoundException('Wallet not found');

        const currentBalance = Number(current.balance);
        if (currentBalance < amount) {
            throw new BadRequestException('Insufficient wallet balance');
        }

        const wallet = await (tx.wallet.update as (args: Record<string, unknown>) => Promise<{ balance: unknown }>)({
            where: { id: walletId },
            data: { balance: { decrement: amount } },
        });

        await (tx.walletTransaction.create as (args: Record<string, unknown>) => Promise<unknown>)({
            data: {
                walletId,
                type,
                amount,
                balanceAfter: wallet.balance,
                referenceId: referenceId ?? null,
                description,
            },
        });

        return wallet;
    }

    // ── Public read endpoints ─────────────────────────────────────────────────

    async getBalance(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true, balance: true, pendingWithdrawal: true },
        });
        if (!wallet) throw new NotFoundException('Wallet not found');

        const balance = Number(wallet.balance);
        const pending = Number(wallet.pendingWithdrawal);

        const [dailyBenefitResult, generationIncomeResult, dailyRewardResult, tierBonusResult] = await Promise.all([
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'DAILY_BENEFIT' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'GENERATION_COMMISSION' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'DAILY_BENEFIT', benefitCategory: 'BASE' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'DAILY_BENEFIT', benefitCategory: 'TIER' },
                _sum: { amount: true },
            }),
        ]);

        return {
            ...wallet,
            availableBalance: balance - pending,
            dailyBenefit: Number(dailyBenefitResult._sum.amount ?? 0),
            dailyReward: Number(dailyRewardResult._sum.amount ?? 0),
            tierBonus: Number(tierBonusResult._sum.amount ?? 0),
            generationIncome: Number(generationIncomeResult._sum.amount ?? 0),
            reward: 0,
            salary: 0,
            travelling: 0,
            share: 0,
        };
    }

    async getTransactions(
        userId: string,
        page = 1,
        limit = 20,
        type?: string,
        from?: Date,
        to?: Date,
    ) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        const where: Record<string, unknown> = {
            walletId: wallet.id,
            ...(type && { type }),
            ...(from || to
                ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
                : {}),
        };

        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where: where as any,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.walletTransaction.count({
                where: where as any,
            }),
        ]);

        return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Helper: get wallet ID by user ID ─────────────────────────────────────
    async getWalletId(userId: string): Promise<string> {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!wallet) throw new NotFoundException('Wallet not found');
        return wallet.id;
    }
}
