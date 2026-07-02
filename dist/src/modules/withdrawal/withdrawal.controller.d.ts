import { WithdrawStatus } from '@prisma/client';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto, ReviewWithdrawalDto } from './dto/withdrawal.dto';
export declare class WithdrawalController {
    private readonly withdrawalService;
    constructor(withdrawalService: WithdrawalService);
    request(userId: string, dto: CreateWithdrawalDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WithdrawStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import("@prisma/client").$Enums.WithdrawMethod;
        accountDetails: import("@prisma/client/runtime/library").JsonValue;
        reason: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
    }>;
    getMyRequests(userId: string, page?: number, limit?: number): Promise<{
        requests: {
            id: string;
            status: import("@prisma/client").$Enums.WithdrawStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import("@prisma/client").$Enums.WithdrawMethod;
            accountDetails: import("@prisma/client/runtime/library").JsonValue;
            reason: string | null;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getAllRequests(page?: number, limit?: number, status?: WithdrawStatus): Promise<{
        requests: ({
            user: {
                id: string;
                email: string;
                phone: string;
                name: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.WithdrawStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import("@prisma/client").$Enums.WithdrawMethod;
            accountDetails: import("@prisma/client/runtime/library").JsonValue;
            reason: string | null;
            reviewedById: string | null;
            reviewedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    review(id: string, adminId: string, dto: ReviewWithdrawalDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WithdrawStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import("@prisma/client").$Enums.WithdrawMethod;
        accountDetails: import("@prisma/client/runtime/library").JsonValue;
        reason: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
    } | null>;
}
