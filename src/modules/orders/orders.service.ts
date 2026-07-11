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

        // ── Determine delivery charge ────────────────────────────────────────
        let deliveryCharge = 0;
        if (dto.deliveryArea) {
            const configs = await this.prisma.platformConfig.findMany({
                where: { key: { in: ['deliveryChargeInsideDhaka', 'deliveryChargeOutsideDhaka'] } },
            });
            const configMap = new Map(configs.map((c) => [c.key, Number(c.value)]));
            const insideCharge = configMap.get('deliveryChargeInsideDhaka') ?? 60;
            const outsideCharge = configMap.get('deliveryChargeOutsideDhaka') ?? 150;
            deliveryCharge = dto.deliveryArea === 'INSIDE_DHAKA' ? insideCharge : outsideCharge;
        }

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
                    total: total + deliveryCharge,
                    deliveryArea: dto.deliveryArea,
                    deliveryCharge,
                    paymentMethod: dto.paymentMethod ?? 'CASH_ON_DELIVERY',
                    transactionId: dto.transactionId,
                    userBkashNumber: dto.userBkashNumber,
                    isQualifying,
                    shippingAddress: dto.shippingAddress ?? {},
                    notes: dto.notes,
                    items: {
                        create: dto.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: productMap.get(item.productId)!.price,
                            size: item.size,
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
     * Validates the status flow: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
     * On DELIVERED:
     *  1. Activates user if qualifying order (≥ BDT 2,000)
     *  2. Triggers generation commission inside same transaction (first activation only)
     */
    async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
        const order = await this.findOne(orderId);

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cannot update a cancelled order');
        }
        if (dto.status === order.status) return order;

        // ── Status transition validation ──────────────────────────────────────
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: [],
        };

        const allowed = validTransitions[order.status];
        if (!allowed || !allowed.includes(dto.status)) {
            throw new BadRequestException(
                `Invalid order status transition: ${order.status} → ${dto.status}`,
            );
        }

        const activationDays = this.configService.get<number>('app.activationPeriodDays') ?? 30;

        // ── Transitioning to DELIVERED ────────────────────────────────────────
        if (dto.status === OrderStatus.DELIVERED) {
            const deliveredAt = new Date();

            await this.prisma.$transaction(async (tx) => {
                // 1. Read user state BEFORE mutations
                const user = await tx.user.findUnique({
                    where: { id: order.userId },
                    select: { isFirstActivated: true },
                });
                const isFirstActivation = !user?.isFirstActivated;

                // 2. Update order status
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: OrderStatus.DELIVERED,
                        deliveredAt,
                        commissionTriggered: order.isQualifying ? true : order.commissionTriggered,
                    },
                });

                // 3. Activate user if qualifying order
                if (order.isQualifying) {
                    const activeUntil = new Date(deliveredAt.getTime() + activationDays * 86_400_000);

                    await tx.user.update({
                        where: { id: order.userId },
                        data: {
                            status: 'ACTIVE',
                            activeFrom: deliveredAt,
                            activeUntil,
                            isFirstActivated: true,
                        },
                    });

                    this.logger.log(`User ${order.userId} activated until ${activeUntil.toISOString()}`);
                } else {
                    this.logger.warn(
                        `Order ${orderId} (total: ${order.total}) marked DELIVERED but NOT qualifying — user ${order.userId} not activated`,
                    );
                }

                // 4. Trigger generation commission inside same transaction (first activation only)
                if (order.isQualifying && isFirstActivation) {
                    await this.commissionService.triggerGenerationCommission(
                        order.userId,
                        orderId,
                        tx,
                    );
                    this.logger.log(`Generation commission triggered for user ${order.userId}`);
                }
            });

            return this.findOne(orderId);
        }

        // ── CANCELLED ─────────────────────────────────────────────────────────
        if (dto.status === OrderStatus.CANCELLED) {
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

        // ── Non-terminal transitions (CONFIRMED, PROCESSING, SHIPPED) ───────
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: dto.status },
            include: { items: true },
        });
    }

    async updateItemQuantity(orderId: string, itemId: string, newQty: number) {
        const order = await this.findOne(orderId);

        const item = order.items.find((i) => i.id === itemId);
        if (!item) throw new NotFoundException('Order item not found');

        if (newQty >= item.quantity) {
            throw new BadRequestException('New quantity must be less than current quantity');
        }

        const diff = item.quantity - newQty;
        const priceDelta = Number(item.price) * diff;

        await this.prisma.$transaction(async (tx) => {
            await tx.orderItem.update({
                where: { id: itemId },
                data: { quantity: newQty },
            });

            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: diff } },
            });

            const newTotal = Number(order.total) - priceDelta;
            await tx.order.update({
                where: { id: orderId },
                data: { total: newTotal < 0 ? 0 : newTotal },
            });
        });

        return this.findOne(orderId);
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
