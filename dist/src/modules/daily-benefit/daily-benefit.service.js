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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DailyBenefitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyBenefitService = exports.DAILY_BENEFIT_QUEUE = exports.BENEFIT_TIERS = void 0;
exports.calculateDailyBenefit = calculateDailyBenefit;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const client_1 = require("@prisma/client");
exports.BENEFIT_TIERS = [
    { minCount: 10000, amount: 5000 },
    { minCount: 5000, amount: 2000 },
    { minCount: 500, amount: 1000 },
    { minCount: 100, amount: 500 },
    { minCount: 50, amount: 300 },
    { minCount: 20, amount: 200 },
    { minCount: 5, amount: 100 },
];
function calculateDailyBenefit(activeTeamCount) {
    for (const tier of exports.BENEFIT_TIERS) {
        if (activeTeamCount >= tier.minCount)
            return tier.amount;
    }
    return 0;
}
exports.DAILY_BENEFIT_QUEUE = 'daily-benefit';
let DailyBenefitService = DailyBenefitService_1 = class DailyBenefitService {
    prisma;
    walletService;
    benefitQueue;
    logger = new common_1.Logger(DailyBenefitService_1.name);
    constructor(prisma, walletService, benefitQueue) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.benefitQueue = benefitQueue;
    }
    async scheduleDailyBenefit() {
        this.logger.log('Daily benefit cron triggered — queuing jobs...');
        const today = new Date().toISOString().split('T')[0];
        const activeUsers = await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
        });
        for (const user of activeUsers) {
            await this.benefitQueue.add('pay-benefit', { userId: user.id, date: today }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        }
        this.logger.log(`Queued daily benefit for ${activeUsers.length} active users`);
    }
    async payBenefitForUser(userId, dateStr) {
        const date = new Date(dateStr);
        const existing = await this.prisma.dailyBenefitLog.findUnique({
            where: { userId_date: { userId, date } },
        });
        if (existing) {
            this.logger.warn(`Daily benefit already paid for ${userId} on ${dateStr}`);
            return;
        }
        const result = await this.prisma.$queryRaw `
      WITH RECURSIVE team AS (
        SELECT id, status FROM "User" WHERE "parentId" = ${userId}
        UNION ALL
        SELECT u.id, u.status FROM "User" u
        INNER JOIN team t ON u."parentId" = t.id
      )
      SELECT COUNT(*) as count FROM team WHERE status = 'ACTIVE'
    `;
        const activeTeamCount = Number(result[0]?.count ?? 0);
        const amount = calculateDailyBenefit(activeTeamCount);
        if (amount === 0)
            return;
        await this.prisma.$transaction(async (tx) => {
            const walletId = await this.walletService.getWalletId(userId);
            await this.walletService.credit(tx, walletId, amount, client_1.TxType.DAILY_BENEFIT, `Daily benefit for ${dateStr} — active team: ${activeTeamCount}`, dateStr);
            await tx.dailyBenefitLog.create({
                data: { userId, date, teamCount: activeTeamCount, amount },
            });
        });
        this.logger.log(`Paid BDT ${amount} daily benefit to user ${userId} (team: ${activeTeamCount})`);
    }
    async getLogs(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = userId ? { userId } : {};
        const [logs, total] = await Promise.all([
            this.prisma.dailyBenefitLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.dailyBenefitLog.count({ where }),
        ]);
        return { logs, total, page, limit };
    }
    getTiers() {
        return exports.BENEFIT_TIERS;
    }
};
exports.DailyBenefitService = DailyBenefitService;
__decorate([
    (0, schedule_1.Cron)('0 0 * * *', { timeZone: 'Asia/Dhaka', name: 'daily-benefit-cron' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DailyBenefitService.prototype, "scheduleDailyBenefit", null);
exports.DailyBenefitService = DailyBenefitService = DailyBenefitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(exports.DAILY_BENEFIT_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        bullmq_2.Queue])
], DailyBenefitService);
//# sourceMappingURL=daily-benefit.service.js.map