import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { DepositStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
export declare const ADMIN_BKASH_NUMBER = "01823674796";
export declare class DepositService implements OnModuleInit {
    private readonly prisma;
    private readonly walletService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, walletService: WalletService, notificationsService: NotificationsService);
    onModuleInit(): Promise<void>;
    private ensureTablesAndEnums;
    submitRequest(userId: string, dto: {
        amount: number;
        transactionId: string;
        senderPhone: string;
    }): Promise<{
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
    approve(requestId: string, adminNote?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    reject(requestId: string, adminNote?: string): Promise<{
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
