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
exports.TravelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const TIER_MIN_MEMBERS = [
    { tierNumber: 1, minMembers: 500 },
    { tierNumber: 2, minMembers: 5000 },
    { tierNumber: 3, minMembers: 20000 },
];
let TravelService = class TravelService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsertTier(tierNumber, destinations, month, year) {
        const tier = TIER_MIN_MEMBERS.find((t) => t.tierNumber === tierNumber);
        if (!tier)
            throw new common_1.NotFoundException('Invalid tier number (1, 2, or 3)');
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
    async getTiersForMonth(month, year) {
        const rows = await this.prisma.travelTier.findMany({
            where: { month, year },
            orderBy: { tierNumber: 'asc' },
        });
        return TIER_MIN_MEMBERS.map((def) => {
            const found = rows.find((r) => r.tierNumber === def.tierNumber);
            return (found ?? {
                id: null,
                tierNumber: def.tierNumber,
                minMembers: def.minMembers,
                destinations: [],
                month,
                year,
                isActive: true,
                createdAt: null,
                updatedAt: null,
            });
        });
    }
    async clearTier(tierNumber, month, year) {
        await this.prisma.travelTier.deleteMany({
            where: { tierNumber, month, year },
        });
        return { message: 'Tier cleared' };
    }
    async getUserEligibility(userId) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);
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
        const tiers = await this.prisma.travelTier.findMany({
            where: { month, year, isActive: true },
            orderBy: { tierNumber: 'asc' },
        });
        let unlockedTier = null;
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
    async getAchieversList(month, year) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);
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
        const parentCounts = {};
        for (const m of activeMembers) {
            if (m.parentId) {
                parentCounts[m.parentId] = (parentCounts[m.parentId] ?? 0) + 1;
            }
        }
        const eligibleParentIds = Object.keys(parentCounts).filter((parentId) => parentCounts[parentId] >= 500);
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
            if (count >= 20000)
                tierNumber = 3;
            else if (count >= 5000)
                tierNumber = 2;
            return {
                ...u,
                monthlyNewActiveCount: count,
                tierNumber,
            };
        });
    }
};
exports.TravelService = TravelService;
exports.TravelService = TravelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TravelService);
//# sourceMappingURL=travel.service.js.map