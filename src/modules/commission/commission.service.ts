import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TxType } from '@prisma/client';

@Injectable()
export class CommissionService {
    private readonly logger = new Logger(CommissionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Called when a qualifying order is DELIVERED for the first time.
     * Runs inside the caller's DB transaction.
     * Returns early (idempotent) if generation commission was already paid.
     */
    async triggerGenerationCommission(
        newUserId: string,
        orderId: string,
    ): Promise<void> {
        // Idempotency: check if commission was ever paid FROM this user
        const alreadyPaid = await this.prisma.generationCommission.findFirst({
            where: { fromUserId: newUserId },
        });
        if (alreadyPaid) {
            this.logger.log(
                `Generation commission already paid for user ${newUserId} — skipping`,
            );
            return;
        }

        const levels = this.configService.get<number>('app.generationCommissionLevels') ?? 10;
        const amount = this.configService.get<number>('app.generationCommissionAmount') ?? 200;

        // Walk up the sponsor chain
        let currentId: string | null = newUserId;
        const sponsors: Array<{ id: string; walletId: string; level: number }> = [];

        for (let level = 1; level <= levels; level++) {
            const user = await this.prisma.user.findUnique({
                where: { id: currentId! },
                select: { parentId: true },
            });
            if (!user?.parentId) break;
            currentId = user.parentId;

            const sponsor = await this.prisma.user.findUnique({
                where: { id: currentId as string },
                select: {
                    id: true,
                    status: true,
                    wallet: { select: { id: true } },
                },
            }) as any;

            if (!sponsor || sponsor.status !== 'ACTIVE' || !sponsor.wallet) {
                this.logger.log(
                    `Level ${level} sponsor ${currentId} is INACTIVE — skipping commission`,
                );
                continue;
            }

            sponsors.push({ id: sponsor.id, walletId: sponsor.wallet.id, level });
        }

        if (sponsors.length === 0) return;

        // All-or-nothing: process inside a DB transaction
        await this.prisma.$transaction(async (tx) => {
            for (const sponsor of sponsors) {
                await this.walletService.credit(
                    tx,
                    sponsor.walletId,
                    amount,
                    TxType.GENERATION_COMMISSION,
                    `Generation commission (Level ${sponsor.level}) from new member activation`,
                    orderId,
                );

                await tx.generationCommission.create({
                    data: {
                        toUserId: sponsor.id,
                        fromUserId: newUserId,
                        orderId,
                        level: sponsor.level,
                        amount,
                    },
                });
            }
        });

        this.logger.log(
            `Generation commission paid to ${sponsors.length} sponsors for user ${newUserId}`,
        );
    }

    async getCommissionReport(
        page = 1,
        limit = 20,
        userId?: string,
    ) {
        const skip = (page - 1) * limit;
        const where = userId ? { toUserId: userId } : {};

        const [commissions, total] = await Promise.all([
            this.prisma.generationCommission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    toUser: { select: { id: true, name: true, email: true } },
                    fromUser: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.generationCommission.count({ where }),
        ]);

        return { commissions, total, page, limit };
    }
}
