import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private selectSafeUser;
    findById(id: string): Promise<{
        id: string;
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
    getProfile(id: string): Promise<{
        wallet: {
            balance: import("@prisma/client/runtime/library").Decimal;
            pendingWithdrawal: import("@prisma/client/runtime/library").Decimal;
        } | null;
        activeDaysRemaining: number | null;
        id: string;
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
        id: string;
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
    getActivationStatus(id: string): Promise<{
        status: import("@prisma/client").$Enums.UserStatus;
        activeUntil: Date | null;
        isFirstActivated: boolean;
        isExpired: boolean;
        daysLeft: number;
    }>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
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
    setUserBan(id: string, isBanned: boolean): Promise<{
        id: string;
        name: string;
        isBanned: boolean;
    }>;
}
