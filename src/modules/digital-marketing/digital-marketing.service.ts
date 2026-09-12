import {
    Injectable,
    BadRequestException,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { randomUUID } from 'crypto';

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
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "DigitalMarketingPackage" (
                    "id" TEXT NOT NULL,
                    "title" TEXT NOT NULL,
                    "description" TEXT,
                    "image" TEXT,
                    "link" TEXT,
                    "price" DECIMAL(12,2) NOT NULL,
                    "profitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.50,
                    "durationDays" INTEGER NOT NULL DEFAULT 365,
                    "durationHours" INTEGER NOT NULL DEFAULT 24,
                    "isHidden" BOOLEAN NOT NULL DEFAULT false,
                    "sortOrder" INTEGER NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "DigitalMarketingPackage_pkey" PRIMARY KEY ("id")
                );
            `);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "DigitalMarketingPurchase" (
                    "id" TEXT NOT NULL,
                    "userId" TEXT NOT NULL,
                    "packageId" TEXT NOT NULL,
                    "amount" DECIMAL(12,2) NOT NULL,
                    "profitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                    "totalReturn" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                    "dailyProfitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.50,
                    "dailyProfitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                    "daysTotal" INTEGER NOT NULL DEFAULT 365,
                    "daysPaid" INTEGER NOT NULL DEFAULT 0,
                    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                    "lastCreditedAt" TIMESTAMP(3),
                    "status" "DigitalMarketingPurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
                    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "maturesAt" TIMESTAMP(3),
                    "creditedAt" TIMESTAMP(3),
                    CONSTRAINT "DigitalMarketingPurchase_pkey" PRIMARY KEY ("id"),
                    CONSTRAINT "DigitalMarketingPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                    CONSTRAINT "DigitalMarketingPurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "DigitalMarketingPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE
                );
            `);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_PURCHASE';`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_RETURN';`);
        } catch (e) { }

        // Alter table updates for existing deployments
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "link" TEXT;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "durationDays" INTEGER NOT NULL DEFAULT 365;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "dailyProfitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.50;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "dailyProfitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.50;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "dailyProfitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "daysTotal" INTEGER NOT NULL DEFAULT 365;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "daysPaid" INTEGER NOT NULL DEFAULT 0;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0.00;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "lastCreditedAt" TIMESTAMP(3);`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ALTER COLUMN "maturesAt" DROP NOT NULL;`);
        } catch (e) { }

        // Update all existing packages in DB from old 0.1% to 0.5% daily profit
        try {
            await this.prisma.$executeRawUnsafe(`
                UPDATE "DigitalMarketingPackage"
                SET "dailyProfitPercent" = 0.50, "profitPercent" = 0.50, "durationDays" = 365
                WHERE "dailyProfitPercent" IS NULL OR "dailyProfitPercent" < 0.50 OR "profitPercent" < 0.50;
            `);
        } catch (e) { }
    }

    private async seedDefaultPackagesIfEmpty() {
        try {
            const countRows: any[] = await this.prisma.$queryRawUnsafe(
                `SELECT COUNT(*)::INTEGER as cnt FROM "DigitalMarketingPackage"`
            );
            const count = Number(countRows[0]?.cnt ?? 0);

            if (count === 0) {
                const now = new Date().toISOString();
                const packages = [
                    { title: 'Starter Marketing Package', description: 'Basic digital promotion package. Earn 0.5% daily profit for 365 active days.', price: 2000, sortOrder: 1 },
                    { title: 'Standard Marketing Package', description: 'Standard brand campaign package. Earn 0.5% daily profit for 365 active days.', price: 5000, sortOrder: 2 },
                    { title: 'Premium Marketing Package', description: 'High priority promotion package. Earn 0.5% daily profit for 365 active days.', price: 10000, sortOrder: 3 },
                ];
                for (const pkg of packages) {
                    await this.prisma.$executeRawUnsafe(
                        `INSERT INTO "DigitalMarketingPackage" ("id","title","description","image","link","price","profitPercent","dailyProfitPercent","durationDays","durationHours","isHidden","sortOrder","createdAt","updatedAt")
                         VALUES ($1,$2,$3,NULL,NULL,$4,0.50,0.50,365,24,false,$5,$6,$6)`,
                        randomUUID(), pkg.title, pkg.description, pkg.price, pkg.sortOrder, now,
                    );
                }
            }
        } catch (e) {
            // Ignore seeding errors
        }
    }

    // ── User: get active packages ────────────────────────────────────────────
    async getPackages() {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "DigitalMarketingPackage" WHERE "isHidden" = false ORDER BY "sortOrder" ASC`
        );
        return rows;
    }

    // ── User: purchase a package ─────────────────────────────────────────────
    async purchasePackage(userId: string, packageId: string) {
        const pkgRows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            packageId,
        );
        const pkg = pkgRows[0];
        if (!pkg) throw new NotFoundException('Digital marketing package not found');
        if (pkg.isHidden) throw new BadRequestException('This package is currently unavailable');

        // Daily limit check: max 5 package purchases per day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const countRows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT COUNT(*)::INTEGER as cnt FROM "DigitalMarketingPurchase"
             WHERE "userId" = $1 AND "purchasedAt" >= $2::TIMESTAMPTZ`,
            userId,
            startOfDay.toISOString(),
        );
        const todayPurchasesCount = Number(countRows[0]?.cnt ?? 0);

        if (todayPurchasesCount >= 5) {
            throw new BadRequestException('Daily limit reached! You can purchase a maximum of 5 digital marketing packages per day.');
        }

        const amount = Number(pkg.price);
        const dailyProfitPercent = Number(pkg.dailyProfitPercent ?? pkg.profitPercent ?? 0.5);
        const daysTotal = Number(pkg.durationDays ?? 365);

        const dailyProfitAmount = Math.round((amount * (dailyProfitPercent / 100)) * 100) / 100;
        const totalReturn = Math.round((dailyProfitAmount * daysTotal) * 100) / 100;

        const walletId = await this.walletService.getWalletId(userId);
        const referenceId = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const purchaseId = randomUUID();
        const now = new Date().toISOString();

        try {
            await this.prisma.$transaction(async (tx: any) => {
                // Deduct wallet balance
                await this.walletService.debit(
                    tx,
                    walletId,
                    amount,
                    'DIGITAL_MARKETING_PURCHASE',
                    `Purchased "${pkg.title}" (Daily return: ৳${dailyProfitAmount}/day for ${daysTotal} days)`,
                    referenceId,
                );

                // Insert purchase record with initial lastCreditedAt
                await tx.$executeRawUnsafe(
                    `INSERT INTO "DigitalMarketingPurchase" (
                        "id","userId","packageId","amount","profitAmount","totalReturn","dailyProfitPercent","dailyProfitAmount","daysTotal","daysPaid","totalEarned","status","purchasedAt","lastCreditedAt"
                     ) VALUES (
                        $1, $2, $3, $4::DECIMAL, $5::DECIMAL, $6::DECIMAL, $7::DECIMAL, $8::DECIMAL, $9, 0, 0.00, 'ACTIVE'::"DigitalMarketingPurchaseStatus", $10::TIMESTAMPTZ, $10::TIMESTAMPTZ
                     )`,
                    purchaseId, userId, pkg.id, amount, dailyProfitAmount, totalReturn, dailyProfitPercent, dailyProfitAmount, daysTotal, now,
                );
            });
        } catch (error: any) {
            console.error('Digital marketing purchase error:', error);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(error?.message || 'Package purchase failed');
        }

        // Send notifications
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
            await Promise.all([
                this.notificationsService.create(
                    userId,
                    NotificationType.SYSTEM,
                    'Digital Marketing Package Active 🚀',
                    `You purchased "${pkg.title}" for ৳${amount}. You will receive ৳${dailyProfitAmount} (0.5%) profit every day for ${daysTotal} active days.`
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
            message: `Successfully purchased "${pkg.title}"! You will earn ৳${dailyProfitAmount}/day for ${daysTotal} active days.`,
            purchase: {
                id: purchaseId,
                userId,
                packageId: pkg.id,
                amount,
                dailyProfitPercent,
                dailyProfitAmount,
                daysTotal,
                daysPaid: 0,
                totalEarned: 0,
                status: 'ACTIVE',
                purchasedAt: now,
            },
        };
    }

    // ── User: get my digital marketing purchases ──────────────────────────────
    async getMyPurchases(userId: string) {
        const purchases: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT pur.*, pkg.title as pkg_title, pkg.description as pkg_description
             FROM "DigitalMarketingPurchase" pur
             LEFT JOIN "DigitalMarketingPackage" pkg ON pkg."id" = pur."packageId"
             WHERE pur."userId" = $1
             ORDER BY pur."purchasedAt" DESC`,
            userId,
        );

        const mapped = purchases.map(p => ({
            ...p,
            package: { title: p.pkg_title, description: p.pkg_description },
        }));

        const now = new Date();
        const active = mapped.filter((p: any) => p.status === 'ACTIVE');
        const completed = mapped.filter((p: any) => p.status === 'COMPLETED');

        return { purchases: mapped, active, completed, now: now.toISOString() };
    }

    // ── Automated Cron Job: Credit 0.5% Daily Profit for Active Users ─────────
    // Runs daily at midnight (00:00 AM Asia/Dhaka)
    @Cron('0 0 * * *', { timeZone: 'Asia/Dhaka', name: 'digital-marketing-profit-cron' })
    async processDailyProfitPayouts() {
        // Compute start of today (00:00:00) in Asia/Dhaka timezone
        const now = new Date();
        const dhakaStr = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
        const dhakaStartOfToday = new Date(dhakaStr);
        dhakaStartOfToday.setHours(0, 0, 0, 0);

        // Fetch ACTIVE purchases where:
        // 1. daysPaid < daysTotal (not yet 365 days)
        // 2. User status is 'ACTIVE' AND user.activeUntil >= NOW() (Account is currently ACTIVE)
        // 3. lastCreditedAt is null OR lastCreditedAt < dhakaStartOfToday (Not credited yet today BD time)
        const activePurchases: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT pur.*, pkg.title as pkg_title, u.id as u_id, u.name as u_name, u.phone as u_phone
             FROM "DigitalMarketingPurchase" pur
             LEFT JOIN "DigitalMarketingPackage" pkg ON pkg."id" = pur."packageId"
             LEFT JOIN "User" u ON u."id" = pur."userId"
             WHERE pur."status" = 'ACTIVE'
               AND pur."daysPaid" < COALESCE(pur."daysTotal", 365)
               AND u."status" = 'ACTIVE'
               AND (u."activeUntil" IS NULL OR u."activeUntil" >= NOW())
               AND (pur."lastCreditedAt" IS NULL OR pur."lastCreditedAt" < $1::TIMESTAMPTZ)`,
            dhakaStartOfToday.toISOString(),
        );

        if (activePurchases.length === 0) return;

        for (const item of activePurchases) {
            try {
                const amount = Number(item.amount);
                const dailyProfitPercent = Number(item.dailyProfitPercent ?? 0.5);
                const dailyProfitAmount = Number(item.dailyProfitAmount ?? (amount * (dailyProfitPercent / 100)));
                const daysTotal = Number(item.daysTotal ?? 365);
                const currentDaysPaid = Number(item.daysPaid ?? 0);
                const newDaysPaid = currentDaysPaid + 1;
                const currentTotalEarned = Number(item.totalEarned ?? 0);
                const newTotalEarned = Math.round((currentTotalEarned + dailyProfitAmount) * 100) / 100;
                const isCompleted = newDaysPaid >= daysTotal;

                const walletId = await this.walletService.getWalletId(item.userId);
                const referenceId = `dm_daily_${item.id.slice(0, 8)}_${newDaysPaid}`;
                const creditedAt = new Date().toISOString();

                await this.prisma.$transaction(async (tx: any) => {
                    // Credit user's wallet with daily profit
                    await this.walletService.credit(
                        tx,
                        walletId,
                        dailyProfitAmount,
                        'DIGITAL_MARKETING_RETURN',
                        `Daily profit (${newDaysPaid}/${daysTotal} days) for "${item.pkg_title || 'Digital Marketing'}"`,
                        referenceId,
                    );

                    // Update purchase record
                    const statusStr = isCompleted ? 'COMPLETED' : 'ACTIVE';
                    await tx.$executeRawUnsafe(
                        `UPDATE "DigitalMarketingPurchase"
                         SET "daysPaid" = $1,
                             "totalEarned" = $2::DECIMAL,
                             "lastCreditedAt" = $3::TIMESTAMPTZ,
                             "creditedAt" = $3::TIMESTAMPTZ,
                             "status" = $4::"DigitalMarketingPurchaseStatus"
                         WHERE "id" = $5`,
                        newDaysPaid, newTotalEarned, creditedAt, statusStr, item.id,
                    );
                });

                // Send notification
                await this.notificationsService.create(
                    item.userId,
                    NotificationType.SYSTEM,
                    'Daily Profit Credited 🎉',
                    `Daily profit of ৳${dailyProfitAmount} (Day ${newDaysPaid}/${daysTotal}) for "${item.pkg_title || 'Digital Marketing'}" credited to your wallet!`
                );
            } catch (error) {
                console.error(`Failed to process daily profit for purchase ${item.id}:`, error);
            }
        }
    }

    // ── Admin: CRUD for packages ─────────────────────────────────────────────
    async adminGetAllPackages() {
        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT p.*, CAST((SELECT COUNT(*) FROM "DigitalMarketingPurchase" pur WHERE pur."packageId" = p."id") AS INTEGER) as "purchaseCount"
             FROM "DigitalMarketingPackage" p
             ORDER BY p."sortOrder" ASC`
        );
        return rows.map(r => ({
            ...r,
            _count: { purchases: Number(r.purchaseCount ?? 0) },
        }));
    }

    async adminCreatePackage(dto: { title: string; description?: string; image?: string; link?: string; price: number; profitPercent?: number; dailyProfitPercent?: number; durationDays?: number; isHidden?: boolean; sortOrder?: number }) {
        const id = randomUUID();
        const dailyProfitPercent = dto.dailyProfitPercent ?? dto.profitPercent ?? 0.5;
        const durationDays = dto.durationDays ?? 365;
        const isHidden = dto.isHidden ?? false;
        const sortOrder = dto.sortOrder ?? 0;

        await this.prisma.$executeRawUnsafe(
            `INSERT INTO "DigitalMarketingPackage" (
                "id", "title", "description", "image", "link", "price", "profitPercent", "dailyProfitPercent", "durationDays", "durationHours", "isHidden", "sortOrder", "createdAt", "updatedAt"
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $7, $8, 24, $9, $10, NOW(), NOW()
             )`,
            id,
            dto.title,
            dto.description || null,
            dto.image || null,
            dto.link || null,
            Number(dto.price),
            Number(dailyProfitPercent),
            Math.round(Number(durationDays)),
            Boolean(isHidden),
            Math.round(Number(sortOrder)),
        );

        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        return rows[0];
    }

    async adminUpdatePackage(id: string, dto: { title?: string; description?: string; image?: string; link?: string; price?: number; profitPercent?: number; dailyProfitPercent?: number; durationDays?: number; isHidden?: boolean; sortOrder?: number }) {
        const existing: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT "id" FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        if (!existing || existing.length === 0) throw new NotFoundException('Package not found');

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (dto.title !== undefined) { fields.push(`"title" = $${idx++}`); values.push(dto.title); }
        if (dto.description !== undefined) { fields.push(`"description" = $${idx++}`); values.push(dto.description || null); }
        if (dto.image !== undefined) { fields.push(`"image" = $${idx++}`); values.push(dto.image || null); }
        if (dto.link !== undefined) { fields.push(`"link" = $${idx++}`); values.push(dto.link || null); }
        if (dto.price !== undefined) { fields.push(`"price" = $${idx++}`); values.push(Number(dto.price)); }
        if (dto.dailyProfitPercent !== undefined || dto.profitPercent !== undefined) {
            const pPct = Number(dto.dailyProfitPercent ?? dto.profitPercent);
            fields.push(`"profitPercent" = $${idx++}`); values.push(pPct);
            fields.push(`"dailyProfitPercent" = $${idx++}`); values.push(pPct);
        }
        if (dto.durationDays !== undefined) { fields.push(`"durationDays" = $${idx++}`); values.push(Math.round(Number(dto.durationDays))); }
        if (dto.isHidden !== undefined) { fields.push(`"isHidden" = $${idx++}`); values.push(Boolean(dto.isHidden)); }
        if (dto.sortOrder !== undefined) { fields.push(`"sortOrder" = $${idx++}`); values.push(Math.round(Number(dto.sortOrder))); }

        fields.push(`"updatedAt" = NOW()`);

        const whereIdx = idx;
        values.push(id);

        if (fields.length > 1) {
            await this.prisma.$executeRawUnsafe(
                `UPDATE "DigitalMarketingPackage" SET ${fields.join(', ')} WHERE "id" = $${whereIdx}`,
                ...values,
            );
        }

        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        return rows[0];
    }

    async adminDeletePackage(id: string) {
        const existing: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT "id" FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        if (!existing || existing.length === 0) throw new NotFoundException('Package not found');
        await this.prisma.$executeRawUnsafe(
            `DELETE FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        return { success: true };
    }

    async adminGetAllPurchases(page = 1, limit = 20, status?: string) {
        const skip = (page - 1) * limit;
        const statusFilter = status ? `AND pur."status" = '${status}'` : '';

        const [purchases, countRows] = await Promise.all([
            this.prisma.$queryRawUnsafe(
                `SELECT pur.*,
                        u.id as u_id, u.name as u_name, u.phone as u_phone, u."memberId" as u_memberid,
                        pkg.title as pkg_title
                 FROM "DigitalMarketingPurchase" pur
                 LEFT JOIN "User" u ON u.id = pur."userId"
                 LEFT JOIN "DigitalMarketingPackage" pkg ON pkg.id = pur."packageId"
                 WHERE 1=1 ${statusFilter}
                 ORDER BY pur."purchasedAt" DESC
                 LIMIT $1 OFFSET $2`,
                limit, skip,
            ) as Promise<any[]>,
            this.prisma.$queryRawUnsafe(
                `SELECT COUNT(*)::INTEGER as total FROM "DigitalMarketingPurchase" pur WHERE 1=1 ${statusFilter}`
            ) as Promise<any[]>,
        ]);

        const total = Number((countRows as any[])[0]?.total ?? 0);

        const mapped = (purchases as any[]).map(p => ({
            ...p,
            user: { id: p.u_id, name: p.u_name, phone: p.u_phone, memberId: p.u_memberid },
            package: { title: p.pkg_title },
        }));

        return { purchases: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}
