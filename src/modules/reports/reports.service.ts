import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async getSalesReport(from?: Date, to?: Date, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {
            status: 'DELIVERED' as const,
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

    async getCommissionReport(from?: Date, to?: Date, page = 1, limit = 50) {
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
}
