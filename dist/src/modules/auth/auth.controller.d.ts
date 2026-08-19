import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto } from './dto/auth.dto';
declare class GoogleLoginDto {
    idToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        requiresEmailVerification: boolean;
        email: string;
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: any;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        message: string;
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
}
export {};
