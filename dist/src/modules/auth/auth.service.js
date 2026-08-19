"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    emailService;
    constructor(prisma, jwtService, configService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (existing) {
            throw new common_1.ConflictException('Email or phone already in use');
        }
        let parentId;
        if (dto.referralCode) {
            const parent = await this.prisma.user.findUnique({
                where: { referralCode: dto.referralCode },
            });
            if (!parent)
                throw new common_1.BadRequestException('Invalid referral code');
            parentId = parent.id;
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const referralCode = await this.generateUniqueReferralCode();
        const baseUrl = this.configService.get('app.referralBaseUrl');
        const referralLink = `${baseUrl}?ref=${referralCode}`;
        const maxMemberId = await this.prisma.user.aggregate({ _max: { memberId: true } });
        const nextMemberId = (maxMemberId._max.memberId ?? 100) + 1;
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
            await tx.wallet.create({ data: { userId: newUser.id } });
            return newUser;
        });
        await this.emailService.sendVerificationEmail(user.email, user.name, otp);
        return {
            requiresEmailVerification: true,
            email: user.email,
            message: 'Registration successful! A 6-digit verification code has been sent to your email.',
        };
    }
    async verifyEmail(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            const tokens = await this.generateTokens(user.id, user.email, user.role);
            return { message: 'Email is already verified.', user, ...tokens };
        }
        if (!user.emailVerificationOtp || user.emailVerificationOtp !== dto.otp.trim()) {
            throw new common_1.BadRequestException('Invalid verification code. Please check and try again.');
        }
        if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            throw new common_1.BadRequestException('Verification code has expired. Please request a new code.');
        }
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
    async resendVerification(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email is already verified. You can log in.');
        }
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
    async addParentReferralCode(userObj) {
        let usedReferralCode = null;
        if (userObj.parentId) {
            const parent = await this.prisma.user.findUnique({
                where: { id: userObj.parentId },
                select: { referralCode: true },
            });
            usedReferralCode = parent?.referralCode || null;
        }
        return { ...userObj, usedReferralCode };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isBanned) {
            throw new common_1.UnauthorizedException('Account is banned');
        }
        if (user.isEmailVerified === false && user.emailVerificationOtp) {
            throw new common_1.UnauthorizedException({
                statusCode: 401,
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
    async googleLogin(idToken) {
        const clientId = this.configService.get('app.googleClientId');
        if (!clientId)
            throw new common_1.BadRequestException('Google login not configured');
        const client = new google_auth_library_1.OAuth2Client(clientId);
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: clientId,
            });
            payload = ticket.getPayload();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        if (!payload || !payload.email) {
            throw new common_1.BadRequestException('Google token payload missing email');
        }
        let user = await this.prisma.user.findUnique({
            where: { email: payload.email },
        });
        if (!user) {
            const referralCode = await this.generateUniqueReferralCode();
            const baseUrl = this.configService.get('app.referralBaseUrl');
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
                        isEmailVerified: true,
                    },
                });
                await tx.wallet.create({ data: { userId: newUser.id } });
                return newUser;
            });
        }
        else if (!user.isEmailVerified) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
        }
        if (user.isBanned) {
            throw new common_1.UnauthorizedException('Account is banned');
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
    async generateUniqueReferralCode() {
        let code = '';
        let isUnique = false;
        while (!isUnique) {
            code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const existing = await this.prisma.user.findUnique({
                where: { referralCode: code },
            });
            if (!existing)
                isUnique = true;
        }
        return code;
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const secret = this.configService.get('jwt.secret') || 'default-secret';
        const refreshSecret = this.configService.get('jwt.refreshSecret') || 'default-refresh-secret';
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret,
                expiresIn: (this.configService.get('jwt.expiresIn') || '1d'),
            }),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: (this.configService.get('jwt.refreshExpiresIn') || '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map