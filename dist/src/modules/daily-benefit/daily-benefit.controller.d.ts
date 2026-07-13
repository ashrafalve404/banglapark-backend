import { DailyBenefitService } from './daily-benefit.service';
export declare class DailyBenefitController {
    private readonly dailyBenefitService;
    constructor(dailyBenefitService: DailyBenefitService);
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
    getMyLogs(userId: string, page?: number, limit?: number): Promise<{
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
    getAllLogs(page?: number, limit?: number): Promise<{
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
}
