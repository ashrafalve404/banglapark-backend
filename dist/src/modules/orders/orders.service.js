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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const commission_service_1 = require("../commission/commission.service");
const wallet_service_1 = require("../wallet/wallet.service");
const client_1 = require("@prisma/client");
let OrdersService = OrdersService_1 = class OrdersService {
    prisma;
    commissionService;
    walletService;
    configService;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(prisma, commissionService, walletService, configService) {
        this.prisma = prisma;
        this.commissionService = commissionService;
        this.walletService = walletService;
        this.configService = configService;
    }
    async create(userId, dto) {
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });
        if (products.length !== dto.items.length) {
            throw new common_1.BadRequestException('One or more products not found or inactive');
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        let total = 0;
        for (const item of dto.items) {
            const product = productMap.get(item.productId);
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for product: ${product.name}`);
            }
            total += Number(product.price) * item.quantity;
        }
        const qualifyingAmount = this.configService.get('app.qualifyingOrderAmount') ?? 2000;
        const isQualifying = total >= qualifyingAmount;
        const order = await this.prisma.$transaction(async (tx) => {
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
                            price: productMap.get(item.productId).price,
                        })),
                    },
                },
                include: { items: { include: { product: true } } },
            });
        });
        return order;
    }
    async findMyOrders(userId, page = 1, limit = 20) {
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
    async findOne(id, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (userId && order.userId !== userId)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updateStatus(orderId, dto) {
        const order = await this.findOne(orderId);
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot update a cancelled order');
        }
        if (dto.status === order.status)
            return order;
        const qualifyingAmount = this.configService.get('app.qualifyingOrderAmount') ?? 2000;
        const activationDays = this.configService.get('app.activationPeriodDays') ?? 30;
        if (dto.status === client_1.OrderStatus.DELIVERED) {
            const deliveredAt = new Date();
            const userBeforeUpdate = await this.prisma.user.findUnique({
                where: { id: order.userId },
                select: { isFirstActivated: true },
            });
            const isFirstTime = !userBeforeUpdate?.isFirstActivated;
            await this.prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: client_1.OrderStatus.DELIVERED,
                        deliveredAt,
                        commissionTriggered: order.isQualifying ? true : order.commissionTriggered,
                    },
                });
                if (order.isQualifying && Number(order.total) >= qualifyingAmount) {
                    const activeUntil = new Date(deliveredAt.getTime() + activationDays * 86_400_000);
                    await tx.user.update({
                        where: { id: order.userId },
                        data: {
                            status: 'ACTIVE',
                            activeUntil,
                            isFirstActivated: true,
                        },
                    });
                    this.logger.log(`User ${order.userId} activated until ${activeUntil.toISOString()}`);
                }
            });
            if (order.isQualifying && isFirstTime && !order.commissionTriggered) {
                await this.commissionService.triggerGenerationCommission(order.userId, orderId);
                this.logger.log(`Generation commission triggered for user ${order.userId}`);
            }
            return this.findOne(orderId);
        }
        if (dto.status === client_1.OrderStatus.CANCELLED) {
            await this.prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: client_1.OrderStatus.CANCELLED },
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
    async findAll(page = 1, limit = 20, status) {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        commission_service_1.CommissionService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map