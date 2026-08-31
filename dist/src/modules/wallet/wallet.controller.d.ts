import { TxType } from '@prisma/client';
import { WalletService } from './wallet.service';
declare class TransferDto {
    recipientPhone: string;
    amount: number;
}
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
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
    getTransactions(userId: string, page?: number, limit?: number, type?: TxType, from?: string, to?: string): Promise<{
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
    lookupRecipient(phone: string): Promise<{
        id: string;
        name: string;
        phone: string;
    }>;
    transfer(userId: string, body: TransferDto): Promise<{
        success: boolean;
        message: string;
        referenceId: string;
    }>;
}
export {};
