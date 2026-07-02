import { ReferralService } from './referral.service';
export declare class ReferralController {
    private readonly referralService;
    constructor(referralService: ReferralService);
    getMyReferral(userId: string): Promise<{
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
