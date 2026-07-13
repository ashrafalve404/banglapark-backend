import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(id: string): Promise<{
        usedReferralCode: string | null;
        wallet: {
            balance: import("@prisma/client/runtime/library").Decimal;
            pendingWithdrawal: import("@prisma/client/runtime/library").Decimal;
        } | null;
        activeDaysRemaining: number | null;
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
    }>;
    updateProfile(id: string, dto: UpdateProfileDto): Promise<{
        usedReferralCode: string | null;
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
    }>;
    getStatement(id: string): Promise<{
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
    getActivation(id: string): Promise<{
        status: import("@prisma/client").$Enums.UserStatus;
        activeUntil: Date | null;
        isFirstActivated: boolean;
        isExpired: boolean;
        daysLeft: number;
    }>;
    getUser(id: string): Promise<{
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
    }>;
}
