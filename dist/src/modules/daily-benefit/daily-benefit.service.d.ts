import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
export declare const BENEFIT_TIERS: readonly [{
    readonly minCount: 10000;
    readonly amount: 5000;
}, {
    readonly minCount: 5000;
    readonly amount: 2000;
}, {
    readonly minCount: 500;
    readonly amount: 1000;
}, {
    readonly minCount: 100;
    readonly amount: 500;
}, {
    readonly minCount: 50;
    readonly amount: 300;
}, {
    readonly minCount: 20;
    readonly amount: 200;
}, {
    readonly minCount: 5;
    readonly amount: 100;
}];
export declare function calculateDailyBenefit(activeTeamCount: number): number;
export declare const DAILY_BENEFIT_QUEUE = "daily-benefit";
export declare class DailyBenefitService {
    private readonly prisma;
    private readonly walletService;
    private readonly benefitQueue;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, benefitQueue: Queue);
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
            teamCount: number;
            date: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getTiers(): readonly [{
        readonly minCount: 10000;
        readonly amount: 5000;
    }, {
        readonly minCount: 5000;
        readonly amount: 2000;
    }, {
        readonly minCount: 500;
        readonly amount: 1000;
    }, {
        readonly minCount: 100;
        readonly amount: 500;
    }, {
        readonly minCount: 50;
        readonly amount: 300;
    }, {
        readonly minCount: 20;
        readonly amount: 200;
    }, {
        readonly minCount: 5;
        readonly amount: 100;
    }];
}
