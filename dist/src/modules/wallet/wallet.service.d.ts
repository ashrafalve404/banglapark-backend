import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
type AnyPrismaTx = {
    wallet: {
        update: (args: unknown) => Promise<{
            balance: any;
        }>;
        findUnique: (args: unknown) => Promise<{
            balance: unknown;
        } | null>;
    };
    walletTransaction: {
        create: (args: unknown) => Promise<unknown>;
    };
};
export declare class WalletService implements OnModuleInit {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    onModuleInit(): Promise<void>;
    private ensureEnumsExist;
    credit(tx: AnyPrismaTx, walletId: string, amount: number, type: string, description: string, referenceId?: string, benefitCategory?: string): Promise<{
        balance: unknown;
    }>;
    debit(tx: AnyPrismaTx, walletId: string, amount: number, type: string, description: string, referenceId?: string): Promise<{
        balance: unknown;
    }>;
    getBalance(userId: string): Promise<{
        availableBalance: number;
        dailyBenefit: number;
        dailyReward: number;
        tierBonus: number;
        generationIncome: number;
        quizEarning: number;
        salary: number;
        productSalesIncome: number;
        reward: number;
        travelling: number;
        share: number;
        id: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        pendingWithdrawal: import("@prisma/client/runtime/library").Decimal;
    }>;
    getTransactions(userId: string, page?: number, limit?: number, type?: string, from?: Date, to?: Date): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            type: import("@prisma/client").$Enums.TxType;
            walletId: string;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            referenceId: string | null;
            benefitCategory: import("@prisma/client").$Enums.BenefitCategory | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getWalletId(userId: string): Promise<string>;
    lookupRecipient(phone: string): Promise<{
        id: string;
        name: string;
        phone: string;
    }>;
    transfer(senderId: string, recipientPhone: string, rawAmount: number): Promise<{
        success: boolean;
        message: string;
        referenceId: string;
    }>;
}
export {};
