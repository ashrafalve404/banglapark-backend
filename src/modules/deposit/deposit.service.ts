import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { DepositStatus } from '@prisma/client';

// Admin bkash number shown to users
export const ADMIN_BKASH_NUMBER = '01823674796';

@Injectable()
export class DepositService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    // ── User: submit a deposit request ───────────────────────────────────────
    async submitRequest(userId: string, dto: { amount: number; transactionId: string; senderPhone: string }) {
        if (dto.amount < 10) {
            throw new BadRequestException('Minimum deposit amount is ৳10');
        }
        if (!dto.transactionId || dto.transactionId.trim().length < 3) {
            throw new BadRequestException('Please provide a valid Bkash Transaction ID');
        }

        // Check for duplicate transaction ID
        const existing = await this.prisma.depositRequest.findFirst({
            where: { transactionId: dto.transactionId.trim() },
        });
        if (existing) {
            throw new BadRequestException('This Transaction ID has already been submitted');
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

    // ── User: get my deposit request history ─────────────────────────────────
    async getMyRequests(userId: string, page = 1, limit = 10) {
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

    // ── Admin: list all deposit requests ─────────────────────────────────────
    async adminList(page = 1, limit = 20, status?: DepositStatus) {
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

    // ── Admin: approve a deposit request ─────────────────────────────────────
    async approve(requestId: string, adminNote?: string) {
        const request = await this.prisma.depositRequest.findUnique({
            where: { id: requestId },
            include: { user: { include: { wallet: true } } },
        });
        if (!request) throw new NotFoundException('Deposit request not found');
        if (request.status !== 'PENDING') {
            throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
        }
        if (!request.user.wallet) {
            throw new NotFoundException('User wallet not found');
        }

        const amount = Number(request.amount);
        const walletId = request.user.wallet.id;

        // Credit wallet and update request status atomically
        await this.prisma.$transaction(async (tx) => {
            // Credit the wallet
            const updatedWallet = await tx.wallet.update({
                where: { id: walletId },
                data: { balance: { increment: amount } },
            });
            await tx.walletTransaction.create({
                data: {
                    walletId,
                    type: 'DEPOSIT' as any,
                    amount,
                    balanceAfter: updatedWallet.balance,
                    referenceId: request.id,
                    description: `Bkash deposit approved (TxID: ${request.transactionId})`,
                },
            });

            // Mark request as approved
            await tx.depositRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', adminNote: adminNote ?? null },
            });
        });

        return { success: true, message: `৳${amount} credited to user wallet` };
    }

    // ── Admin: reject a deposit request ──────────────────────────────────────
    async reject(requestId: string, adminNote?: string) {
        const request = await this.prisma.depositRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Deposit request not found');
        if (request.status !== 'PENDING') {
            throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
        }

        return this.prisma.depositRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', adminNote: adminNote ?? null },
        });
    }
}
