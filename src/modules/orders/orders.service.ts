import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, TxType } from '@prisma/client';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly commissionService: CommissionService,
        private readonly walletService: WalletService,
        private readonly configService: ConfigService,
    ) { }

    async create(userId: string, dto: CreateOrderDto) {
        // Load products and validate stock
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });

        if (products.length !== dto.items.length) {
            throw new BadRequestException('One or more products not found or inactive');
        }

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Calculate total and check stock
        let total = 0;
        for (const item of dto.items) {
            const product = productMap.get(item.productId)!;
            if (product.stock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
            }
            total += Number(product.price) * item.quantity;
        }

        const qualifyingAmount = this.configService.get<number>('app.qualifyingOrderAmount') ?? 2000;
        const isQualifying = total >= qualifyingAmount;

        const order = await this.prisma.$transaction(async (tx) => {
            // Decrement stock
            for (const item of dto.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return tx.order.create({
                data: {
                    userId,
                    total,
                    isQualifying,
                    shippingAddress: dto.shippingAddress ?? {},
                    notes: dto.notes,
                    items: {
                        create: dto.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: productMap.get(item.productId)!.price,
                        })),
                    },
                },
                include: { items: { include: { product: true } } },
            });
        });

        return order;
    }

    async findMyOrders(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: { userId },
                skip,
                take: limit,
                include: { items: { include: { product: { select: { id: true, name: true, images: true } } } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where: { userId } }),
        ]);
        return { orders, total, page, limit };
    }

    async findOne(id: string, userId?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (userId && order.userId !== userId)
            throw new NotFoundException('Order not found');
        return order;
    }

    /**
     * Admin-only: update order status.
     * On transition to DELIVERED:
     *  1. Activate user if qualifying order & first time
     *  2. Trigger generation commission (idempotent)
     */
    async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
        const order = await this.findOne(orderId);

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cannot update a cancelled order');
        }
        if (dto.status === order.status) return order;

        const qualifyingAmount = this.configService.get<number>('app.qualifyingOrderAmount') ?? 2000;
        const activationDays = this.configService.get<number>('app.activationPeriodDays') ?? 30;

        // ── Transitioning to DELIVERED ────────────────────────────────────────
        if (dto.status === OrderStatus.DELIVERED && !order.commissionTriggered) {
            const deliveredAt = new Date();

            await this.prisma.$transaction(async (tx) => {
                // 1. Update order
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: OrderStatus.DELIVERED,
                        deliveredAt,
                        commissionTriggered: order.isQualifying,
                    },
                });

                // 2. Activate user if qualifying
                if (order.isQualifying && Number(order.total) >= qualifyingAmount) {
                    const user = await tx.user.findUnique({
                        where: { id: order.userId },
                        select: { isFirstActivated: true, status: true },
                    });

                    const activeUntil = new Date(deliveredAt.getTime() + activationDays * 86_400_000);

                    await tx.user.update({
                        where: { id: order.userId },
                        data: {
                            status: 'ACTIVE',
                            activeUntil,
                            isFirstActivated: user?.isFirstActivated || false ? true : true,
                        },
                    });

                    this.logger.log(`User ${order.userId} activated until ${activeUntil.toISOString()}`);
                }
            });

            // 3. Trigger generation commission outside order transaction (has its own tx)
            if (order.isQualifying) {
                const user = await this.prisma.user.findUnique({
                    where: { id: order.userId },
                    select: { isFirstActivated: true },
                });
                // Commission only on FIRST activation
                if (!user?.isFirstActivated) {
                    await this.commissionService.triggerGenerationCommission(order.userId, orderId);
                    // Mark user as having been activated at least once
                    await this.prisma.user.update({
                        where: { id: order.userId },
                        data: { isFirstActivated: true },
                    });
                }
            }

            return this.findOne(orderId);
        }

        // ── Other status transitions ────────────────────────────────────────────
        if (dto.status === OrderStatus.CANCELLED) {
            // Restore stock
            await this.prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.CANCELLED },
                });
            });
            return this.findOne(orderId);
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: dto.status },
            include: { items: true },
        });
    }

    // Admin: get all orders
    async findAll(page = 1, limit = 20, status?: OrderStatus) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { orders, total, page, limit };
    }
}
