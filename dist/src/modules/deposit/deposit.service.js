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
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
exports.ADMIN_BKASH_NUMBER = '01823674796';
let DepositService = class DepositService {
    prisma;
    walletService;
    notificationsService;
    constructor(prisma, walletService, notificationsService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.notificationsService = notificationsService;
    }
    async onModuleInit() {
        await this.ensureTablesAndEnums();
    }
    async ensureTablesAndEnums() {
        try {
            await this.prisma.$executeRawUnsafe(`
                DO $$ BEGIN
                    CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "DepositRequest" (
                    "id" TEXT NOT NULL,
                    "userId" TEXT NOT NULL,
                    "amount" DECIMAL(12,2) NOT NULL,
                    "transactionId" TEXT NOT NULL,
                    "senderPhone" TEXT NOT NULL,
                    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
                    "adminNote" TEXT,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
                );
            `);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DEPOSIT';`);
        }
        catch (e) {
        }
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
        const created = await this.prisma.depositRequest.create({
            data: {
                userId,
                amount: dto.amount,
                transactionId: dto.transactionId.trim(),
                senderPhone: dto.senderPhone.trim(),
                status: 'PENDING',
            },
        });
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
            await Promise.all([
                this.notificationsService.create(userId, client_1.NotificationType.SYSTEM, 'Deposit Request Submitted ⏳', `Your ৳${dto.amount} Bkash deposit request (TxID: ${dto.transactionId.trim()}) has been submitted and is pending admin approval.`),
                this.notificationsService.notifyAdmins(client_1.NotificationType.SYSTEM, 'New Deposit Request 💰', `User ${user?.name || 'User'} (${user?.phone || 'N/A'}) submitted a ৳${dto.amount} deposit (TxID: ${dto.transactionId.trim()}).`),
            ]);
        }
        catch (e) {
            console.error('Failed to dispatch deposit notification:', e);
        }
        return created;
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
        let wallet = request.user.wallet;
        if (!wallet) {
            wallet = await this.prisma.wallet.create({ data: { userId: request.userId, balance: 0 } });
        }
        const amount = Number(request.amount);
        const walletId = wallet.id;
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
        try {
            await this.notificationsService.create(request.userId, client_1.NotificationType.SYSTEM, 'Deposit Approved 🎉', `Your BDT ৳${amount} deposit request (TxID: ${request.transactionId}) has been APPROVED and added to your wallet balance!`);
        }
        catch (e) {
            console.error('Failed to notify deposit approval:', e);
        }
        return { success: true, message: `৳${amount} credited to user wallet` };
    }
    async reject(requestId, adminNote) {
        const request = await this.prisma.depositRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Deposit request not found');
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Request is already ${request.status.toLowerCase()}`);
        }
        const updated = await this.prisma.depositRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', adminNote: adminNote ?? null },
        });
        try {
            await this.notificationsService.create(request.userId, client_1.NotificationType.SYSTEM, 'Deposit Rejected ❌', `Your ৳${request.amount} deposit request (TxID: ${request.transactionId}) was rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`);
        }
        catch (e) {
            console.error('Failed to notify deposit rejection:', e);
        }
        return updated;
    }
};
exports.DepositService = DepositService;
exports.DepositService = DepositService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        notifications_service_1.NotificationsService])
], DepositService);
//# sourceMappingURL=deposit.service.js.map