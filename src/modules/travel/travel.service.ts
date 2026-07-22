import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const TIER_MIN_MEMBERS = [
    { tierNumber: 1, minMembers: 500 },
    { tierNumber: 2, minMembers: 5000 },
    { tierNumber: 3, minMembers: 20000 },
];

@Injectable()
export class TravelService {
    constructor(private readonly prisma: PrismaService) { }

    // ── Admin: Upsert destinations for a tier in a month/year ────────────────
    async upsertTier(
        tierNumber: number,
        destinations: string[],
        month: number,
        year: number,
    ) {
        const tier = TIER_MIN_MEMBERS.find((t) => t.tierNumber === tierNumber);
        if (!tier) throw new NotFoundException('Invalid tier number (1, 2, or 3)');

        return this.prisma.travelTier.upsert({
            where: { tierNumber_month_year: { tierNumber, month, year } },
            create: {
                tierNumber,
                minMembers: tier.minMembers,
                destinations,
                month,
                year,
                isActive: true,
            },
            update: { destinations, isActive: true },
        });
    }

    // ── Admin: Get all tiers for a specific month/year ────────────────────────
    async getTiersForMonth(month: number, year: number) {
        const rows = await this.prisma.travelTier.findMany({
            where: { month, year },
            orderBy: { tierNumber: 'asc' },
        });

        // Fill in any missing tiers so admin always sees all 3
        return TIER_MIN_MEMBERS.map((def) => {
            const found = rows.find((r) => r.tierNumber === def.tierNumber);
            return (
                found ?? {
                    id: null,
                    tierNumber: def.tierNumber,
                    minMembers: def.minMembers,
                    destinations: [],
                    month,
                    year,
                    isActive: true,
                    createdAt: null,
                    updatedAt: null,
                }
            );
        });
    }

    // ── Admin: Delete (clear) a tier for a month/year ─────────────────────────
    async clearTier(tierNumber: number, month: number, year: number) {
        await this.prisma.travelTier.deleteMany({
            where: { tierNumber, month, year },
        });
        return { message: 'Tier cleared' };
    }

    // ── User: Get travel eligibility for current month ────────────────────────
    async getUserEligibility(userId: string) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);

        // Count direct referrals (children) activated this month for the first time
        const monthlyNewActiveCount = await this.prisma.user.count({
            where: {
                parentId: userId,
                status: 'ACTIVE',
                isFirstActivated: true,
                OR: [
                    {
                        activeFrom: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                    },
                    {
                        activeFrom: null,
                        createdAt: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                    },
                ],
            },
        });

        // Get this month's configured tiers
        const tiers = await this.prisma.travelTier.findMany({
            where: { month, year, isActive: true },
            orderBy: { tierNumber: 'asc' },
        });

        // Determine highest unlocked tier
        let unlockedTier: typeof tiers[0] | null = null;
        for (const tier of tiers) {
            if (monthlyNewActiveCount >= tier.minMembers) {
                unlockedTier = tier;
            }
        }

        return {
            month,
            year,
            monthlyNewActiveCount,
            isEligible: !!unlockedTier,
            unlockedTier: unlockedTier
                ? {
                    tierNumber: unlockedTier.tierNumber,
                    minMembers: unlockedTier.minMembers,
                    destinations: unlockedTier.destinations,
                }
                : null,
            allTiers: TIER_MIN_MEMBERS.map((def) => {
                const configured = tiers.find((t) => t.tierNumber === def.tierNumber);
                return {
                    tierNumber: def.tierNumber,
                    minMembers: def.minMembers,
                    destinations: configured?.destinations ?? [],
                    achieved: monthlyNewActiveCount >= def.minMembers,
                };
            }),
        };
    }

    // ── Get monthly travel achievers (eligible users) ───────────────────────
    async getAchieversList(month: number, year: number) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);

        // Fetch all active users with parentId set
        const activeMembers = await this.prisma.user.findMany({
            where: {
                status: 'ACTIVE',
                isFirstActivated: true,
                OR: [
                    { activeFrom: { gte: monthStart, lt: monthEnd } },
                    { activeFrom: null, createdAt: { gte: monthStart, lt: monthEnd } },
                ],
                parentId: { not: null },
            },
            select: { parentId: true },
        });

        // Aggregate counts by parentId
        const parentCounts: Record<string, number> = {};
        for (const m of activeMembers) {
            if (m.parentId) {
                parentCounts[m.parentId] = (parentCounts[m.parentId] ?? 0) + 1;
            }
        }

        // Filter parents who reached at least Tier 1 (>= 500)
        const eligibleParentIds = Object.keys(parentCounts).filter(
            (parentId) => parentCounts[parentId] >= 500,
        );

        if (eligibleParentIds.length === 0) {
            return [];
        }

        const users = await this.prisma.user.findMany({
            where: { id: { in: eligibleParentIds } },
            select: { id: true, name: true, phone: true, email: true, memberId: true },
        });

        return users.map((u) => {
            const count = parentCounts[u.id] ?? 0;
            let tierNumber = 1;
            if (count >= 20000) tierNumber = 3;
            else if (count >= 5000) tierNumber = 2;

            return {
                ...u,
                monthlyNewActiveCount: count,
                tierNumber,
            };
        });
    }
}

