import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    // ── Register ──────────────────────────────────────────────────────────────
    async register(dto: RegisterDto) {
        const DISPOSABLE_DOMAINS = new Set([
            'toooby.com', 'tabeebee.com', 'tempmail.com', 'temp-mail.org', 'mailinator.com',
            '10minutemail.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com',
            'dispostable.com', 'getairmail.com', 'throwawaymail.com', 'fakeinbox.com', 'maildrop.cc',
            'crazymailing.com', 'tmailor.com', 'burnermail.io', 'generator.email', 'dropmail.me',
            'mohmal.com', 'inboxkitten.com', 'tempail.com', 'tempmail.net', 'fakemailgenerator.com'
        ]);

        const domain = dto.email.split('@')[1]?.toLowerCase().trim();
        if (domain && (DISPOSABLE_DOMAINS.has(domain) || domain.includes('temp') || domain.includes('fake') || domain.includes('trash') || domain.includes('disposable') || domain.includes('text0') || domain.includes('test0'))) {
            throw new BadRequestException('Disposable or temporary email domains are not allowed. Please use a valid email address.');
        }

        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });

        if (existing) {
            // If the account is unverified, refresh the OTP and allow completion
            if (existing.isEmailVerified === false && existing.emailVerificationOtp) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
                const passwordHash = await bcrypt.hash(dto.password, 12);

                await this.prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        name: dto.name,
                        passwordHash,
                        emailVerificationOtp: otp,
                        emailVerificationExpires,
                    },
                });

                await this.emailService.sendVerificationEmail(existing.email, dto.name, otp);

                return {
                    requiresEmailVerification: true,
                    email: existing.email,
                    message: 'A fresh 6-digit verification code has been sent to your email.',
                };
            }

            throw new ConflictException('Email or phone already in use');
        }

        // Validate referral code if provided
        let parentId: string | undefined;
        if (dto.referralCode) {
            const parent = await this.prisma.user.findUnique({
                where: { referralCode: dto.referralCode },
            });
            if (!parent) throw new BadRequestException('Invalid referral code');
            parentId = parent.id;
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const referralCode = await this.generateUniqueReferralCode();
        const baseUrl = this.configService.get<string>('app.referralBaseUrl');
        const referralLink = `${baseUrl}?ref=${referralCode}`;

        const maxMemberId = await this.prisma.user.aggregate({ _max: { memberId: true } });
        const nextMemberId = (maxMemberId._max.memberId ?? 100) + 1;

        // Generate 6-digit OTP code & 15-minute expiration
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    referralCode,
                    referralLink,
                    parentId,
                    memberId: nextMemberId,
                    isEmailVerified: false,
                    emailVerificationOtp: otp,
                    emailVerificationExpires,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    memberId: true,
                    referralCode: true,
                    referralLink: true,
                    isEmailVerified: true,
                    createdAt: true,
                },
            });

            // Create wallet
            await tx.wallet.create({ data: { userId: newUser.id } });

            return newUser;
        });

        // Send OTP verification email via Resend
        await this.emailService.sendVerificationEmail(user.email, user.name, otp);

        return {
            requiresEmailVerification: true,
            email: user.email,
            message: 'Registration successful! A 6-digit verification code has been sent to your email.',
        };
    }

    // ── Verify Email ─────────────────────────────────────────────────────────
    async verifyEmail(dto: VerifyEmailDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            const tokens = await this.generateTokens(user.id, user.email, user.role);
            return { message: 'Email is already verified.', user, ...tokens };
        }

        if (!user.emailVerificationOtp || user.emailVerificationOtp !== dto.otp.trim()) {
            throw new BadRequestException('Invalid verification code. Please check and try again.');
        }

        if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            throw new BadRequestException('Verification code has expired. Please request a new code.');
        }

        // Update user to verified
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationOtp: null,
                emailVerificationExpires: null,
            },
            select: {
                id: true,
                memberId: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                referralCode: true,
                referralLink: true,
                parentId: true,
                isEmailVerified: true,
            },
        });

        const tokens = await this.generateTokens(updatedUser.id, updatedUser.email, updatedUser.role);
        const userObj = await this.addParentReferralCode(updatedUser);

        return {
            message: 'Email verified successfully! Welcome to Bangla Park Limited.',
            user: userObj,
            ...tokens,
        };
    }

    // ── Resend Verification Code ─────────────────────────────────────────────
    async resendVerification(dto: ResendVerificationDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email is already verified. You can log in.');
        }

        // Generate fresh 6-digit OTP code & 15-minute expiration
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationOtp: otp,
                emailVerificationExpires,
            },
        });

        await this.emailService.sendVerificationEmail(user.email, user.name, otp);

        return {
            message: 'Verification code resent successfully. Please check your email.',
        };
    }

    private async addParentReferralCode(userObj: any) {
        let usedReferralCode: string | null = null;
        if (userObj.parentId) {
            const parent = await this.prisma.user.findUnique({
                where: { id: userObj.parentId },
                select: { referralCode: true },
            });
            usedReferralCode = parent?.referralCode || null;
        }
        return { ...userObj, usedReferralCode };
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.isBanned) {
            throw new UnauthorizedException('Account is banned');
        }

        // Auto-verify existing accounts created before OTP verification
        if (user.isEmailVerified === false && !user.emailVerificationOtp) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
            user.isEmailVerified = true;
        }

        // Block newly registered accounts that have a pending OTP verification
        if (user.isEmailVerified === false && user.emailVerificationOtp) {
            throw new ForbiddenException({
                statusCode: 403,
                message: 'Email not verified. Please verify your email to access your account.',
                requiresEmailVerification: true,
                email: user.email,
            });
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const userObj = await this.addParentReferralCode({
            id: user.id,
            memberId: user.memberId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            referralCode: user.referralCode,
            referralLink: user.referralLink,
            parentId: user.parentId,
            isEmailVerified: user.isEmailVerified ?? true,
        });
        return { user: userObj, ...tokens };
    }

    // ── Google Login ─────────────────────────────────────────────────────────
    async googleLogin(idToken: string) {
        const clientId = this.configService.get<string>('app.googleClientId');
        if (!clientId) throw new BadRequestException('Google login not configured');

        const client = new OAuth2Client(clientId);
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: clientId,
            });
            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedException('Invalid Google token');
        }

        if (!payload || !payload.email) {
            throw new BadRequestException('Google token payload missing email');
        }

        let user = await this.prisma.user.findUnique({
            where: { email: payload.email },
        });

        if (!user) {
            const referralCode = await this.generateUniqueReferralCode();
            const baseUrl = this.configService.get<string>('app.referralBaseUrl');
            const referralLink = `${baseUrl}?ref=${referralCode}`;

            const maxMemberId = await this.prisma.user.aggregate({ _max: { memberId: true } });
            const nextMemberId = (maxMemberId._max.memberId ?? 100) + 1;

            const randomPassword = Math.random().toString(36).slice(-12);
            const passwordHash = await bcrypt.hash(randomPassword, 12);
            const fallbackPhone = `+880${Math.floor(100000000 + Math.random() * 900000000)}`;

            user = await this.prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        name: payload.name || payload.email.split('@')[0],
                        email: payload.email,
                        phone: fallbackPhone,
                        passwordHash,
                        referralCode,
                        referralLink,
                        memberId: nextMemberId,
                        isEmailVerified: true, // Google accounts auto-verified
                    },
                });
                await tx.wallet.create({ data: { userId: newUser.id } });
                return newUser;
            });
        } else if (!user.isEmailVerified) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
        }

        if (user.isBanned) {
            throw new UnauthorizedException('Account is banned');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const userObj = await this.addParentReferralCode({
            id: user.id,
            memberId: user.memberId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            referralCode: user.referralCode,
            referralLink: user.referralLink,
            parentId: user.parentId,
            isEmailVerified: true,
        });

        return { user: userObj, ...tokens };
    }

    // ── Helper: Unique Referral Code Generator ──────────────────────────────
    private async generateUniqueReferralCode(): Promise<string> {
        let code = '';
        let isUnique = false;

        while (!isUnique) {
            code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const existing = await this.prisma.user.findUnique({
                where: { referralCode: code },
            });
            if (!existing) isUnique = true;
        }

        return code;
    }

    // ── Helper: Token Generator ────────────────────────────────────────────────
    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };
        const secret = this.configService.get<string>('app.jwtAccessSecret') || process.env.JWT_ACCESS_SECRET || 'access_secret';
        const refreshSecret = this.configService.get<string>('app.jwtRefreshSecret') || process.env.JWT_REFRESH_SECRET || 'refresh_secret';
        const expiresIn = (this.configService.get<string>('app.jwtAccessExpiry') || '7d') as any;
        const refreshExpiresIn = (this.configService.get<string>('app.jwtRefreshExpiry') || '30d') as any;

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret,
                expiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: refreshExpiresIn,
            }),
        ]);

        return { accessToken, refreshToken };
    }
}
