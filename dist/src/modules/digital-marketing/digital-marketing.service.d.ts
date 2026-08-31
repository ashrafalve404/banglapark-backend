import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class DigitalMarketingService implements OnModuleInit {
    private readonly prisma;
    private readonly walletService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, walletService: WalletService, notificationsService: NotificationsService);
    onModuleInit(): Promise<void>;
    private ensureTablesAndEnums;
    private seedDefaultPackagesIfEmpty;
    getPackages(): Promise<any>;
    purchasePackage(userId: string, packageId: string): Promise<{
        success: boolean;
        message: string;
        purchase: any;
    }>;
    getMyPurchases(userId: string): Promise<{
        purchases: any;
        active: any;
        completed: any;
        now: string;
    }>;
    processMaturedPurchases(): Promise<void>;
    adminGetAllPackages(): Promise<any>;
    adminCreatePackage(dto: {
        title: string;
        description?: string;
        price: number;
        profitPercent?: number;
        durationHours?: number;
        isHidden?: boolean;
        sortOrder?: number;
    }): Promise<any>;
    adminUpdatePackage(id: string, dto: {
        title?: string;
        description?: string;
        price?: number;
        profitPercent?: number;
        durationHours?: number;
        isHidden?: boolean;
        sortOrder?: number;
    }): Promise<any>;
    adminDeletePackage(id: string): Promise<any>;
    adminGetAllPurchases(page?: number, limit?: number, status?: string): Promise<{
        purchases: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
