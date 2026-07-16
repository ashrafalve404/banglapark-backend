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
declare class UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
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
        totalRevenue: number;
        totalCommissionsPaid: number;
        pendingWithdrawals: number;
        totalProducts: number;
        totalProductValue: number;
        totalCostValue: number;
        totalWithdrawalsApproved: number;
        totalSales: number;
        totalSoldCost: number;
        totalDeliveryCharges: number;
        grossProfit: number;
        netProfit: number;
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
    getUserDetails(id: string): Promise<{
        wallet: {
            balance: number | import("@prisma/client/runtime/library").Decimal;
            pendingWithdrawal: number | import("@prisma/client/runtime/library").Decimal;
            totalEarned: number | import("@prisma/client/runtime/library").Decimal;
        };
        ordersCount: number;
        referralsCount: number;
        totalCommission: number | import("@prisma/client/runtime/library").Decimal;
        totalWithdrawnApproved: number | import("@prisma/client/runtime/library").Decimal;
        parent: {
            id: string;
            memberId: number | null;
            email: string;
            name: string;
        } | null;
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
        isBanned: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserStatement(id: string): Promise<{
        account: {
            usedReferralCode: string | null;
            walletBalance: number;
            pendingWithdrawal: number;
            dailyReward: number;
            tierBonus: number;
            generationIncome: number;
            withdrawable: number;
            id: string;
            memberId: number | null;
            email: string;
            phone: string;
            referralCode: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            referralLink: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            activeFrom: Date | null;
            activeUntil: Date | null;
            isFirstActivated: boolean;
            isBanned: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            type: import("@prisma/client").$Enums.TxType;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            benefitCategory: import("@prisma/client").$Enums.BenefitCategory | null;
        }[];
        withdrawals: {
            id: string;
            status: import("@prisma/client").$Enums.WithdrawStatus;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import("@prisma/client").$Enums.WithdrawMethod;
            accountDetails: import("@prisma/client/runtime/library").JsonValue;
            reviewedAt: Date | null;
        }[];
        team: {
            totalTeam: number;
        };
        orders: {
            totalOrders: number;
            totalSpent: number;
        };
    }>;
    updateUser(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        memberId: number | null;
        email: string;
        phone: string;
        referralCode: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        isBanned: boolean;
        createdAt: Date;
        updatedAt: Date;
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
