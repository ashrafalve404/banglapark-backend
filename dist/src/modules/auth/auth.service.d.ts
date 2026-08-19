import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
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
    private addParentReferralCode;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    googleLogin(idToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    private generateUniqueReferralCode;
    private generateTokens;
}
