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
exports.DigitalMarketingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let DigitalMarketingService = class DigitalMarketingService {
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
        await this.seedDefaultPackagesIfEmpty();
    }
    async ensureTablesAndEnums() {
        try {
            await this.prisma.$executeRawUnsafe(`
                DO $$ BEGIN
                    CREATE TYPE "DigitalMarketingPurchaseStatus" AS ENUM ('ACTIVE', 'COMPLETED');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }
        catch (e) { }
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
        }
        catch (e) { }
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
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_PURCHASE';`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TYPE "TxType" ADD VALUE IF NOT EXISTS 'DIGITAL_MARKETING_RETURN';`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "link" TEXT;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "durationDays" INTEGER NOT NULL DEFAULT 365;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPackage" ADD COLUMN IF NOT EXISTS "dailyProfitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.50;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "dailyProfitPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.50;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "dailyProfitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "daysTotal" INTEGER NOT NULL DEFAULT 365;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "daysPaid" INTEGER NOT NULL DEFAULT 0;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0.00;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ADD COLUMN IF NOT EXISTS "lastCreditedAt" TIMESTAMP(3);`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE "DigitalMarketingPurchase" ALTER COLUMN "maturesAt" DROP NOT NULL;`);
        }
        catch (e) { }
        try {
            await this.prisma.$executeRawUnsafe(`
                UPDATE "DigitalMarketingPackage"
                SET "dailyProfitPercent" = 0.50, "profitPercent" = 0.50, "durationDays" = 365
                WHERE "dailyProfitPercent" IS NULL OR "dailyProfitPercent" < 0.50 OR "profitPercent" < 0.50;
            `);
        }
        catch (e) { }
    }
    async seedDefaultPackagesIfEmpty() {
        try {
            const countRows = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::INTEGER as cnt FROM "DigitalMarketingPackage"`);
            const count = Number(countRows[0]?.cnt ?? 0);
            if (count === 0) {
                const now = new Date().toISOString();
                const packages = [
                    { title: 'Starter Marketing Package', description: 'Basic digital promotion package. Earn 0.5% daily profit for 365 active days.', price: 2000, sortOrder: 1 },
                    { title: 'Standard Marketing Package', description: 'Standard brand campaign package. Earn 0.5% daily profit for 365 active days.', price: 5000, sortOrder: 2 },
                    { title: 'Premium Marketing Package', description: 'High priority promotion package. Earn 0.5% daily profit for 365 active days.', price: 10000, sortOrder: 3 },
                ];
                for (const pkg of packages) {
                    await this.prisma.$executeRawUnsafe(`INSERT INTO "DigitalMarketingPackage" ("id","title","description","image","link","price","profitPercent","dailyProfitPercent","durationDays","durationHours","isHidden","sortOrder","createdAt","updatedAt")
                         VALUES ($1,$2,$3,NULL,NULL,$4,0.50,0.50,365,24,false,$5,$6,$6)`, (0, crypto_1.randomUUID)(), pkg.title, pkg.description, pkg.price, pkg.sortOrder, now);
                }
            }
        }
        catch (e) {
        }
    }
    async getPackages() {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "DigitalMarketingPackage" WHERE "isHidden" = false ORDER BY "sortOrder" ASC`);
        return rows;
    }
    async purchasePackage(userId, packageId) {
        const pkgRows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`, packageId);
        const pkg = pkgRows[0];
        if (!pkg)
            throw new common_1.NotFoundException('Digital marketing package not found');
        if (pkg.isHidden)
            throw new common_1.BadRequestException('This package is currently unavailable');
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const countRows = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::INTEGER as cnt FROM "DigitalMarketingPurchase"
             WHERE "userId" = $1 AND "purchasedAt" >= $2::TIMESTAMPTZ`, userId, startOfDay.toISOString());
        const todayPurchasesCount = Number(countRows[0]?.cnt ?? 0);
        if (todayPurchasesCount >= 5) {
            throw new common_1.BadRequestException('Daily limit reached! You can purchase a maximum of 5 digital marketing packages per day.');
        }
        const amount = Number(pkg.price);
        const dailyProfitPercent = Number(pkg.dailyProfitPercent ?? pkg.profitPercent ?? 0.5);
        const daysTotal = Number(pkg.durationDays ?? 365);
        const dailyProfitAmount = Math.round((amount * (dailyProfitPercent / 100)) * 100) / 100;
        const totalReturn = Math.round((dailyProfitAmount * daysTotal) * 100) / 100;
        const walletId = await this.walletService.getWalletId(userId);
        const referenceId = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const purchaseId = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        try {
            await this.prisma.$transaction(async (tx) => {
                await this.walletService.debit(tx, walletId, amount, 'DIGITAL_MARKETING_PURCHASE', `Purchased "${pkg.title}" (Daily return: ৳${dailyProfitAmount}/day for ${daysTotal} days)`, referenceId);
                await tx.$executeRawUnsafe(`INSERT INTO "DigitalMarketingPurchase" (
                        "id","userId","packageId","amount","profitAmount","totalReturn","dailyProfitPercent","dailyProfitAmount","daysTotal","daysPaid","totalEarned","status","purchasedAt"
                     ) VALUES (
                        $1, $2, $3, $4::DECIMAL, $5::DECIMAL, $6::DECIMAL, $7::DECIMAL, $8::DECIMAL, $9, 0, 0.00, 'ACTIVE'::"DigitalMarketingPurchaseStatus", $10::TIMESTAMPTZ
                     )`, purchaseId, userId, pkg.id, amount, dailyProfitAmount, totalReturn, dailyProfitPercent, dailyProfitAmount, daysTotal, now);
            });
        }
        catch (error) {
            console.error('Digital marketing purchase error:', error);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(error?.message || 'Package purchase failed');
        }
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
            await Promise.all([
                this.notificationsService.create(userId, client_1.NotificationType.SYSTEM, 'Digital Marketing Package Active 🚀', `You purchased "${pkg.title}" for ৳${amount}. You will receive ৳${dailyProfitAmount} (0.5%) profit every day for ${daysTotal} active days.`),
                this.notificationsService.notifyAdmins(client_1.NotificationType.SYSTEM, 'New Digital Marketing Purchase 📈', `User ${user?.name || 'User'} (${user?.phone || 'N/A'}) purchased "${pkg.title}" for ৳${amount}.`),
            ]);
        }
        catch (e) {
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
    async getMyPurchases(userId) {
        const purchases = await this.prisma.$queryRawUnsafe(`SELECT pur.*, pkg.title as pkg_title, pkg.description as pkg_description
             FROM "DigitalMarketingPurchase" pur
             LEFT JOIN "DigitalMarketingPackage" pkg ON pkg."id" = pur."packageId"
             WHERE pur."userId" = $1
             ORDER BY pur."purchasedAt" DESC`, userId);
        const mapped = purchases.map(p => ({
            ...p,
            package: { title: p.pkg_title, description: p.pkg_description },
        }));
        const now = new Date();
        const active = mapped.filter((p) => p.status === 'ACTIVE');
        const completed = mapped.filter((p) => p.status === 'COMPLETED');
        return { purchases: mapped, active, completed, now: now.toISOString() };
    }
    async processDailyProfitPayouts() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const activePurchases = await this.prisma.$queryRawUnsafe(`SELECT pur.*, pkg.title as pkg_title, u.id as u_id, u.name as u_name, u.phone as u_phone
             FROM "DigitalMarketingPurchase" pur
             LEFT JOIN "DigitalMarketingPackage" pkg ON pkg."id" = pur."packageId"
             LEFT JOIN "User" u ON u."id" = pur."userId"
             WHERE pur."status" = 'ACTIVE'
               AND pur."daysPaid" < COALESCE(pur."daysTotal", 365)
               AND u."status" = 'ACTIVE'
               AND (u."activeUntil" IS NULL OR u."activeUntil" >= NOW())
               AND (pur."lastCreditedAt" IS NULL OR pur."lastCreditedAt" < $1::TIMESTAMPTZ)`, startOfToday.toISOString());
        if (activePurchases.length === 0)
            return;
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
                await this.prisma.$transaction(async (tx) => {
                    await this.walletService.credit(tx, walletId, dailyProfitAmount, 'DIGITAL_MARKETING_RETURN', `Daily profit (${newDaysPaid}/${daysTotal} days) for "${item.pkg_title || 'Digital Marketing'}"`, referenceId);
                    const statusStr = isCompleted ? 'COMPLETED' : 'ACTIVE';
                    await tx.$executeRawUnsafe(`UPDATE "DigitalMarketingPurchase"
                         SET "daysPaid" = $1,
                             "totalEarned" = $2::DECIMAL,
                             "lastCreditedAt" = $3::TIMESTAMPTZ,
                             "creditedAt" = $3::TIMESTAMPTZ,
                             "status" = $4::"DigitalMarketingPurchaseStatus"
                         WHERE "id" = $5`, newDaysPaid, newTotalEarned, creditedAt, statusStr, item.id);
                });
                await this.notificationsService.create(item.userId, client_1.NotificationType.SYSTEM, 'Daily Profit Credited 🎉', `Daily profit of ৳${dailyProfitAmount} (Day ${newDaysPaid}/${daysTotal}) for "${item.pkg_title || 'Digital Marketing'}" credited to your wallet!`);
            }
            catch (error) {
                console.error(`Failed to process daily profit for purchase ${item.id}:`, error);
            }
        }
    }
    async adminGetAllPackages() {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT p.*, CAST((SELECT COUNT(*) FROM "DigitalMarketingPurchase" pur WHERE pur."packageId" = p."id") AS INTEGER) as "purchaseCount"
             FROM "DigitalMarketingPackage" p
             ORDER BY p."sortOrder" ASC`);
        return rows.map(r => ({
            ...r,
            _count: { purchases: Number(r.purchaseCount ?? 0) },
        }));
    }
    async adminCreatePackage(dto) {
        const id = (0, crypto_1.randomUUID)();
        const dailyProfitPercent = dto.dailyProfitPercent ?? dto.profitPercent ?? 0.5;
        const durationDays = dto.durationDays ?? 365;
        const isHidden = dto.isHidden ?? false;
        const sortOrder = dto.sortOrder ?? 0;
        await this.prisma.$executeRawUnsafe(`INSERT INTO "DigitalMarketingPackage" (
                "id", "title", "description", "image", "link", "price", "profitPercent", "dailyProfitPercent", "durationDays", "durationHours", "isHidden", "sortOrder", "createdAt", "updatedAt"
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $7, $8, 24, $9, $10, NOW(), NOW()
             )`, id, dto.title, dto.description || null, dto.image || null, dto.link || null, Number(dto.price), Number(dailyProfitPercent), Math.round(Number(durationDays)), Boolean(isHidden), Math.round(Number(sortOrder)));
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`, id);
        return rows[0];
    }
    async adminUpdatePackage(id, dto) {
        const existing = await this.prisma.$queryRawUnsafe(`SELECT "id" FROM "DigitalMarketingPackage" WHERE "id" = $1`, id);
        if (!existing || existing.length === 0)
            throw new common_1.NotFoundException('Package not found');
        const fields = [];
        const values = [];
        let idx = 1;
        if (dto.title !== undefined) {
            fields.push(`"title" = $${idx++}`);
            values.push(dto.title);
        }
        if (dto.description !== undefined) {
            fields.push(`"description" = $${idx++}`);
            values.push(dto.description || null);
        }
        if (dto.image !== undefined) {
            fields.push(`"image" = $${idx++}`);
            values.push(dto.image || null);
        }
        if (dto.link !== undefined) {
            fields.push(`"link" = $${idx++}`);
            values.push(dto.link || null);
        }
        if (dto.price !== undefined) {
            fields.push(`"price" = $${idx++}`);
            values.push(Number(dto.price));
        }
        if (dto.dailyProfitPercent !== undefined || dto.profitPercent !== undefined) {
            const pPct = Number(dto.dailyProfitPercent ?? dto.profitPercent);
            fields.push(`"profitPercent" = $${idx++}`);
            values.push(pPct);
            fields.push(`"dailyProfitPercent" = $${idx++}`);
            values.push(pPct);
        }
        if (dto.durationDays !== undefined) {
            fields.push(`"durationDays" = $${idx++}`);
            values.push(Math.round(Number(dto.durationDays)));
        }
        if (dto.isHidden !== undefined) {
            fields.push(`"isHidden" = $${idx++}`);
            values.push(Boolean(dto.isHidden));
        }
        if (dto.sortOrder !== undefined) {
            fields.push(`"sortOrder" = $${idx++}`);
            values.push(Math.round(Number(dto.sortOrder)));
        }
        fields.push(`"updatedAt" = NOW()`);
        const whereIdx = idx;
        values.push(id);
        if (fields.length > 1) {
            await this.prisma.$executeRawUnsafe(`UPDATE "DigitalMarketingPackage" SET ${fields.join(', ')} WHERE "id" = $${whereIdx}`, ...values);
        }
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "DigitalMarketingPackage" WHERE "id" = $1`, id);
        return rows[0];
    }
    async adminDeletePackage(id) {
        const existing = await this.prisma.$queryRawUnsafe(`SELECT "id" FROM "DigitalMarketingPackage" WHERE "id" = $1`, id);
        if (!existing || existing.length === 0)
            throw new common_1.NotFoundException('Package not found');
        await this.prisma.$executeRawUnsafe(`DELETE FROM "DigitalMarketingPackage" WHERE "id" = $1`, id);
        return { success: true };
    }
    async adminGetAllPurchases(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const statusFilter = status ? `AND pur."status" = '${status}'` : '';
        const [purchases, countRows] = await Promise.all([
            this.prisma.$queryRawUnsafe(`SELECT pur.*,
                        u.id as u_id, u.name as u_name, u.phone as u_phone, u."memberId" as u_memberid,
                        pkg.title as pkg_title
                 FROM "DigitalMarketingPurchase" pur
                 LEFT JOIN "User" u ON u.id = pur."userId"
                 LEFT JOIN "DigitalMarketingPackage" pkg ON pkg.id = pur."packageId"
                 WHERE 1=1 ${statusFilter}
                 ORDER BY pur."purchasedAt" DESC
                 LIMIT $1 OFFSET $2`, limit, skip),
            this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::INTEGER as total FROM "DigitalMarketingPurchase" pur WHERE 1=1 ${statusFilter}`),
        ]);
        const total = Number(countRows[0]?.total ?? 0);
        const mapped = purchases.map(p => ({
            ...p,
            user: { id: p.u_id, name: p.u_name, phone: p.u_phone, memberId: p.u_memberid },
            package: { title: p.pkg_title },
        }));
        return { purchases: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
};
exports.DigitalMarketingService = DigitalMarketingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DigitalMarketingService.prototype, "processDailyProfitPayouts", null);
exports.DigitalMarketingService = DigitalMarketingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        notifications_service_1.NotificationsService])
], DigitalMarketingService);
//# sourceMappingURL=digital-marketing.service.js.map