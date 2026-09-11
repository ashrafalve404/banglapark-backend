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
    getPackages(): Promise<any[]>;
    purchasePackage(userId: string, packageId: string): Promise<{
        success: boolean;
        message: string;
        purchase: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            userId: string;
            packageId: any;
            amount: number;
            dailyProfitPercent: number;
            dailyProfitAmount: number;
            daysTotal: number;
            daysPaid: number;
            totalEarned: number;
            status: string;
            purchasedAt: string;
        };
    }>;
    getMyPurchases(userId: string): Promise<{
        purchases: any[];
        active: any[];
        completed: any[];
        now: string;
    }>;
    processDailyProfitPayouts(): Promise<void>;
    adminGetAllPackages(): Promise<any[]>;
    adminCreatePackage(dto: {
        title: string;
        description?: string;
        image?: string;
        link?: string;
        price: number;
        profitPercent?: number;
        dailyProfitPercent?: number;
        durationDays?: number;
        isHidden?: boolean;
        sortOrder?: number;
    }): Promise<any>;
    adminUpdatePackage(id: string, dto: {
        title?: string;
        description?: string;
        image?: string;
        link?: string;
        price?: number;
        profitPercent?: number;
        dailyProfitPercent?: number;
        durationDays?: number;
        isHidden?: boolean;
        sortOrder?: number;
    }): Promise<any>;
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
