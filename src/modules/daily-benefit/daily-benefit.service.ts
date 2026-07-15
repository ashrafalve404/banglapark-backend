import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TxType } from '@prisma/client';

// Daily benefit tier table (≥ count → amount BDT)
export const BENEFIT_TIERS = [
    { minCount: 10000, amount: 5000 },
    { minCount: 5000, amount: 2000 },
    { minCount: 500, amount: 1000 },
    { minCount: 100, amount: 500 },
    { minCount: 50, amount: 300 },
    { minCount: 20, amount: 200 },
    { minCount: 5, amount: 100 },
] as const;

export function calculateDailyBenefit(activeTeamCount: number): number {
    for (const tier of BENEFIT_TIERS) {
        if (activeTeamCount >= tier.minCount) return tier.amount;
    }
    return 100; // base daily benefit for every active user
}

// Returns only the additional tier bonus (0 for <5 team members)
export function calculateTierBonus(activeTeamCount: number): number {
    for (const tier of BENEFIT_TIERS) {
        if (activeTeamCount >= tier.minCount) return tier.amount;
    }
    return 0;
}

export const DAILY_BENEFIT_QUEUE = 'daily-benefit';

@Injectable()
export class DailyBenefitService {
    private readonly logger = new Logger(DailyBenefitService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        @InjectQueue(DAILY_BENEFIT_QUEUE) private readonly benefitQueue: Queue,
    ) { }

    // Deactivate expired users before processing daily benefits
    async deactivateExpiredUsers() {
        const now = new Date();
        const result = await this.prisma.user.updateMany({
            where: { status: 'ACTIVE', activeUntil: { not: null, lt: now } },
            data: { status: 'INACTIVE' },
        });
        if (result.count > 0) {
            this.logger.log(`Auto-deactivated ${result.count} expired users`);
        }
    }

    // Scheduled at midnight Asia/Dhaka — enqueues one job per active user
    @Cron('0 0 * * *', { timeZone: 'Asia/Dhaka', name: 'daily-benefit-cron' })
    async scheduleDailyBenefit() {
        this.logger.log('Daily benefit cron triggered — queuing jobs...');
        const today = new Date().toISOString().split('T')[0];

        await this.deactivateExpiredUsers();

        const activeUsers = await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
        });

        for (const user of activeUsers) {
            await this.benefitQueue.add(
                'pay-benefit',
                { userId: user.id, date: today },
                { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
            );
        }
        this.logger.log(`Queued daily benefit for ${activeUsers.length} active users`);
    }

    // Called by the BullMQ processor for each user
    async payBenefitForUser(userId: string, dateStr: string) {
        const date = new Date(dateStr);

        // Idempotency guard — unique constraint on [userId, date]
        const existing = await this.prisma.dailyBenefitLog.findUnique({
            where: { userId_date: { userId, date } },
        });
        if (existing) {
            this.logger.warn(`Daily benefit already paid for ${userId} on ${dateStr}`);
            return;
        }

        // Count active team
        const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      WITH RECURSIVE team AS (
        SELECT id, status FROM "User" WHERE "parentId" = ${userId}
        UNION ALL
        SELECT u.id, u.status FROM "User" u
        INNER JOIN team t ON u."parentId" = t.id
      )
      SELECT COUNT(*) as count FROM team WHERE status = 'ACTIVE'
    `;
        const activeTeamCount = Number(result[0]?.count ?? 0);
        const baseAmount = 100;
        const tierAmount = calculateTierBonus(activeTeamCount);
        const totalAmount = baseAmount + tierAmount;

        await this.prisma.$transaction(async (tx) => {
            const walletId = await this.walletService.getWalletId(userId);

            // Always credit base 100 daily reward
            await this.walletService.credit(
                tx,
                walletId,
                baseAmount,
                TxType.DAILY_BENEFIT,
                `Daily benefit for ${dateStr}`,
                dateStr,
                'BASE',
            );

            // Additional tier bonus for users with active team
            if (tierAmount > 0) {
                await this.walletService.credit(
                    tx,
                    walletId,
                    tierAmount,
                    TxType.DAILY_BENEFIT,
                    `Tier bonus for ${dateStr} — active team: ${activeTeamCount}`,
                    dateStr,
                    'TIER',
                );
            }

            await tx.dailyBenefitLog.create({
                data: { userId, date, teamCount: activeTeamCount, amount: totalAmount },
            });
        });

        this.logger.log(`Paid BDT ${totalAmount} daily benefit to user ${userId} (team: ${activeTeamCount})`);
    }

    async getLogs(userId?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = userId ? { userId } : {};
        const [logs, total] = await Promise.all([
            this.prisma.dailyBenefitLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.dailyBenefitLog.count({ where }),
        ]);
        return { logs, total, page, limit };
    }

    getTiers() {
        return BENEFIT_TIERS;
    }
}
