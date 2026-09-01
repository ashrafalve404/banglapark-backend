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
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let WalletService = class WalletService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async onModuleInit() {
        await this.ensureEnumsExist();
    }
    async ensureEnumsExist() {
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';`);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';`);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DEPOSIT';`);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "WithdrawStatus" ADD VALUE IF NOT EXISTS 'RETURNED';`);
        }
        catch (e) {
        }
    }
    async credit(tx, walletId, amount, type, description, referenceId, benefitCategory) {
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
                benefitCategory: benefitCategory ?? null,
            },
        });
        return wallet;
    }
    async debit(tx, walletId, amount, type, description, referenceId) {
        const current = await tx.wallet.findUnique({
            where: { id: walletId },
            select: { balance: true, pendingWithdrawal: true },
        });
        if (!current)
            throw new common_1.NotFoundException('Wallet not found');
        const totalBalance = Number(current.balance);
        const pendingWithdrawal = Number(current.pendingWithdrawal ?? 0);
        const availableBalance = totalBalance - pendingWithdrawal;
        if (availableBalance < amount) {
            throw new common_1.BadRequestException(`Insufficient available wallet balance. (Available: ৳${availableBalance}, Locked in Pending Withdrawal: ৳${pendingWithdrawal})`);
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
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true, balance: true, pendingWithdrawal: true },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { userId, balance: 0 },
                select: { id: true, balance: true, pendingWithdrawal: true },
            });
        }
        const balance = Number(wallet.balance);
        const pending = Number(wallet.pendingWithdrawal);
        const [dailyBenefitResult, generationIncomeResult, dailyRewardResult, tierBonusResult, quizEarningResult, positionSalaryResult, productSalesResult] = await Promise.all([
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'DAILY_BENEFIT' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'GENERATION_COMMISSION' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'DAILY_BENEFIT', benefitCategory: 'BASE' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'DAILY_BENEFIT', benefitCategory: 'TIER' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'QUIZ_EARNING' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'POSITION_SALARY' },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { walletId: wallet.id, type: 'SELLER_PAYOUT' },
                _sum: { amount: true },
            }),
        ]);
        return {
            ...wallet,
            availableBalance: balance - pending,
            dailyBenefit: Number(dailyBenefitResult._sum.amount ?? 0),
            dailyReward: Number(dailyRewardResult._sum.amount ?? 0),
            tierBonus: Number(tierBonusResult._sum.amount ?? 0),
            generationIncome: Number(generationIncomeResult._sum.amount ?? 0),
            quizEarning: Number(quizEarningResult._sum.amount ?? 0),
            salary: Number(positionSalaryResult._sum.amount ?? 0),
            productSalesIncome: Number(productSalesResult._sum.amount ?? 0),
            reward: 0,
            travelling: 0,
            share: 0,
        };
    }
    async getTransactions(userId, page = 1, limit = 20, type, from, to) {
        let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({ data: { userId, balance: 0 } });
        }
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
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { userId, balance: 0 },
                select: { id: true },
            });
        }
        return wallet.id;
    }
    async lookupRecipient(phone) {
        const user = await this.prisma.user.findUnique({
            where: { phone },
            select: { id: true, name: true, phone: true },
        });
        if (!user)
            throw new common_1.NotFoundException('No user found with this phone number');
        return { id: user.id, name: user.name, phone: user.phone };
    }
    async transfer(senderId, recipientPhone, rawAmount) {
        const amount = Number(rawAmount);
        if (isNaN(amount) || amount < 500) {
            throw new common_1.BadRequestException('Minimum transfer amount is ৳500');
        }
        await this.ensureEnumsExist();
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { id: true, name: true, phone: true },
        });
        if (!sender)
            throw new common_1.NotFoundException('Sender user not found');
        const recipient = await this.prisma.user.findUnique({
            where: { phone: recipientPhone },
            select: { id: true, name: true, phone: true },
        });
        if (!recipient)
            throw new common_1.NotFoundException('No user found with this phone number');
        if (sender.id === recipient.id) {
            throw new common_1.BadRequestException('You cannot transfer balance to yourself');
        }
        let senderWallet = await this.prisma.wallet.findUnique({ where: { userId: senderId }, select: { id: true, balance: true } });
        if (!senderWallet) {
            senderWallet = await this.prisma.wallet.create({ data: { userId: senderId, balance: 0 }, select: { id: true, balance: true } });
        }
        let recipientWallet = await this.prisma.wallet.findUnique({ where: { userId: recipient.id }, select: { id: true, balance: true } });
        if (!recipientWallet) {
            recipientWallet = await this.prisma.wallet.create({ data: { userId: recipient.id, balance: 0 }, select: { id: true, balance: true } });
        }
        const senderBalance = Number(senderWallet.balance);
        if (senderBalance < amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        const fee = Math.round((amount * 0.10) * 100) / 100;
        const netAmount = Math.round((amount - fee) * 100) / 100;
        const referenceId = `transfer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        try {
            await this.prisma.$transaction(async (tx) => {
                const updatedSender = await tx.wallet.update({
                    where: { id: senderWallet.id },
                    data: { balance: { decrement: amount } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: senderWallet.id,
                        type: 'TRANSFER_OUT',
                        amount,
                        balanceAfter: updatedSender.balance,
                        referenceId,
                        description: `Balance transfer to ${recipient.name} (${recipient.phone})`,
                    },
                });
                const updatedRecipient = await tx.wallet.update({
                    where: { id: recipientWallet.id },
                    data: { balance: { increment: netAmount } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: recipientWallet.id,
                        type: 'TRANSFER_IN',
                        amount: netAmount,
                        balanceAfter: updatedRecipient.balance,
                        referenceId,
                        description: `Balance received from ${sender.name} (${sender.phone}) (10% fee: ৳${fee})`,
                    },
                });
            });
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error('Transfer Transaction Error:', error);
            throw new common_1.InternalServerErrorException(error?.message || 'Transfer transaction failed');
        }
        try {
            await Promise.all([
                this.notificationsService.create(recipient.id, client_1.NotificationType.SYSTEM, 'Balance Received 💸', `You received ৳${netAmount} from ${sender.name} (${sender.phone}) (10% service fee: ৳${fee}).`),
                this.notificationsService.create(senderId, client_1.NotificationType.SYSTEM, 'Balance Transferred 💸', `You successfully transferred ৳${amount} to ${recipient.name} (${recipient.phone}). Recipient received ৳${netAmount} (10% fee: ৳${fee}).`),
            ]);
        }
        catch (e) {
            console.error('Failed to send transfer notification:', e);
        }
        return {
            success: true,
            message: `৳${amount} transferred successfully to ${recipient.name} (Fee: ৳${fee}, Recipient received ৳${netAmount})`,
            referenceId,
            amount,
            fee,
            netAmount,
        };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map