import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateWithdrawalDto, ReviewWithdrawalDto } from './dto/withdrawal.dto';
import { WithdrawStatus, TxType } from '@prisma/client';

@Injectable()
export class WithdrawalService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly configService: ConfigService,
    ) { }

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
                    method: dto.method,
                    accountDetails: dto.accountDetails,
                },
            });
        });

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
                // Deduct balance and release reservation
                const walletId = await this.walletService.getWalletId(withdrawal.userId);
                await this.walletService.debit(
                    tx,
                    walletId,
                    Number(withdrawal.amount),
                    TxType.WITHDRAWAL,
                    `Withdrawal via ${withdrawal.method} — approved`,
                    withdrawalId,
                );
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { pendingWithdrawal: { decrement: Number(withdrawal.amount) } },
                });
                await tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: { status: WithdrawStatus.APPROVED, reviewedAt: new Date(), reviewedById: adminId },
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

        return this.prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
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
