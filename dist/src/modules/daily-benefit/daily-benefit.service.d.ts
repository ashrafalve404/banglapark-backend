import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
export declare const BENEFIT_TIERS: readonly [{
    readonly minCount: 1;
    readonly amount: 1;
}, {
    readonly minCount: 10;
    readonly amount: 10;
}, {
    readonly minCount: 50;
    readonly amount: 50;
}, {
    readonly minCount: 100;
    readonly amount: 100;
}, {
    readonly minCount: 500;
    readonly amount: 500;
}, {
    readonly minCount: 1000;
    readonly amount: 1000;
}, {
    readonly minCount: 5000;
    readonly amount: 5000;
}, {
    readonly minCount: 10000;
    readonly amount: 10000;
}];
export declare function calculateDailyBenefit(activeTeamCount: number): number;
export declare function calculateTierBonus(activeTeamCount: number): number;
export declare const DAILY_BENEFIT_QUEUE = "daily-benefit";
export declare class DailyBenefitService {
    private readonly prisma;
    private readonly walletService;
    private readonly benefitQueue;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, benefitQueue: Queue);
    deactivateExpiredUsers(): Promise<void>;
    scheduleDailyBenefit(): Promise<void>;
    payBenefitForUser(userId: string, dateStr: string): Promise<void>;
    getLogs(userId?: string, page?: number, limit?: number): Promise<{
        logs: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            teamCount: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getTiers(): readonly [{
        readonly minCount: 1;
        readonly amount: 1;
    }, {
        readonly minCount: 10;
        readonly amount: 10;
    }, {
        readonly minCount: 50;
        readonly amount: 50;
    }, {
        readonly minCount: 100;
        readonly amount: 100;
    }, {
        readonly minCount: 500;
        readonly amount: 500;
    }, {
        readonly minCount: 1000;
        readonly amount: 1000;
    }, {
        readonly minCount: 5000;
        readonly amount: 5000;
    }, {
        readonly minCount: 10000;
        readonly amount: 10000;
    }];
}
