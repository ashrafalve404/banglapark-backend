import {
    Injectable,
    BadRequestException,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { DepositStatus } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

// Admin bkash number shown to users
export const ADMIN_BKASH_NUMBER = '01823674796';

@Injectable()
export class DepositService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async onModuleInit() {
        await this.ensureTablesAndEnums();
    }

    private async ensureTablesAndEnums() {
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
        } catch (e) {
            // Ignore if DB already initialized
        }
    }

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

        const created = await this.prisma.depositRequest.create({
            data: {
                userId,
                amount: dto.amount,
                transactionId: dto.transactionId.trim(),
                senderPhone: dto.senderPhone.trim(),
                status: 'PENDING',
            },
        });

        // Notifications
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
            await Promise.all([
                this.notificationsService.create(
                    userId,
                    NotificationType.SYSTEM,
                    'Deposit Request Submitted ⏳',
                    `Your ৳${dto.amount} Bkash deposit request (TxID: ${dto.transactionId.trim()}) has been submitted and is pending admin approval.`
                ),
                this.notificationsService.notifyAdmins(
                    NotificationType.SYSTEM,
                    'New Deposit Request 💰',
                    `User ${user?.name || 'User'} (${user?.phone || 'N/A'}) submitted a ৳${dto.amount} deposit (TxID: ${dto.transactionId.trim()}).`
                ),
            ]);
        } catch (e) {
            console.error('Failed to dispatch deposit notification:', e);
        }

        return created;
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

        // Get or create wallet
        let wallet = request.user.wallet;
        if (!wallet) {
            wallet = await this.prisma.wallet.create({ data: { userId: request.userId, balance: 0 } });
        }

        const amount = Number(request.amount);
        const walletId = wallet.id;

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

        // Notify user
        try {
            await this.notificationsService.create(
                request.userId,
                NotificationType.SYSTEM,
                'Deposit Approved 🎉',
                `Your BDT ৳${amount} deposit request (TxID: ${request.transactionId}) has been APPROVED and added to your wallet balance!`
            );
        } catch (e) {
            console.error('Failed to notify deposit approval:', e);
        }

        return { success: true, message: `৳${amount} credited to user wallet` };
    }

    // ── Admin: reject a deposit request ──────────────────────────────────────
    async reject(requestId: string, adminNote?: string) {
        const request = await this.prisma.depositRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Deposit request not found');
        if (request.status !== 'PENDING') {
            throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
        }

        const updated = await this.prisma.depositRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', adminNote: adminNote ?? null },
        });

        // Notify user
        try {
            await this.notificationsService.create(
                request.userId,
                NotificationType.SYSTEM,
                'Deposit Rejected ❌',
                `Your ৳${request.amount} deposit request (TxID: ${request.transactionId}) was rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`
            );
        } catch (e) {
            console.error('Failed to notify deposit rejection:', e);
        }

        return updated;
    }
}
