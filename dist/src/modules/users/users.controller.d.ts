import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(id: string): Promise<{
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
    getActivation(id: string): Promise<{
        status: import("@prisma/client").$Enums.UserStatus;
        activeUntil: Date | null;
        isFirstActivated: boolean;
        isExpired: boolean;
        daysLeft: number;
    }>;
    getUser(id: string): Promise<{
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
}
