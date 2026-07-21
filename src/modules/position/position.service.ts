import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TxType } from '@prisma/client';

export interface PositionDef {
    rank: number;
    name: string;
    requiredMembers: number;
    monthlySalary: number;
}

export const POSITIONS: PositionDef[] = [
    { rank: 1, name: 'Executive Officer', requiredMembers: 5_000, monthlySalary: 25_000 },
    { rank: 2, name: 'Executive Manager', requiredMembers: 25_000, monthlySalary: 75_000 },
    { rank: 3, name: 'Marketing Manager', requiredMembers: 75_000, monthlySalary: 150_000 },
    { rank: 4, name: 'District Manager', requiredMembers: 200_000, monthlySalary: 300_000 },
    { rank: 5, name: 'Regional Manager', requiredMembers: 500_000, monthlySalary: 500_000 },
    { rank: 6, name: 'Executive Vice President', requiredMembers: 1_200_000, monthlySalary: 750_000 },
    { rank: 7, name: 'Additional General Manager', requiredMembers: 2_500_000, monthlySalary: 1_200_000 },
    { rank: 8, name: 'Divisional General Manager', requiredMembers: 5_000_000, monthlySalary: 2_500_000 },
    { rank: 9, name: 'General Manager', requiredMembers: 5_000_000, monthlySalary: 7_500_000 },
    { rank: 10, name: 'Executive Director', requiredMembers: 10_000_000, monthlySalary: 10_000_000 },
];

@Injectable()
export class PositionService {
    private readonly logger = new Logger(PositionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    /** Count all ACTIVE descendants of a user using recursive CTE */
    async getActiveTeamCount(userId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      WITH RECURSIVE team AS (
        SELECT id, status FROM "User" WHERE "parentId" = ${userId}
        UNION ALL
        SELECT u.id, u.status FROM "User" u
        INNER JOIN team t ON u."parentId" = t.id
      )
      SELECT COUNT(*) as count FROM team WHERE status = 'ACTIVE'
    `;
        return Number(result[0]?.count ?? 0);
    }

    /** Returns user's active team count + eligibility for every position */
    async getUserPositionData(userId: string) {
        const activeTeamCount = await this.getActiveTeamCount(userId);
        const positions = POSITIONS.map((pos) => ({
            ...pos,
            isUnlocked: activeTeamCount >= pos.requiredMembers,
        }));
        const highestUnlocked = [...positions].reverse().find((p) => p.isUnlocked) ?? null;
        return { activeTeamCount, positions, highestUnlocked };
    }

    /** Admin: list all users with their active team count and position rank */
    async adminListMembersWithPosition(page = 1, limit = 20, search?: string) {
        const skip = (page - 1) * limit;
        const where: any = {
            role: 'USER',
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    memberId: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        // For each user, get their active team count (in parallel, capped per page)
        const usersWithPosition = await Promise.all(
            users.map(async (user) => {
                const activeTeamCount = await this.getActiveTeamCount(user.id);
                const highestPosition = [...POSITIONS].reverse().find(
                    (p) => activeTeamCount >= p.requiredMembers,
                ) ?? null;
                return { ...user, activeTeamCount, currentPosition: highestPosition };
            }),
        );

        return { users: usersWithPosition, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Monthly cron: runs on 1st of every month at 00:05 Asia/Dhaka.
     * For each ACTIVE user, check their highest eligible position and credit salary.
     */
    @Cron('5 0 1 * *', { timeZone: 'Asia/Dhaka', name: 'position-salary-cron' })
    async distributePositionSalaries() {
        this.logger.log('Position salary cron triggered...');
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const activeUsers = await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
        });

        let paid = 0;
        for (const user of activeUsers) {
            try {
                await this.payPositionSalaryForUser(user.id, monthKey);
                paid++;
            } catch (err) {
                this.logger.error(`Position salary failed for user ${user.id}: ${err}`);
            }
        }
        this.logger.log(`Position salary distributed to ${paid} users for ${monthKey}`);
    }

    async payPositionSalaryForUser(userId: string, monthKey: string) {
        const activeTeamCount = await this.getActiveTeamCount(userId);

        // Find highest eligible position
        const eligible = [...POSITIONS].reverse().find(
            (p) => activeTeamCount >= p.requiredMembers,
        );
        if (!eligible) return; // Not eligible for any position

        const referenceId = `position-salary-${userId}-${monthKey}`;

        // Idempotency: skip if already paid this month
        const existing = await this.prisma.walletTransaction.findFirst({
            where: { referenceId },
        });
        if (existing) {
            this.logger.warn(`Position salary already paid for ${userId} in ${monthKey}`);
            return;
        }

        const walletId = await this.walletService.getWalletId(userId);
        await this.prisma.$transaction(async (tx) => {
            await this.walletService.credit(
                tx as any,
                walletId,
                eligible.monthlySalary,
                TxType.POSITION_SALARY,
                `Position salary — ${eligible.name} (${monthKey})`,
                referenceId,
            );
        });

        this.logger.log(
            `Paid ${eligible.monthlySalary} salary to ${userId} as ${eligible.name} for ${monthKey}`,
        );
    }
}
