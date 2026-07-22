import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateWithdrawalDto, ReviewWithdrawalDto } from './dto/withdrawal.dto';
import { WithdrawStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
export declare class WithdrawalService {
    private readonly prisma;
    private readonly walletService;
    private readonly configService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, walletService: WalletService, configService: ConfigService, notificationsService: NotificationsService);
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
    review(withdrawalId: string, adminId: string, dto: ReviewWithdrawalDto): Promise<{
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
}
