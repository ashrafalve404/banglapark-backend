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
exports.DepositService = exports.ADMIN_BKASH_NUMBER = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
exports.ADMIN_BKASH_NUMBER = '01823674796';
let DepositService = class DepositService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async submitRequest(userId, dto) {
        if (dto.amount < 10) {
            throw new common_1.BadRequestException('Minimum deposit amount is ৳10');
        }
        if (!dto.transactionId || dto.transactionId.trim().length < 3) {
            throw new common_1.BadRequestException('Please provide a valid Bkash Transaction ID');
        }
        const existing = await this.prisma.depositRequest.findFirst({
            where: { transactionId: dto.transactionId.trim() },
        });
        if (existing) {
            throw new common_1.BadRequestException('This Transaction ID has already been submitted');
        }
        return this.prisma.depositRequest.create({
            data: {
                userId,
                amount: dto.amount,
                transactionId: dto.transactionId.trim(),
                senderPhone: dto.senderPhone.trim(),
                status: 'PENDING',
            },
        });
    }
    async getMyRequests(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            this.prisma.depositRequest.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.depositRequest.count({ where: { userId } }),
        ]);
        return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async adminList(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [requests, total] = await Promise.all([
            this.prisma.depositRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, phone: true, memberId: true } },
                },
            }),
            this.prisma.depositRequest.count({ where }),
        ]);
        return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async approve(requestId, adminNote) {
        const request = await this.prisma.depositRequest.findUnique({
            where: { id: requestId },
            include: { user: { include: { wallet: true } } },
        });
        if (!request)
            throw new common_1.NotFoundException('Deposit request not found');
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Request is already ${request.status.toLowerCase()}`);
        }
        if (!request.user.wallet) {
            throw new common_1.NotFoundException('User wallet not found');
        }
        const amount = Number(request.amount);
        const walletId = request.user.wallet.id;
        await this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { id: walletId },
                data: { balance: { increment: amount } },
            });
            await tx.walletTransaction.create({
                data: {
                    walletId,
                    type: 'DEPOSIT',
                    amount,
                    balanceAfter: updatedWallet.balance,
                    referenceId: request.id,
                    description: `Bkash deposit approved (TxID: ${request.transactionId})`,
                },
            });
            await tx.depositRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', adminNote: adminNote ?? null },
            });
        });
        return { success: true, message: `৳${amount} credited to user wallet` };
    }
    async reject(requestId, adminNote) {
        const request = await this.prisma.depositRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Deposit request not found');
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Request is already ${request.status.toLowerCase()}`);
        }
        return this.prisma.depositRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', adminNote: adminNote ?? null },
        });
    }
};
exports.DepositService = DepositService;
exports.DepositService = DepositService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], DepositService);
//# sourceMappingURL=deposit.service.js.map