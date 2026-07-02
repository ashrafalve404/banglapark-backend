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
var CommissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const client_1 = require("@prisma/client");
let CommissionService = CommissionService_1 = class CommissionService {
    prisma;
    walletService;
    configService;
    logger = new common_1.Logger(CommissionService_1.name);
    constructor(prisma, walletService, configService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.configService = configService;
    }
    async triggerGenerationCommission(newUserId, orderId) {
        const alreadyPaid = await this.prisma.generationCommission.findFirst({
            where: { fromUserId: newUserId },
        });
        if (alreadyPaid) {
            this.logger.log(`Generation commission already paid for user ${newUserId} — skipping`);
            return;
        }
        const levels = this.configService.get('app.generationCommissionLevels') ?? 10;
        const amount = this.configService.get('app.generationCommissionAmount') ?? 200;
        let currentId = newUserId;
        const sponsors = [];
        for (let level = 1; level <= levels; level++) {
            const user = await this.prisma.user.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });
            if (!user?.parentId)
                break;
            currentId = user.parentId;
            const sponsor = await this.prisma.user.findUnique({
                where: { id: currentId },
                select: {
                    id: true,
                    status: true,
                    wallet: { select: { id: true } },
                },
            });
            if (!sponsor || sponsor.status !== 'ACTIVE' || !sponsor.wallet) {
                this.logger.log(`Level ${level} sponsor ${currentId} is INACTIVE — skipping commission`);
                continue;
            }
            sponsors.push({ id: sponsor.id, walletId: sponsor.wallet.id, level });
        }
        if (sponsors.length === 0)
            return;
        await this.prisma.$transaction(async (tx) => {
            for (const sponsor of sponsors) {
                await this.walletService.credit(tx, sponsor.walletId, amount, client_1.TxType.GENERATION_COMMISSION, `Generation commission (Level ${sponsor.level}) from new member activation`, orderId);
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
        this.logger.log(`Generation commission paid to ${sponsors.length} sponsors for user ${newUserId}`);
    }
    async getCommissionReport(page = 1, limit = 20, userId) {
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
};
exports.CommissionService = CommissionService;
exports.CommissionService = CommissionService = CommissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], CommissionService);
//# sourceMappingURL=commission.service.js.map