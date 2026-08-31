import {
    Injectable,
    BadRequestException,
    NotFoundException,
    OnModuleInit,
    InternalServerErrorException,
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
export class WalletService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.ensureEnumsExist();
    }

    private async ensureEnumsExist() {
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';`);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';`);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DEPOSIT';`);
        } catch (e) {
            // Ignore if enum or DB doesn't support IF NOT EXISTS or already updated
        }
    }

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
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true, balance: true, pendingWithdrawal: true },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { userId, balance: 0 },
                select: { id: true, balance: true, pendingWithdrawal: true },
            });
        }

        const balance = Number(wallet.balance);
        const pending = Number(wallet.pendingWithdrawal);

        const [dailyBenefitResult, generationIncomeResult, dailyRewardResult, tierBonusResult, quizEarningResult, positionSalaryResult, productSalesResult] = await Promise.all([
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
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'QUIZ_EARNING' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'POSITION_SALARY' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'SELLER_PAYOUT' as any },
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
            quizEarning: Number(quizEarningResult._sum.amount ?? 0),
            salary: Number(positionSalaryResult._sum.amount ?? 0),
            productSalesIncome: Number(productSalesResult._sum.amount ?? 0),
            reward: 0,
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
        let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({ data: { userId, balance: 0 } });
        }

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
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { userId, balance: 0 },
                select: { id: true },
            });
        }
        return wallet.id;
    }

    // ── Lookup recipient by phone number ─────────────────────────────────────
    async lookupRecipient(phone: string) {
        const user = await this.prisma.user.findUnique({
            where: { phone },
            select: { id: true, name: true, phone: true },
        });
        if (!user) throw new NotFoundException('No user found with this phone number');
        return { id: user.id, name: user.name, phone: user.phone };
    }

    // ── Transfer balance between users ───────────────────────────────────────
    async transfer(senderId: string, recipientPhone: string, rawAmount: number) {
        const amount = Number(rawAmount);
        if (isNaN(amount) || amount < 10) {
            throw new BadRequestException('Minimum transfer amount is ৳10');
        }

        await this.ensureEnumsExist();

        // Find sender info
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { id: true, name: true, phone: true },
        });
        if (!sender) throw new NotFoundException('Sender user not found');

        // Find recipient by phone
        const recipient = await this.prisma.user.findUnique({
            where: { phone: recipientPhone },
            select: { id: true, name: true, phone: true },
        });
        if (!recipient) throw new NotFoundException('No user found with this phone number');

        // Self-transfer check
        if (sender.id === recipient.id) {
            throw new BadRequestException('You cannot transfer balance to yourself');
        }

        // Fetch or create both wallets
        let senderWallet = await this.prisma.wallet.findUnique({ where: { userId: senderId }, select: { id: true, balance: true } });
        if (!senderWallet) {
            senderWallet = await this.prisma.wallet.create({ data: { userId: senderId, balance: 0 }, select: { id: true, balance: true } });
        }

        let recipientWallet = await this.prisma.wallet.findUnique({ where: { userId: recipient.id }, select: { id: true, balance: true } });
        if (!recipientWallet) {
            recipientWallet = await this.prisma.wallet.create({ data: { userId: recipient.id, balance: 0 }, select: { id: true, balance: true } });
        }

        const senderBalance = Number(senderWallet.balance);
        if (senderBalance < amount) {
            throw new BadRequestException('Insufficient wallet balance');
        }

        const referenceId = `transfer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        try {
            // Atomic transaction: debit sender, credit recipient
            await this.prisma.$transaction(async (tx) => {
                // Debit sender
                const updatedSender = await tx.wallet.update({
                    where: { id: senderWallet.id },
                    data: { balance: { decrement: amount } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: senderWallet.id,
                        type: 'TRANSFER_OUT' as any,
                        amount,
                        balanceAfter: updatedSender.balance,
                        referenceId,
                        description: `Balance transfer to ${recipient.name} (${recipient.phone})`,
                    },
                });

                // Credit recipient
                const updatedRecipient = await tx.wallet.update({
                    where: { id: recipientWallet.id },
                    data: { balance: { increment: amount } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: recipientWallet.id,
                        type: 'TRANSFER_IN' as any,
                        amount,
                        balanceAfter: updatedRecipient.balance,
                        referenceId,
                        description: `Balance received from ${sender.name} (${sender.phone})`,
                    },
                });
            });
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            console.error('Transfer Transaction Error:', error);
            throw new InternalServerErrorException(error?.message || 'Transfer transaction failed');
        }

        return {
            success: true,
            message: `৳${amount} transferred successfully to ${recipient.name}`,
            referenceId,
        };
    }
}

