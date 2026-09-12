import {
    Injectable,
    BadRequestException,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateWithdrawalDto, ReviewWithdrawalDto } from './dto/withdrawal.dto';
import { WithdrawStatus, TxType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WithdrawalService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly configService: ConfigService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async onModuleInit() {
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "fee" DECIMAL(12,2) NOT NULL DEFAULT 0.00;`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00;`);
            await this.prisma.$executeRawUnsafe(`UPDATE "WithdrawalRequest" SET "fee" = ROUND("amount" * 0.10, 2), "netAmount" = "amount" - ROUND("amount" * 0.10, 2) WHERE "fee" = 0 OR "fee" IS NULL;`);
        } catch (err) {
            console.error("Failed to execute WithdrawalRequest raw SQL migrations:", err);
        }
    }

    async request(userId: string, dto: CreateWithdrawalDto) {
        const today = new Date().getDay(); // 0=Sun, 5=Fri
        if (today !== 5) {
            throw new BadRequestException('Withdrawal requests are only accepted on Friday');
        }

        const minAmount = this.configService.get<number>('app.minWithdrawalAmount') ?? 2000;
        if (dto.amount < minAmount) {
            throw new BadRequestException(`Minimum withdrawal amount is BDT ${minAmount}`);
        }

        // Check available balance (balance - pending)
        const wallet = await this.walletService.getBalance(userId);
        if (wallet.availableBalance < dto.amount) {
            throw new BadRequestException('Insufficient available balance');
        }

        const fee = Math.round((Number(dto.amount) * 0.10) * 100) / 100;
        const netAmount = Math.round((Number(dto.amount) - fee) * 100) / 100;

        // Reserve amount
        const withdrawal = await this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { userId },
                data: { pendingWithdrawal: { increment: dto.amount } },
            });

            return tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount: dto.amount,
                    fee,
                    netAmount,
                    method: dto.method,
                    accountDetails: dto.accountDetails,
                },
            });
        });

        // Trigger notifications asynchronously
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, phone: true },
            });
            const userName = user?.name || "User";
            const userPhone = user?.phone || "";

            // Notify user
            await this.notificationsService.create(
                userId,
                NotificationType.WITHDRAWAL_STATUS,
                "Withdrawal Requested",
                `Your request for BDT ${withdrawal.amount} via ${withdrawal.method} has been submitted.`,
            );

            // Notify admins instantly
            await this.notificationsService.notifyAdmins(
                NotificationType.WITHDRAWAL_STATUS,
                "New Withdrawal Request 💸",
                `New withdrawal request of BDT ${withdrawal.amount} via ${withdrawal.method} submitted by ${userName} (${userPhone}).`,
            );
        } catch (err) {
            // Log or ignore notification failure to ensure request completes
            console.error(`Failed to send withdrawal request notifications: ${err.message}`);
        }

        return withdrawal;
    }

    async review(withdrawalId: string, adminId: string, dto: ReviewWithdrawalDto) {
        const withdrawal = await this.prisma.withdrawalRequest.findUnique({
            where: { id: withdrawalId },
            include: { user: { select: { id: true } } },
        });
        if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
        if (withdrawal.status !== WithdrawStatus.PENDING) {
            throw new BadRequestException('Only pending requests can be reviewed');
        }

        if (dto.status === 'APPROVED') {
            await this.prisma.$transaction(async (tx) => {
                // Release reservation first, then debit balance
                const walletId = await this.walletService.getWalletId(withdrawal.userId);
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { pendingWithdrawal: { decrement: Number(withdrawal.amount) } },
                });
                await this.walletService.debit(
                    tx,
                    walletId,
                    Number(withdrawal.amount),
                    TxType.WITHDRAWAL,
                    `Withdrawal via ${withdrawal.method} — approved`,
                    withdrawalId,
                );
                await tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: { status: WithdrawStatus.APPROVED, reviewedAt: new Date(), reviewedById: adminId },
                });
            });
        } else if (dto.status === 'RETURNED') {
            // Returned — release reservation without deducting balance, mark status as RETURNED
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { pendingWithdrawal: { decrement: Number(withdrawal.amount) } },
                });
                await tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: {
                        status: ('RETURNED' as any),
                        reason: dto.reason || 'Returned to wallet balance',
                        reviewedAt: new Date(),
                        reviewedById: adminId,
                    },
                });
            });
        } else {
            // Rejected — release reservation without deducting
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { pendingWithdrawal: { decrement: Number(withdrawal.amount) } },
                });
                await tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: {
                        status: WithdrawStatus.REJECTED,
                        reason: dto.reason,
                        reviewedAt: new Date(),
                        reviewedById: adminId,
                    },
                });
            });
        }

        const reviewed = await this.prisma.withdrawalRequest.findUnique({
            where: { id: withdrawalId },
        });

        // Trigger notifications asynchronously
        if (reviewed) {
            try {
                if (reviewed.status === WithdrawStatus.APPROVED) {
                    await this.notificationsService.create(
                        reviewed.userId,
                        NotificationType.WITHDRAWAL_STATUS,
                        "Withdrawal Approved",
                        `Your withdrawal request of BDT ${reviewed.amount} via ${reviewed.method} has been approved.`,
                    );
                } else if (reviewed.status === ('RETURNED' as any)) {
                    await this.notificationsService.create(
                        reviewed.userId,
                        NotificationType.WITHDRAWAL_STATUS,
                        "Withdrawal Returned 🔄",
                        `Your withdrawal request of BDT ${reviewed.amount} via ${reviewed.method} has been returned to your wallet. Reason: ${reviewed.reason || "Returned to wallet balance"}.`,
                    );
                } else if (reviewed.status === WithdrawStatus.REJECTED) {
                    await this.notificationsService.create(
                        reviewed.userId,
                        NotificationType.WITHDRAWAL_STATUS,
                        "Withdrawal Rejected",
                        `Your withdrawal request of BDT ${reviewed.amount} via ${reviewed.method} was rejected. Reason: ${reviewed.reason || "None"}.`,
                    );
                }
            } catch (err) {
                console.error(`Failed to send withdrawal review notifications: ${err.message}`);
            }
        }

        return reviewed;
    }

    async getMyRequests(userId: string, page = 1, limit = 20) {
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

    async getAllRequests(page = 1, limit = 20, status?: WithdrawStatus) {
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
}
