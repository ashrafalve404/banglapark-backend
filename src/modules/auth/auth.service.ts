import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
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
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
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
        return { user, ...tokens };
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
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
            ...tokens,
        };
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
