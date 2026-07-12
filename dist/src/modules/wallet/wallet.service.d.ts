import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
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
export declare class WalletService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        reward: number;
        salary: number;
        travelling: number;
        share: number;
        id: string;
        balance: Prisma.Decimal;
        pendingWithdrawal: Prisma.Decimal;
    }>;
    getTransactions(userId: string, page?: number, limit?: number, type?: string, from?: Date, to?: Date): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            amount: Prisma.Decimal;
            type: import("@prisma/client").$Enums.TxType;
            walletId: string;
            benefitCategory: import("@prisma/client").$Enums.BenefitCategory | null;
            balanceAfter: Prisma.Decimal;
            referenceId: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getWalletId(userId: string): Promise<string>;
}
export {};
