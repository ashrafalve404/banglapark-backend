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

    async getDirectReferrals(userId: string, page = 1, limit = 20, status?: string, scope?: string) {
        const skip = (page - 1) * limit;

        if (scope === 'all_levels') {
            const members = await this.prisma.$queryRaw<any[]>`
                WITH RECURSIVE team AS (
                    SELECT id, "memberId", name, phone, email, status, "createdAt", "activeUntil"
                    FROM "User" WHERE "parentId" = ${userId}
                    UNION ALL
                    SELECT u.id, u."memberId", u.name, u.phone, u.email, u.status, u."createdAt", u."activeUntil"
                    FROM "User" u
                    INNER JOIN team t ON u."parentId" = t.id
                )
                SELECT * FROM team
                ${status === 'ACTIVE' ? this.prisma.$queryRaw`WHERE status = 'ACTIVE'` : status === 'INACTIVE' ? this.prisma.$queryRaw`WHERE status = 'INACTIVE'` : this.prisma.$queryRaw``}
                ORDER BY "createdAt" DESC
                LIMIT ${limit} OFFSET ${skip}
            `;

            const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
                WITH RECURSIVE team AS (
                    SELECT id, status FROM "User" WHERE "parentId" = ${userId}
                    UNION ALL
                    SELECT u.id, u.status FROM "User" u
                    INNER JOIN team t ON u."parentId" = t.id
                )
                SELECT COUNT(*) as count FROM team
                ${status === 'ACTIVE' ? this.prisma.$queryRaw`WHERE status = 'ACTIVE'` : status === 'INACTIVE' ? this.prisma.$queryRaw`WHERE status = 'INACTIVE'` : this.prisma.$queryRaw``}
            `;

            const total = Number(countResult[0]?.count ?? 0);
            return { data: members, children: members, total, page, limit };
        }

        const where: any = { parentId: userId };
        if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
            where.status = status;
        }

        const [children, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    memberId: true,
                    name: true,
                    phone: true,
                    email: true,
                    status: true,
                    createdAt: true,
                    activeUntil: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { data: children, children, total, page, limit };
    }
}
