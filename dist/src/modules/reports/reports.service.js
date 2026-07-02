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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSalesReport(from, to, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {
            status: 'DELIVERED',
            ...(from || to
                ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
                : {}),
        };
        const [orders, total, aggregate] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: { include: { product: { select: { name: true } } } },
                },
                orderBy: { deliveredAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
            this.prisma.order.aggregate({ where, _sum: { total: true } }),
        ]);
        return {
            orders,
            total,
            page,
            limit,
            totalRevenue: aggregate._sum.total ?? 0,
        };
    }
    async getCommissionReport(from, to, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = from || to
            ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
            : {};
        const [commissions, total, aggregate] = await Promise.all([
            this.prisma.generationCommission.findMany({
                where,
                skip,
                take: limit,
                include: {
                    toUser: { select: { id: true, name: true, email: true } },
                    fromUser: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.generationCommission.count({ where }),
            this.prisma.generationCommission.aggregate({ where, _sum: { amount: true } }),
        ]);
        return {
            commissions,
            total,
            page,
            limit,
            totalPaid: aggregate._sum.amount ?? 0,
        };
    }
    async getActiveUserReport(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { status: 'ACTIVE' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    activeUntil: true,
                    createdAt: true,
                },
                orderBy: { activeUntil: 'asc' },
            }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        ]);
        return { users, total, page, limit };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map