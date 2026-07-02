import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyReferralInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true, referralLink: true },
        });
        return user;
    }

    async getTeamStats(userId: string) {
        // Direct children
        const directChildren = await this.prisma.user.findMany({
            where: { parentId: userId },
            select: { id: true, status: true },
        });

        const directCount = directChildren.length;
        const directActive = directChildren.filter((c) => c.status === 'ACTIVE').length;
        const directInactive = directCount - directActive;

        // Total team (recursive active count via DB raw)
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

    // ── Recursive helpers ─────────────────────────────────────────────────────

    /** Count ALL descendants (active + inactive). */
    async countTotalTeam(userId: string): Promise<number> {
        const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
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

    /** Count only ACTIVE descendants. */
    async countActiveTeam(userId: string): Promise<number> {
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

    /** Walk up the tree and return up to N sponsors above userId. */
    async getUplineChain(userId: string, levels: number): Promise<string[]> {
        const result = await this.prisma.$queryRaw<Array<{ id: string; depth: number }>>`
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

    async getDirectReferrals(userId: string, page = 1, limit = 20) {
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
}
