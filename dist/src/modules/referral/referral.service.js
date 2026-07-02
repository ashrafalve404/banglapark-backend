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
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReferralService = class ReferralService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyReferralInfo(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true, referralLink: true },
        });
        return user;
    }
    async getTeamStats(userId) {
        const directChildren = await this.prisma.user.findMany({
            where: { parentId: userId },
            select: { id: true, status: true },
        });
        const directCount = directChildren.length;
        const directActive = directChildren.filter((c) => c.status === 'ACTIVE').length;
        const directInactive = directCount - directActive;
        const totalTeam = await this.countTotalTeam(userId);
        const activeTeam = await this.countActiveTeam(userId);
        return {
            directReferrals: directCount,
            directActive,
            directInactive,
            totalTeam,
            activeTeam,
            inactiveTeam: totalTeam - activeTeam,
        };
    }
    async countTotalTeam(userId) {
        const result = await this.prisma.$queryRaw `
      WITH RECURSIVE team AS (
        SELECT id FROM "User" WHERE "parentId" = ${userId}
        UNION ALL
        SELECT u.id FROM "User" u
        INNER JOIN team t ON u."parentId" = t.id
      )
      SELECT COUNT(*) as count FROM team
    `;
        return Number(result[0]?.count ?? 0);
    }
    async countActiveTeam(userId) {
        const result = await this.prisma.$queryRaw `
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
    async getUplineChain(userId, levels) {
        const result = await this.prisma.$queryRaw `
      WITH RECURSIVE upline AS (
        SELECT "parentId" as id, 1 as depth
        FROM "User" WHERE id = ${userId}
        UNION ALL
        SELECT u."parentId", ul.depth + 1
        FROM "User" u
        INNER JOIN upline ul ON u.id = ul.id
        WHERE ul.depth < ${levels} AND u."parentId" IS NOT NULL
      )
      SELECT id, depth FROM upline WHERE id IS NOT NULL ORDER BY depth ASC
    `;
        return result.map((r) => r.id);
    }
    async getDirectReferrals(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [children, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { parentId: userId },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    createdAt: true,
                    activeUntil: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where: { parentId: userId } }),
        ]);
        return { children, total, page, limit };
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map