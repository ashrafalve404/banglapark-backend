import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
declare class GoogleLoginDto {
    idToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            usedReferralCode: string | null;
            id: string;
            memberId: number | null;
            email: string;
            phone: string;
            referralCode: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            referralLink: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    googleLogin(dto: GoogleLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): {
        message: string;
        userId: string;
    };
    forgotPassword(dto: ForgotPasswordDto): {
        message: string;
    };
    resetPassword(_dto: ResetPasswordDto): {
        message: string;
    };
}
export {};
