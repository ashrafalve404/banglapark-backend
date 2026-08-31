import {
    Injectable,
    BadRequestException,
    NotFoundException,
    OnModuleInit,
    InternalServerErrorException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class DigitalMarketingService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async onModuleInit() {
        await this.ensureTablesAndEnums();
        await this.seedDefaultPackagesIfEmpty();
    }

    private async ensureTablesAndEnums() {
        try {
            await this.prisma.$executeRawUnsafe(`
                DO $$ BEGIN
                    CREATE TYPE "DigitalMarketingPurchaseStatus" AS ENUM ('ACTIVE', 'COMPLETED');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "DigitalMarketingPackage" (
                    "id" TEXT NOT NULL,
                    "title" TEXT NOT NULL,
                    "description" TEXT,
                    "price" DECIMAL(12,2) NOT NULL,
                    "profitPercent" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                    "durationHours" INTEGER NOT NULL DEFAULT 24,
                    "isHidden" BOOLEAN NOT NULL DEFAULT false,
                    "sortOrder" INTEGER NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "DigitalMarketingPackage_pkey" PRIMARY KEY ("id")
                );
            `);
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "DigitalMarketingPurchase" (
                    "id" TEXT NOT NULL,
                    "userId" TEXT NOT NULL,
                    "packageId" TEXT NOT NULL,
                    "amount" DECIMAL(12,2) NOT NULL,
                    "profitAmount" DECIMAL(12,2) NOT NULL,
                    "totalReturn" DECIMAL(12,2) NOT NULL,
                    "status" "DigitalMarketingPurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
                    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "maturesAt" TIMESTAMP(3) NOT NULL,
                    "creditedAt" TIMESTAMP(3),
                    CONSTRAINT "DigitalMarketingPurchase_pkey" PRIMARY KEY ("id"),
                    CONSTRAINT "DigitalMarketingPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                    CONSTRAINT "DigitalMarketingPurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DigitalMarketingPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE
                );
            `);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_PURCHASE';`);
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_RETURN';`);
        } catch (e) {
            // Ignore if DB already initialized
        }
    }

    private async seedDefaultPackagesIfEmpty() {
        try {
            const db = this.prisma as any;
            const count = await db.digitalMarketingPackage.count();
            if (count === 0) {
                await db.digitalMarketingPackage.createMany({
                    data: [
                        {
                            title: 'Starter Marketing Package',
                            description: 'Basic social media & digital promotion package. Earn 1% bonus after 24 hours.',
                            price: 1000,
                            profitPercent: 1.00,
                            durationHours: 24,
                            sortOrder: 1,
                        },
                        {
                            title: 'Standard Marketing Package',
                            description: 'Standard brand reach & traffic campaign. Earn 1% bonus after 24 hours.',
                            price: 5000,
                            profitPercent: 1.00,
                            durationHours: 24,
                            sortOrder: 2,
                        },
                        {
                            title: 'Premium Marketing Package',
                            description: 'High priority digital advertising & sponsored promo. Earn 1% bonus after 24 hours.',
                            price: 10000,
                            profitPercent: 1.00,
                            durationHours: 24,
                            sortOrder: 3,
                        },
                    ],
                });
            }
        } catch (e) {
            // Ignore seeding errors
        }
    }

    // ── User: get active packages ────────────────────────────────────────────
    async getPackages() {
        const db = this.prisma as any;
        return db.digitalMarketingPackage.findMany({
            where: { isHidden: false },
            orderBy: { sortOrder: 'asc' },
        });
    }

    // ── User: purchase a package ─────────────────────────────────────────────
    async purchasePackage(userId: string, packageId: string) {
        const db = this.prisma as any;
        const pkg = await db.digitalMarketingPackage.findUnique({
            where: { id: packageId },
        });
        if (!pkg) throw new NotFoundException('Digital marketing package not found');
        if (pkg.isHidden) throw new BadRequestException('This package is currently unavailable');

        const amount = Number(pkg.price);
        const profitPercent = Number(pkg.profitPercent ?? 1.0);
        const durationHours = pkg.durationHours ?? 24;

        const profitAmount = Math.round((amount * (profitPercent / 100)) * 100) / 100;
        const totalReturn = Math.round((amount + profitAmount) * 100) / 100;
        const maturesAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        const walletId = await this.walletService.getWalletId(userId);
        const referenceId = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        let purchase: any;

        try {
            await this.prisma.$transaction(async (tx: any) => {
                // Deduct wallet balance
                await this.walletService.debit(
                    tx,
                    walletId,
                    amount,
                    'DIGITAL_MARKETING_PURCHASE',
                    `Purchased "${pkg.title}" (24h return: ৳${totalReturn})`,
                    referenceId,
                );

                // Create purchase record
                purchase = await tx.digitalMarketingPurchase.create({
                    data: {
                        userId,
                        packageId: pkg.id,
                        amount,
                        profitAmount,
                        totalReturn,
                        status: 'ACTIVE',
                        maturesAt,
                    },
                });
            });
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(error?.message || 'Package purchase failed');
        }

        // Send notifications
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
            await Promise.all([
                this.notificationsService.create(
                    userId,
                    NotificationType.SYSTEM,
                    'Digital Marketing Package Active 🚀',
                    `You purchased "${pkg.title}" for ৳${amount}. ৳${totalReturn} (1% profit: ৳${profitAmount}) will be credited back in 24 hours.`
                ),
                this.notificationsService.notifyAdmins(
                    NotificationType.SYSTEM,
                    'New Digital Marketing Purchase 📈',
                    `User ${user?.name || 'User'} (${user?.phone || 'N/A'}) purchased "${pkg.title}" for ৳${amount}.`
                ),
            ]);
        } catch (e) {
            console.error('Notification dispatch error:', e);
        }

        return {
            success: true,
            message: `Successfully purchased "${pkg.title}"! ৳${totalReturn} will be credited to your wallet in 24 hours.`,
            purchase,
        };
    }

    // ── User: get my digital marketing purchases ──────────────────────────────
    async getMyPurchases(userId: string) {
        const db = this.prisma as any;
        const purchases = await db.digitalMarketingPurchase.findMany({
            where: { userId },
            include: { package: { select: { title: true, description: true } } },
            orderBy: { purchasedAt: 'desc' },
        });

        const now = new Date();
        const active = purchases.filter((p: any) => p.status === 'ACTIVE');
        const completed = purchases.filter((p: any) => p.status === 'COMPLETED');

        return { purchases, active, completed, now: now.toISOString() };
    }

    // ── Automated Cron Job: Process 24h Matured Returns ──────────────────────
    @Cron(CronExpression.EVERY_5_MINUTES)
    async processMaturedPurchases() {
        const db = this.prisma as any;
        const now = new Date();
        const maturedList = await db.digitalMarketingPurchase.findMany({
            where: {
                status: 'ACTIVE',
                maturesAt: { lte: now },
            },
            include: {
                package: { select: { title: true } },
                user: { select: { id: true, name: true, phone: true } },
            },
        });

        if (maturedList.length === 0) return;

        for (const item of maturedList) {
            try {
                const totalReturn = Number(item.totalReturn);
                const amount = Number(item.amount);
                const profitAmount = Number(item.profitAmount);
                const walletId = await this.walletService.getWalletId(item.userId);
                const referenceId = `dm_return_${item.id.slice(0, 8)}`;

                await this.prisma.$transaction(async (tx: any) => {
                    // Credit wallet with total return (amount + 1%)
                    await this.walletService.credit(
                        tx,
                        walletId,
                        totalReturn,
                        'DIGITAL_MARKETING_RETURN',
                        `24h Return for "${item.package?.title || 'Digital Marketing'}" (Principal ৳${amount} + 1% profit ৳${profitAmount})`,
                        referenceId,
                    );

                    // Mark purchase as completed
                    await tx.digitalMarketingPurchase.update({
                        where: { id: item.id },
                        data: {
                            status: 'COMPLETED',
                            creditedAt: new Date(),
                        },
                    });
                });

                // Send notification
                await this.notificationsService.create(
                    item.userId,
                    NotificationType.SYSTEM,
                    '24h Return Credited to Wallet 🎉',
                    `Your 24-hour return of ৳${totalReturn} (Principal ৳${amount} + 1% profit ৳${profitAmount}) for "${item.package?.title || 'Digital Marketing'}" is credited to your wallet!`
                );
            } catch (error) {
                console.error(`Failed to process matured purchase ${item.id}:`, error);
            }
        }
    }

    // ── Admin: CRUD for packages ─────────────────────────────────────────────
    async adminGetAllPackages() {
        const db = this.prisma as any;
        return db.digitalMarketingPackage.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: { select: { purchases: true } },
            },
        });
    }

    async adminCreatePackage(dto: { title: string; description?: string; price: number; profitPercent?: number; durationHours?: number; isHidden?: boolean; sortOrder?: number }) {
        const db = this.prisma as any;
        return db.digitalMarketingPackage.create({
            data: {
                title: dto.title,
                description: dto.description || null,
                price: dto.price,
                profitPercent: dto.profitPercent ?? 1.0,
                durationHours: dto.durationHours ?? 24,
                isHidden: dto.isHidden ?? false,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }

    async adminUpdatePackage(id: string, dto: { title?: string; description?: string; price?: number; profitPercent?: number; durationHours?: number; isHidden?: boolean; sortOrder?: number }) {
        const db = this.prisma as any;
        const pkg = await db.digitalMarketingPackage.findUnique({ where: { id } });
        if (!pkg) throw new NotFoundException('Package not found');

        return db.digitalMarketingPackage.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.profitPercent !== undefined && { profitPercent: dto.profitPercent }),
                ...(dto.durationHours !== undefined && { durationHours: dto.durationHours }),
                ...(dto.isHidden !== undefined && { isHidden: dto.isHidden }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
    }

    async adminDeletePackage(id: string) {
        const db = this.prisma as any;
        const pkg = await db.digitalMarketingPackage.findUnique({ where: { id } });
        if (!pkg) throw new NotFoundException('Package not found');
        return db.digitalMarketingPackage.delete({ where: { id } });
    }

    async adminGetAllPurchases(page = 1, limit = 20, status?: string) {
        const db = this.prisma as any;
        const skip = (page - 1) * limit;
        const where = status ? { status: status as any } : {};

        const [purchases, total] = await Promise.all([
            db.digitalMarketingPurchase.findMany({
                where,
                skip,
                take: limit,
                orderBy: { purchasedAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, phone: true, memberId: true } },
                    package: { select: { title: true } },
                },
            }),
            db.digitalMarketingPurchase.count({ where }),
        ]);

        return { purchases, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}
