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
var PositionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionService = exports.POSITIONS = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const client_1 = require("@prisma/client");
exports.POSITIONS = [
    { rank: 1, name: 'Executive Officer', requiredMembers: 5_000, monthlySalary: 25_000 },
    { rank: 2, name: 'Executive Manager', requiredMembers: 25_000, monthlySalary: 75_000 },
    { rank: 3, name: 'Marketing Manager', requiredMembers: 75_000, monthlySalary: 150_000 },
    { rank: 4, name: 'District Manager', requiredMembers: 200_000, monthlySalary: 300_000 },
    { rank: 5, name: 'Regional Manager', requiredMembers: 500_000, monthlySalary: 500_000 },
    { rank: 6, name: 'Executive Vice President', requiredMembers: 1_200_000, monthlySalary: 750_000 },
    { rank: 7, name: 'Additional General Manager', requiredMembers: 2_500_000, monthlySalary: 1_200_000 },
    { rank: 8, name: 'Divisional General Manager', requiredMembers: 5_000_000, monthlySalary: 2_500_000 },
    { rank: 9, name: 'General Manager', requiredMembers: 5_000_000, monthlySalary: 7_500_000 },
    { rank: 10, name: 'Executive Director', requiredMembers: 10_000_000, monthlySalary: 10_000_000 },
];
let PositionService = PositionService_1 = class PositionService {
    prisma;
    walletService;
    logger = new common_1.Logger(PositionService_1.name);
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async getActiveTeamCount(userId) {
        const result = await this.prisma.$queryRaw `
      WITH RECURSIVE team AS (
        SELECT id, status FROM "User" WHERE "parentId" = ${userId}
        UNION ALL
        SELECT u.id, u.status FROM "User" u
        INNER JOIN team t ON u."parentId" = t.id
      )
      SELECT COUNT(*) as count FROM team WHERE status = 'ACTIVE'
    `;
        return Number(result[0]?.count ?? 0);
    }
    async getUserPositionData(userId) {
        const activeTeamCount = await this.getActiveTeamCount(userId);
        const positions = exports.POSITIONS.map((pos) => ({
            ...pos,
            isUnlocked: activeTeamCount >= pos.requiredMembers,
        }));
        const highestUnlocked = [...positions].reverse().find((p) => p.isUnlocked) ?? null;
        return { activeTeamCount, positions, highestUnlocked };
    }
    async adminListMembersWithPosition(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {
            role: 'USER',
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    memberId: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        const usersWithPosition = await Promise.all(users.map(async (user) => {
            const activeTeamCount = await this.getActiveTeamCount(user.id);
            const highestPosition = [...exports.POSITIONS].reverse().find((p) => activeTeamCount >= p.requiredMembers) ?? null;
            return { ...user, activeTeamCount, currentPosition: highestPosition };
        }));
        return { users: usersWithPosition, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async distributePositionSalaries() {
        this.logger.log('Position salary cron triggered...');
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const activeUsers = await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
        });
        let paid = 0;
        for (const user of activeUsers) {
            try {
                await this.payPositionSalaryForUser(user.id, monthKey);
                paid++;
            }
            catch (err) {
                this.logger.error(`Position salary failed for user ${user.id}: ${err}`);
            }
        }
        this.logger.log(`Position salary distributed to ${paid} users for ${monthKey}`);
    }
    async payPositionSalaryForUser(userId, monthKey) {
        const activeTeamCount = await this.getActiveTeamCount(userId);
        const eligible = [...exports.POSITIONS].reverse().find((p) => activeTeamCount >= p.requiredMembers);
        if (!eligible)
            return;
        const referenceId = `position-salary-${userId}-${monthKey}`;
        const existing = await this.prisma.walletTransaction.findFirst({
            where: { referenceId },
        });
        if (existing) {
            this.logger.warn(`Position salary already paid for ${userId} in ${monthKey}`);
            return;
        }
        const walletId = await this.walletService.getWalletId(userId);
        await this.prisma.$transaction(async (tx) => {
            await this.walletService.credit(tx, walletId, eligible.monthlySalary, client_1.TxType.POSITION_SALARY, `Position salary — ${eligible.name} (${monthKey})`, referenceId);
        });
        this.logger.log(`Paid ${eligible.monthlySalary} salary to ${userId} as ${eligible.name} for ${monthKey}`);
    }
};
exports.PositionService = PositionService;
__decorate([
    (0, schedule_1.Cron)('5 0 1 * *', { timeZone: 'Asia/Dhaka', name: 'position-salary-cron' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PositionService.prototype, "distributePositionSalaries", null);
exports.PositionService = PositionService = PositionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], PositionService);
//# sourceMappingURL=position.service.js.map