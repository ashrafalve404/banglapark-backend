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
    getDirectReferrals(userId: string, page?: number, limit?: number, status?: string, scope?: string): Promise<{
        data: any[];
        children: any[];
        total: number;
        page: number;
        limit: number;
    }>;
}
