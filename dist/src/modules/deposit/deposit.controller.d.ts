import { DepositService } from './deposit.service';
import { DepositStatus } from '@prisma/client';
declare class SubmitDepositDto {
    amount: number;
    transactionId: string;
    senderPhone: string;
}
declare class AdminActionDto {
    adminNote?: string;
}
export declare class DepositController {
    private readonly depositService;
    constructor(depositService: DepositService);
    getAdminInfo(): {
        bkashNumber: string;
    };
    submit(userId: string, dto: SubmitDepositDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DepositStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        transactionId: string;
        senderPhone: string;
        adminNote: string | null;
    }>;
    getMyRequests(userId: string, page?: number, limit?: number): Promise<{
        requests: {
            id: string;
            status: import("@prisma/client").$Enums.DepositStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionId: string;
            senderPhone: string;
            adminNote: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    adminList(page?: number, limit?: number, status?: DepositStatus): Promise<{
        requests: ({
            user: {
                id: string;
                memberId: number | null;
                phone: string;
                name: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.DepositStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionId: string;
            senderPhone: string;
            adminNote: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    approve(id: string, dto: AdminActionDto): Promise<{
        success: boolean;
        message: string;
    }>;
    reject(id: string, dto: AdminActionDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DepositStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        transactionId: string;
        senderPhone: string;
        adminNote: string | null;
    }>;
}
export {};
