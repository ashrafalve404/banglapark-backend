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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    selectSafeUser = {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        activeUntil: true,
        isFirstActivated: true,
        referralCode: true,
        referralLink: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
    };
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: this.selectSafeUser,
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async getProfile(id) {
        const user = await this.findById(id);
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: id },
            select: { balance: true, pendingWithdrawal: true },
        });
        const daysLeft = user.activeUntil
            ? Math.max(0, Math.ceil((new Date(user.activeUntil).getTime() - Date.now()) / 86_400_000))
            : null;
        return { ...user, wallet, activeDaysRemaining: daysLeft };
    }
    async updateProfile(id, dto) {
        const data = {};
        if (dto.name)
            data.name = dto.name;
        if (dto.password)
            data.passwordHash = await bcrypt.hash(dto.password, 12);
        return this.prisma.user.update({
            where: { id },
            data,
            select: this.selectSafeUser,
        });
    }
    async getActivationStatus(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { status: true, activeUntil: true, isFirstActivated: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const now = new Date();
        const isExpired = user.activeUntil ? user.activeUntil < now : true;
        const daysLeft = user.activeUntil
            ? Math.max(0, Math.ceil((user.activeUntil.getTime() - now.getTime()) / 86_400_000))
            : 0;
        return {
            status: user.status,
            activeUntil: user.activeUntil,
            isFirstActivated: user.isFirstActivated,
            isExpired,
            daysLeft,
        };
    }
    async findAll(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ],
            }
            : {};
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: this.selectSafeUser,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async setUserBan(id, isBanned) {
        return this.prisma.user.update({
            where: { id },
            data: { isBanned },
            select: { id: true, name: true, isBanned: true },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map