import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export declare class AdminService {
    private readonly prisma;
    private readonly usersService;
    constructor(prisma: PrismaService, usersService: UsersService);
    getPlatformStats(): Promise<{
        users: {
            total: number;
            active: number;
            inactive: number;
        };
        orders: {
            total: number;
            delivered: number;
        };
        totalCommissionsPaid: number | import("@prisma/client/runtime/library").Decimal;
        pendingWithdrawals: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string): Promise<{
        users: {
            id: string;
            email: string;
            phone: string;
            referralCode: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            referralLink: string | null;
            parentId: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            activeUntil: Date | null;
            isFirstActivated: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    banUser(userId: string): Promise<{
        id: string;
        name: string;
        isBanned: boolean;
    }>;
    unbanUser(userId: string): Promise<{
        id: string;
        name: string;
        isBanned: boolean;
    }>;
    overrideActivation(userId: string, activate: boolean): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        activeUntil: Date | null;
    }>;
    getConfig(key: string): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    setConfig(key: string, value: any): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getAllConfigs(): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
}
