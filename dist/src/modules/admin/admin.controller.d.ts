import { AdminService } from './admin.service';
import { Role } from '@prisma/client';
declare class SetConfigDto {
    key: string;
    value: Record<string, unknown>;
}
declare class CreateUserDto {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: Role;
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        users: {
            total: number;
            active: number;
            inactive: number;
        };
        orders: {
            total: number;
            delivered: number;
        };
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
        totalCommissionsPaid: number | import("@prisma/client/runtime/library").Decimal;
        pendingWithdrawals: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string): Promise<{
        users: {
            id: string;
            memberId: number | null;
            email: string;
            phone: string;
            referralCode: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            referralLink: string | null;
            parentId: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            activeFrom: Date | null;
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
    createUser(dto: CreateUserDto): Promise<{
        id: string;
        memberId: number | null;
        email: string;
        phone: string;
        referralCode: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
    }>;
    ban(id: string): Promise<{
        id: string;
        name: string;
        isBanned: boolean;
    }>;
    unban(id: string): Promise<{
        id: string;
        name: string;
        isBanned: boolean;
    }>;
    activate(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        activeFrom: Date | null;
        activeUntil: Date | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        activeFrom: Date | null;
        activeUntil: Date | null;
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    deleteOrder(id: string): Promise<{
        message: string;
    }>;
    getConfigs(): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    setConfig(dto: SetConfigDto): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
export {};
