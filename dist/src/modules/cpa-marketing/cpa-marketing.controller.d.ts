import { CpaMarketingService } from './cpa-marketing.service';
import { CreateCpaTaskDto, UpdateCpaTaskDto } from './dto/cpa-marketing.dto';
export declare class CpaMarketingController {
    private readonly cpaService;
    constructor(cpaService: CpaMarketingService);
    adminGetAllTasks(): Promise<any>;
    adminCreateTask(dto: CreateCpaTaskDto): Promise<any>;
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
