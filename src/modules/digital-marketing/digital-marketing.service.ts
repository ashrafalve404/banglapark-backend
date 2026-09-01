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
                    "profitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.10,
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
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_PURCHASE';`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_RETURN';`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
        } catch (e) { }

        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "link" TEXT;`);
        } catch (e) { }
    }

    private async seedDefaultPackagesIfEmpty() {
        try {
            // Use raw SQL to count - never use Prisma ORM on this unmanaged table
            const countRows: any[] = await this.prisma.$queryRawUnsafe(
                `SELECT COUNT(*)::INTEGER as cnt FROM "DigitalMarketingPackage"`
            );
            const count = Number(countRows[0]?.cnt ?? 0);

            if (count === 0) {
                const now = new Date().toISOString();
                const packages = [
                    { title: 'Starter Marketing Package', description: 'Basic social media & digital promotion package. Earn 0.1% bonus after 24 hours.', price: 1000, sortOrder: 1 },
                    { title: 'Standard Marketing Package', description: 'Standard brand reach & traffic campaign. Earn 0.1% bonus after 24 hours.', price: 5000, sortOrder: 2 },
                    { title: 'Premium Marketing Package', description: 'High priority digital advertising & sponsored promo. Earn 0.1% bonus after 24 hours.', price: 10000, sortOrder: 3 },
                ];
                for (const pkg of packages) {
                    await this.prisma.$executeRawUnsafe(
                        `INSERT INTO "DigitalMarketingPackage" ("id","title","description","image","link","price","profitPercent","durationHours","isHidden","sortOrder","createdAt","updatedAt")
                         VALUES ($1,$2,$3,NULL,NULL,$4,0.10,24,false,$5,$6,$6)`,
                        randomUUID(), pkg.title, pkg.description, pkg.price, pkg.sortOrder, now,
                    );
                }
            }
            // Note: no auto-update of profit% to avoid overwriting admin customizations
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
        // Fetch package via raw SQL
        const pkgRows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            packageId,
        );
        const pkg = pkgRows[0];
        if (!pkg) throw new NotFoundException('Digital marketing package not found');
        if (pkg.isHidden) throw new BadRequestException('This package is currently unavailable');

        // Check daily max 5 package purchases limit via raw SQL
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const countRows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT COUNT(*)::INTEGER as cnt FROM "DigitalMarketingPurchase"
             WHERE "userId" = $1 AND "purchasedAt" >= $2`,
            userId,
            startOfDay.toISOString(),
        );
        const todayPurchasesCount = Number(countRows[0]?.cnt ?? 0);

        if (todayPurchasesCount >= 5) {
            throw new BadRequestException('Daily limit reached! You can purchase a maximum of 5 digital marketing packages per day.');
        }

        const amount = Number(pkg.price);
        const profitPercent = Number(pkg.profitPercent ?? 0.1);
        const durationHours = Number(pkg.durationHours ?? 24);

        const profitAmount = Math.round((amount * (profitPercent / 100)) * 100) / 100;
        const totalReturn = Math.round((amount + profitAmount) * 100) / 100;
        const maturesAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

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
                    `Purchased "${pkg.title}" (24h return: ৳${totalReturn})`,
                    referenceId,
                );

                // Insert purchase record via raw SQL inside transaction
                await tx.$executeRawUnsafe(
                    `INSERT INTO "DigitalMarketingPurchase" ("id","userId","packageId","amount","profitAmount","totalReturn","status","purchasedAt","maturesAt")
                     VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8)`,
                    purchaseId, userId, pkg.id, amount, profitAmount, totalReturn, now, maturesAt.toISOString(),
                );
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
                    `You purchased "${pkg.title}" for ৳${amount}. ৳${totalReturn} (0.1% profit: ৳${profitAmount}) will be credited back in 24 hours.`
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
            purchase: { id: purchaseId, userId, packageId: pkg.id, amount, profitAmount, totalReturn, status: 'ACTIVE', purchasedAt: now, maturesAt },
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

    // ── Automated Cron Job: Process 24h Matured Returns ──────────────────────
    @Cron(CronExpression.EVERY_5_MINUTES)
    async processMaturedPurchases() {
        const now = new Date();
        const maturedList: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT pur.*, pkg.title as pkg_title, u.id as u_id, u.name as u_name, u.phone as u_phone
             FROM "DigitalMarketingPurchase" pur
             LEFT JOIN "DigitalMarketingPackage" pkg ON pkg."id" = pur."packageId"
             LEFT JOIN "User" u ON u."id" = pur."userId"
             WHERE pur."status" = 'ACTIVE' AND pur."maturesAt" <= $1`,
            now.toISOString(),
        );

        if (maturedList.length === 0) return;

        for (const item of maturedList) {
            try {
                const totalReturn = Number(item.totalReturn);
                const amount = Number(item.amount);
                const profitAmount = Number(item.profitAmount);
                const walletId = await this.walletService.getWalletId(item.userId);
                const referenceId = `dm_return_${item.id.slice(0, 8)}`;
                const creditedAt = new Date().toISOString();

                await this.prisma.$transaction(async (tx: any) => {
                    // Credit wallet with total return
                    await this.walletService.credit(
                        tx,
                        walletId,
                        totalReturn,
                        'DIGITAL_MARKETING_RETURN',
                        `24h Return for "${item.pkg_title || 'Digital Marketing'}" (Principal ৳${amount} + 0.1% profit ৳${profitAmount})`,
                        referenceId,
                    );

                    // Mark purchase as completed via raw SQL
                    await tx.$executeRawUnsafe(
                        `UPDATE "DigitalMarketingPurchase" SET "status" = 'COMPLETED', "creditedAt" = $1 WHERE "id" = $2`,
                        creditedAt, item.id,
                    );
                });

                // Send notification
                await this.notificationsService.create(
                    item.userId,
                    NotificationType.SYSTEM,
                    '24h Return Credited to Wallet 🎉',
                    `Your 24-hour return of ৳${totalReturn} (Principal ৳${amount} + 0.1% profit ৳${profitAmount}) for "${item.pkg_title || 'Digital Marketing'}" is credited to your wallet!`
                );
            } catch (error) {
                console.error(`Failed to process matured purchase ${item.id}:`, error);
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

    async adminCreatePackage(dto: { title: string; description?: string; image?: string; link?: string; price: number; profitPercent?: number; durationHours?: number; isHidden?: boolean; sortOrder?: number }) {
        const id = randomUUID();
        const now = new Date().toISOString();
        const profitPercent = dto.profitPercent ?? 0.1;
        const durationHours = dto.durationHours ?? 24;
        const isHidden = dto.isHidden ?? false;
        const sortOrder = dto.sortOrder ?? 0;

        await this.prisma.$executeRawUnsafe(
            `INSERT INTO "DigitalMarketingPackage" ("id","title","description","image","link","price","profitPercent","durationHours","isHidden","sortOrder","createdAt","updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            id,
            dto.title,
            dto.description ?? null,
            dto.image ?? null,
            dto.link ?? null,
            dto.price,
            profitPercent,
            durationHours,
            isHidden,
            sortOrder,
            now,
            now,
        );

        const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        return rows[0];
    }

    async adminUpdatePackage(id: string, dto: { title?: string; description?: string; image?: string; link?: string; price?: number; profitPercent?: number; durationHours?: number; isHidden?: boolean; sortOrder?: number }) {
        const existing: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT "id" FROM "DigitalMarketingPackage" WHERE "id" = $1`,
            id,
        );
        if (!existing || existing.length === 0) throw new NotFoundException('Package not found');

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (dto.title !== undefined) { fields.push(`"title" = $${idx++}`); values.push(dto.title); }
        if (dto.description !== undefined) { fields.push(`"description" = $${idx++}`); values.push(dto.description ?? null); }
        if (dto.image !== undefined) { fields.push(`"image" = $${idx++}`); values.push(dto.image || null); }
        if (dto.link !== undefined) { fields.push(`"link" = $${idx++}`); values.push(dto.link || null); }
        if (dto.price !== undefined) { fields.push(`"price" = $${idx++}`); values.push(dto.price); }
        if (dto.profitPercent !== undefined) { fields.push(`"profitPercent" = $${idx++}`); values.push(dto.profitPercent); }
        if (dto.durationHours !== undefined) { fields.push(`"durationHours" = $${idx++}`); values.push(dto.durationHours); }
        if (dto.isHidden !== undefined) { fields.push(`"isHidden" = $${idx++}`); values.push(dto.isHidden); }
        if (dto.sortOrder !== undefined) { fields.push(`"sortOrder" = $${idx++}`); values.push(dto.sortOrder); }

        fields.push(`"updatedAt" = $${idx++}`);
        values.push(new Date().toISOString());
        values.push(id);

        await this.prisma.$executeRawUnsafe(
            `UPDATE "DigitalMarketingPackage" SET ${fields.join(', ')} WHERE "id" = $${idx}`,
            ...values,
        );

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
