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
exports.WithdrawalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const client_1 = require("@prisma/client");
let WithdrawalService = class WithdrawalService {
    prisma;
    walletService;
    configService;
    constructor(prisma, walletService, configService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.configService = configService;
    }
    async request(userId, dto) {
        const minAmount = this.configService.get('app.minWithdrawalAmount') ?? 1000;
        if (dto.amount < minAmount) {
            throw new common_1.BadRequestException(`Minimum withdrawal amount is BDT ${minAmount}`);
        }
        const wallet = await this.walletService.getBalance(userId);
        if (wallet.availableBalance < dto.amount) {
            throw new common_1.BadRequestException('Insufficient available balance');
        }
        const withdrawal = await this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { userId },
                data: { pendingWithdrawal: { increment: dto.amount } },
            });
            return tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount: dto.amount,
                    method: dto.method,
                    accountDetails: dto.accountDetails,
                },
            });
        });
        return withdrawal;
    }
    async review(withdrawalId, adminId, dto) {
        const withdrawal = await this.prisma.withdrawalRequest.findUnique({
            where: { id: withdrawalId },
            include: { user: { select: { id: true } } },
        });
        if (!withdrawal)
            throw new common_1.NotFoundException('Withdrawal request not found');
        if (withdrawal.status !== client_1.WithdrawStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending requests can be reviewed');
        }
        if (dto.status === 'APPROVED') {
            await this.prisma.$transaction(async (tx) => {
                const walletId = await this.walletService.getWalletId(withdrawal.userId);
                await this.walletService.debit(tx, walletId, Number(withdrawal.amount), client_1.TxType.WITHDRAWAL, `Withdrawal via ${withdrawal.method} — approved`, withdrawalId);
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { pendingWithdrawal: { decrement: Number(withdrawal.amount) } },
                });
                await tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: { status: client_1.WithdrawStatus.APPROVED, reviewedAt: new Date(), reviewedById: adminId },
                });
            });
        }
        else {
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { pendingWithdrawal: { decrement: Number(withdrawal.amount) } },
                });
                await tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: {
                        status: client_1.WithdrawStatus.REJECTED,
                        reason: dto.reason,
                        reviewedAt: new Date(),
                        reviewedById: adminId,
                    },
                });
            });
        }
        return this.prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
    }
    async getMyRequests(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            this.prisma.withdrawalRequest.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.withdrawalRequest.count({ where: { userId } }),
        ]);
        return { requests, total, page, limit };
    }
    async getAllRequests(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [requests, total] = await Promise.all([
            this.prisma.withdrawalRequest.findMany({
                where,
                skip,
                take: limit,
                include: { user: { select: { id: true, name: true, email: true, phone: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.withdrawalRequest.count({ where }),
        ]);
        return { requests, total, page, limit };
    }
};
exports.WithdrawalService = WithdrawalService;
exports.WithdrawalService = WithdrawalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], WithdrawalService);
//# sourceMappingURL=withdrawal.service.js.map