import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
export declare class CommissionService {
    private readonly prisma;
    private readonly walletService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, configService: ConfigService);
    triggerGenerationCommission(newUserId: string, orderId: string): Promise<void>;
    getCommissionReport(page?: number, limit?: number, userId?: string): Promise<{
        commissions: ({
            toUser: {
                id: string;
                email: string;
                name: string;
            };
            fromUser: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            level: number;
            toUserId: string;
            fromUserId: string;
            orderId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
