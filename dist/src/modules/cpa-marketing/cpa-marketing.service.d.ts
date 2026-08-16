import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateCpaTaskDto, UpdateCpaTaskDto } from './dto/cpa-marketing.dto';
export declare class CpaMarketingService {
    private readonly prisma;
    private readonly walletService;
    constructor(prisma: PrismaService, walletService: WalletService);
    private get db();
    adminCreateTask(dto: CreateCpaTaskDto): Promise<any>;
    adminGetAllTasks(): Promise<any>;
    adminUpdateTask(id: string, dto: UpdateCpaTaskDto): Promise<any>;
    adminDeleteTask(id: string): Promise<{
        message: string;
    }>;
    userGetPublicTasks(userId: string): Promise<any>;
    userBuyTask(userId: string, taskId: string): Promise<{
        message: string;
        purchase: {
            id: any;
            taskId: any;
            title: any;
            description: any;
            redirectLink: any;
            pricePaid: number;
            status: any;
            purchasedAt: any;
        };
    }>;
    userGetMyPurchases(userId: string): Promise<any>;
}
