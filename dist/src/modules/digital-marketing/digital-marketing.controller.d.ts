import { DigitalMarketingService } from './digital-marketing.service';
declare class PurchasePackageDto {
    packageId: string;
}
declare class CreatePackageDto {
    title: string;
    description?: string;
    image?: string;
    link?: string;
    price: number;
    profitPercent?: number;
    durationHours?: number;
    isHidden?: boolean;
    sortOrder?: number;
}
declare class UpdatePackageDto {
    title?: string;
    description?: string;
    image?: string;
    link?: string;
    price?: number;
    profitPercent?: number;
    durationHours?: number;
    isHidden?: boolean;
    sortOrder?: number;
}
export declare class DigitalMarketingController {
    private readonly dmService;
    constructor(dmService: DigitalMarketingService);
    getPackages(): Promise<any[]>;
    purchase(userId: string, dto: PurchasePackageDto): Promise<{
        success: boolean;
        message: string;
        purchase: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            userId: string;
            packageId: any;
            amount: number;
            profitAmount: number;
            totalReturn: number;
            status: string;
            purchasedAt: string;
            maturesAt: Date;
        };
    }>;
    getMyPurchases(userId: string): Promise<{
        purchases: any[];
        active: any[];
        completed: any[];
        now: string;
    }>;
    adminGetAllPackages(): Promise<any[]>;
    adminCreatePackage(dto: CreatePackageDto): Promise<any>;
    adminUpdatePackage(id: string, dto: UpdatePackageDto): Promise<any>;
    adminDeletePackage(id: string): Promise<{
        success: boolean;
    }>;
    adminGetAllPurchases(page?: number, limit?: number, status?: string): Promise<{
        purchases: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export {};
