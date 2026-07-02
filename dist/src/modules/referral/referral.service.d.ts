import { PrismaService } from '../../prisma/prisma.service';
export declare class ReferralService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyReferralInfo(userId: string): Promise<{
        referralCode: string;
        referralLink: string | null;
    } | null>;
    getTeamStats(userId: string): Promise<{
        directReferrals: number;
        directActive: number;
        directInactive: number;
        totalTeam: number;
        activeTeam: number;
        inactiveTeam: number;
    }>;
    countTotalTeam(userId: string): Promise<number>;
    countActiveTeam(userId: string): Promise<number>;
    getUplineChain(userId: string, levels: number): Promise<string[]>;
    getDirectReferrals(userId: string, page?: number, limit?: number): Promise<{
        children: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.UserStatus;
            activeUntil: Date | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
}
