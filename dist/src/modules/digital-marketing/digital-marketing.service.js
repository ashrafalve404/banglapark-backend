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
        }
        catch (e) {
        }
    }
    async seedDefaultPackagesIfEmpty() {
        try {
            const db = this.prisma;
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
        }
        catch (e) {
        }
    }
    async getPackages() {
        const db = this.prisma;
        return db.digitalMarketingPackage.findMany({
            where: { isHidden: false },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async purchasePackage(userId, packageId) {
        const db = this.prisma;
        const pkg = await db.digitalMarketingPackage.findUnique({
            where: { id: packageId },
        });
        if (!pkg)
            throw new common_1.NotFoundException('Digital marketing package not found');
        if (pkg.isHidden)
            throw new common_1.BadRequestException('This package is currently unavailable');
        const amount = Number(pkg.price);
        const profitPercent = Number(pkg.profitPercent ?? 1.0);
        const durationHours = pkg.durationHours ?? 24;
        const profitAmount = Math.round((amount * (profitPercent / 100)) * 100) / 100;
        const totalReturn = Math.round((amount + profitAmount) * 100) / 100;
        const maturesAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        const walletId = await this.walletService.getWalletId(userId);
        const referenceId = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let purchase;
        try {
            await this.prisma.$transaction(async (tx) => {
                await this.walletService.debit(tx, walletId, amount, 'DIGITAL_MARKETING_PURCHASE', `Purchased "${pkg.title}" (24h return: ৳${totalReturn})`, referenceId);
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(error?.message || 'Package purchase failed');
        }
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } });
            await Promise.all([
                this.notificationsService.create(userId, client_1.NotificationType.SYSTEM, 'Digital Marketing Package Active 🚀', `You purchased "${pkg.title}" for ৳${amount}. ৳${totalReturn} (1% profit: ৳${profitAmount}) will be credited back in 24 hours.`),
                this.notificationsService.notifyAdmins(client_1.NotificationType.SYSTEM, 'New Digital Marketing Purchase 📈', `User ${user?.name || 'User'} (${user?.phone || 'N/A'}) purchased "${pkg.title}" for ৳${amount}.`),
            ]);
        }
        catch (e) {
            console.error('Notification dispatch error:', e);
        }
        return {
            success: true,
            message: `Successfully purchased "${pkg.title}"! ৳${totalReturn} will be credited to your wallet in 24 hours.`,
            purchase,
        };
    }
    async getMyPurchases(userId) {
        const db = this.prisma;
        const purchases = await db.digitalMarketingPurchase.findMany({
            where: { userId },
            include: { package: { select: { title: true, description: true } } },
            orderBy: { purchasedAt: 'desc' },
        });
        const now = new Date();
        const active = purchases.filter((p) => p.status === 'ACTIVE');
        const completed = purchases.filter((p) => p.status === 'COMPLETED');
        return { purchases, active, completed, now: now.toISOString() };
    }
    async processMaturedPurchases() {
        const db = this.prisma;
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
        if (maturedList.length === 0)
            return;
        for (const item of maturedList) {
            try {
                const totalReturn = Number(item.totalReturn);
                const amount = Number(item.amount);
                const profitAmount = Number(item.profitAmount);
                const walletId = await this.walletService.getWalletId(item.userId);
                const referenceId = `dm_return_${item.id.slice(0, 8)}`;
                await this.prisma.$transaction(async (tx) => {
                    await this.walletService.credit(tx, walletId, totalReturn, 'DIGITAL_MARKETING_RETURN', `24h Return for "${item.package?.title || 'Digital Marketing'}" (Principal ৳${amount} + 1% profit ৳${profitAmount})`, referenceId);
                    await tx.digitalMarketingPurchase.update({
                        where: { id: item.id },
                        data: {
                            status: 'COMPLETED',
                            creditedAt: new Date(),
                        },
                    });
                });
                await this.notificationsService.create(item.userId, client_1.NotificationType.SYSTEM, '24h Return Credited to Wallet 🎉', `Your 24-hour return of ৳${totalReturn} (Principal ৳${amount} + 1% profit ৳${profitAmount}) for "${item.package?.title || 'Digital Marketing'}" is credited to your wallet!`);
            }
            catch (error) {
                console.error(`Failed to process matured purchase ${item.id}:`, error);
            }
        }
    }
    async adminGetAllPackages() {
        const db = this.prisma;
        return db.digitalMarketingPackage.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: { select: { purchases: true } },
            },
        });
    }
    async adminCreatePackage(dto) {
        const db = this.prisma;
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
    async adminUpdatePackage(id, dto) {
        const db = this.prisma;
        const pkg = await db.digitalMarketingPackage.findUnique({ where: { id } });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found');
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
    async adminDeletePackage(id) {
        const db = this.prisma;
        const pkg = await db.digitalMarketingPackage.findUnique({ where: { id } });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found');
        return db.digitalMarketingPackage.delete({ where: { id } });
    }
    async adminGetAllPurchases(page = 1, limit = 20, status) {
        const db = this.prisma;
        const skip = (page - 1) * limit;
        const where = status ? { status: status } : {};
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
};
exports.DigitalMarketingService = DigitalMarketingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DigitalMarketingService.prototype, "processMaturedPurchases", null);
exports.DigitalMarketingService = DigitalMarketingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        notifications_service_1.NotificationsService])
], DigitalMarketingService);
//# sourceMappingURL=digital-marketing.service.js.map