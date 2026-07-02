"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let WalletService = class WalletService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async credit(tx, walletId, amount, type, description, referenceId) {
        const wallet = await tx.wallet.update({
            where: { id: walletId },
            data: { balance: { increment: amount } },
        });
        await tx.walletTransaction.create({
            data: {
                walletId,
                type,
                amount,
                balanceAfter: wallet.balance,
                referenceId: referenceId ?? null,
                description,
            },
        });
        return wallet;
    }
    async debit(tx, walletId, amount, type, description, referenceId) {
        const current = await tx.wallet.findUnique({
            where: { id: walletId },
        });
        if (!current)
            throw new common_1.NotFoundException('Wallet not found');
        const currentBalance = Number(current.balance);
        if (currentBalance < amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        const wallet = await tx.wallet.update({
            where: { id: walletId },
            data: { balance: { decrement: amount } },
        });
        await tx.walletTransaction.create({
            data: {
                walletId,
                type,
                amount,
                balanceAfter: wallet.balance,
                referenceId: referenceId ?? null,
                description,
            },
        });
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true, balance: true, pendingWithdrawal: true },
        });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        const balance = Number(wallet.balance);
        const pending = Number(wallet.pendingWithdrawal);
        return {
            ...wallet,
            availableBalance: balance - pending,
        };
    }
    async getTransactions(userId, page = 1, limit = 20, type, from, to) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        const where = {
            walletId: wallet.id,
            ...(type && { type }),
            ...(from || to
                ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
                : {}),
        };
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where: where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.walletTransaction.count({
                where: where,
            }),
        ]);
        return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getWalletId(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        return wallet.id;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map