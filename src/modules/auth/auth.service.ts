import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    // ── Register ──────────────────────────────────────────────────────────────
    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (existing) {
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
                    createdAt: true,
                },
            });

            // Create wallet
            await tx.wallet.create({ data: { userId: newUser.id } });

            return newUser;
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return { user: { ...user, usedReferralCode: dto.referralCode || null }, ...tokens };
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

        if (!payload?.email) {
            throw new BadRequestException('Google account has no email');
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split('@')[0];

        // Find existing user by Google ID or email
        let user = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { id: googleId }] },
        });

        if (!user) {
            // Create new user from Google profile
            const referralCode = await this.generateUniqueReferralCode();
            const baseUrl = this.configService.get<string>('app.referralBaseUrl');
            user = await this.prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        id: googleId,
                        name,
                        email,
                        phone: '',
                        passwordHash: '',
                        referralCode,
                        referralLink: `${baseUrl}?ref=${referralCode}`,
                    },
                });
                await tx.wallet.create({ data: { userId: newUser.id } });
                return newUser;
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
        });
        return { user: userObj, ...tokens };
    }

    // ── Refresh tokens ─────────────────────────────────────────────────────────
    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('app.jwtRefreshSecret'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, email: true, role: true, isBanned: true },
            });
            if (!user || user.isBanned) throw new Error();
            return this.generateTokens(user.id, user.email, user.role);
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    // ── Token generation ──────────────────────────────────────────────────────
    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('app.jwtAccessSecret'),
                expiresIn: this.configService.get<any>('app.jwtAccessExpiry'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('app.jwtRefreshSecret'),
                expiresIn: this.configService.get<any>('app.jwtRefreshExpiry'),
            }),
        ]);

        return { accessToken, refreshToken };
    }

    // ── Unique referral code generator ────────────────────────────────────────
    private async generateUniqueReferralCode(): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code: string;
        let attempts = 0;
        do {
            code = 'REF-' + Array.from({ length: 8 }, () =>
                chars[Math.floor(Math.random() * chars.length)],
            ).join('');
            const existing = await this.prisma.user.findUnique({ where: { referralCode: code } });
            if (!existing) break;
        } while (++attempts < 10);
        return code!;
    }
}
