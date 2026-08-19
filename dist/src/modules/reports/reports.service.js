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
const user_statement_dto_1 = require("./dto/user-statement.dto");
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
    async getUserStatementReport(dto) {
        const query = dto.userQuery?.trim();
        if (!query)
            throw new common_1.NotFoundException('User search query is required');
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { id: query },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                status: true,
                activeUntil: true,
                createdAt: true,
                referralCode: true,
                parent: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        children: true,
                    },
                },
                wallet: {
                    select: {
                        id: true,
                        balance: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException(`No user found matching "${query}"`);
        const now = new Date();
        let fromDate;
        let toDate = now;
        const period = dto.period || user_statement_dto_1.ReportPeriod.THIS_MONTH;
        if (period === user_statement_dto_1.ReportPeriod.THIS_WEEK) {
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        else if (period === user_statement_dto_1.ReportPeriod.THIS_MONTH) {
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        else if (period === user_statement_dto_1.ReportPeriod.LAST_MONTH) {
            fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }
        else if (period === user_statement_dto_1.ReportPeriod.CUSTOM) {
            fromDate = dto.startDate ? new Date(dto.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
            toDate = dto.endDate ? new Date(dto.endDate) : now;
        }
        else {
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const dateWhere = {
            gte: fromDate,
            lte: toDate,
        };
        const [orders, giftCards, quizzes, withdrawals, transactions,] = await Promise.all([
            this.prisma.order.findMany({
                where: {
                    userId: user.id,
                    createdAt: dateWhere,
                },
                select: {
                    id: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    items: {
                        select: {
                            quantity: true,
                            product: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.giftCardPurchase.findMany({
                where: {
                    userId: user.id,
                    purchasedAt: dateWhere,
                },
                select: {
                    id: true,
                    pricePaid: true,
                    paymentMethod: true,
                    bkashTrxId: true,
                    status: true,
                    isSold: true,
                    soldAt: true,
                    purchasedAt: true,
                    giftCard: { select: { title: true } },
                },
                orderBy: { purchasedAt: 'desc' },
            }),
            this.prisma.quizPurchase.findMany({
                where: {
                    userId: user.id,
                    purchasedAt: dateWhere,
                },
                select: {
                    id: true,
                    totalPrice: true,
                    status: true,
                    paymentMethod: true,
                    purchasedAt: true,
                    category: { select: { name: true } },
                },
                orderBy: { purchasedAt: 'desc' },
            }),
            this.prisma.withdrawalRequest.findMany({
                where: {
                    userId: user.id,
                    createdAt: dateWhere,
                },
                select: {
                    id: true,
                    amount: true,
                    method: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            user.wallet?.id
                ? this.prisma.walletTransaction.findMany({
                    where: {
                        walletId: user.wallet.id,
                        createdAt: dateWhere,
                    },
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        description: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                })
                : Promise.resolve([]),
        ]);
        const totalOrdersSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalGiftCardsSpent = giftCards.reduce((sum, g) => sum + Number(g.pricePaid), 0);
        const totalQuizzesSpent = quizzes.reduce((sum, q) => sum + Number(q.totalPrice), 0);
        const totalSpent = totalOrdersSpent + totalGiftCardsSpent + totalQuizzesSpent;
        const totalWithdrawn = withdrawals
            .filter((w) => w.status === 'APPROVED')
            .reduce((sum, w) => sum + Number(w.amount), 0);
        const totalEarned = transactions
            .filter((t) => t.type !== 'PURCHASE' && t.type !== 'WITHDRAWAL' && t.type !== 'CPA_TASK_PURCHASE' && t.type !== 'GIFT_CARD_PURCHASE' && t.type !== 'QUIZ_PURCHASE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const itemizedLogs = [];
        orders.forEach((o) => {
            const itemNames = o.items.map((i) => i.product?.name).filter(Boolean).join(', ');
            itemizedLogs.push({
                id: `ORD-${o.id.slice(0, 8)}`,
                date: o.createdAt,
                category: 'E-Commerce Order',
                description: itemNames ? `Order: ${itemNames}` : `Order #${o.id.slice(0, 8)}`,
                paymentMethod: 'Order Payment',
                amount: Number(o.total),
                type: 'DEBIT',
                status: o.status,
            });
        });
        giftCards.forEach((g) => {
            itemizedLogs.push({
                id: `GC-${g.id.slice(0, 8)}`,
                date: g.purchasedAt,
                category: 'Gift Card Purchase',
                description: `Gift Card: ${g.giftCard?.title || 'Card'} ${g.bkashTrxId ? `(TrxID: ${g.bkashTrxId})` : ''}`,
                paymentMethod: g.paymentMethod || 'WALLET',
                amount: Number(g.pricePaid),
                type: 'DEBIT',
                status: g.status,
            });
            if (g.isSold && g.soldAt) {
                itemizedLogs.push({
                    id: `REF-${g.id.slice(0, 8)}`,
                    date: g.soldAt,
                    category: 'Gift Card Resale Refund',
                    description: `Resale Refund for ${g.giftCard?.title || 'Gift Card'}`,
                    paymentMethod: 'WALLET',
                    amount: Number(g.pricePaid),
                    type: 'CREDIT',
                    status: 'REFUNDED',
                });
            }
        });
        quizzes.forEach((q) => {
            itemizedLogs.push({
                id: `QZ-${q.id.slice(0, 8)}`,
                date: q.purchasedAt,
                category: 'Quiz Entry Fee',
                description: `Quiz: ${q.category?.name || 'Quiz Category'}`,
                paymentMethod: q.paymentMethod || 'WALLET',
                amount: Number(q.totalPrice),
                type: 'DEBIT',
                status: q.status,
            });
        });
        withdrawals.forEach((w) => {
            itemizedLogs.push({
                id: `WTH-${w.id.slice(0, 8)}`,
                date: w.createdAt,
                category: 'Withdrawal Payout',
                description: `Withdrawal via ${w.method || 'Mobile Banking'}`,
                paymentMethod: w.method || 'BANK/BKASH',
                amount: Number(w.amount),
                type: 'DEBIT',
                status: w.status,
            });
        });
        transactions.forEach((tx) => {
            const isDebit = tx.type === 'PURCHASE' || tx.type === 'WITHDRAWAL' || tx.type === 'CPA_TASK_PURCHASE' || tx.type === 'GIFT_CARD_PURCHASE' || tx.type === 'QUIZ_PURCHASE';
            itemizedLogs.push({
                id: `TX-${tx.id.slice(0, 8)}`,
                date: tx.createdAt,
                category: tx.type || 'Wallet Event',
                description: tx.description || tx.type,
                paymentMethod: 'WALLET',
                amount: Number(tx.amount),
                type: isDebit ? 'DEBIT' : 'CREDIT',
                status: 'COMPLETED',
            });
        });
        itemizedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                status: user.status,
                activeUntil: user.activeUntil,
                createdAt: user.createdAt,
                sponsor: user.parent ? { name: user.parent.name, phone: user.parent.phone } : null,
                teamCount: user._count?.children ?? 0,
            },
            periodInfo: {
                period,
                fromDate,
                toDate,
            },
            summary: {
                totalSpent,
                totalEarned,
                currentWalletBalance: Number(user.wallet?.balance ?? 0),
                totalWithdrawn,
            },
            expenditureBreakdown: {
                orders: { count: orders.length, totalAmount: totalOrdersSpent },
                giftCards: { count: giftCards.length, totalAmount: totalGiftCardsSpent },
                quizzes: { count: quizzes.length, totalAmount: totalQuizzesSpent },
            },
            itemizedLogs: itemizedLogs.slice(0, 200),
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map