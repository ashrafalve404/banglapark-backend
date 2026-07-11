import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersService {
    private readonly prisma;
    private readonly commissionService;
    private readonly walletService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, commissionService: CommissionService, walletService: WalletService, configService: ConfigService);
    create(userId: string, dto: CreateOrderDto): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                categoryId: string | null;
                images: string[];
                sizes: string[];
                isActive: boolean;
                clicks: number;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            quantity: number;
            size: string | null;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    findMyOrders(userId: string, page?: number, limit?: number): Promise<{
        orders: ({
            items: ({
                product: {
                    id: string;
                    name: string;
                    images: string[];
                };
            } & {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
                productId: string;
                quantity: number;
                size: string | null;
            })[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
            notes: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            userBkashNumber: string | null;
            deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
            deliveryCharge: import("@prisma/client/runtime/library").Decimal;
            isQualifying: boolean;
            deliveredAt: Date | null;
            commissionTriggered: boolean;
            commissionReversed: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, userId?: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                categoryId: string | null;
                images: string[];
                sizes: string[];
                isActive: boolean;
                clicks: number;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            quantity: number;
            size: string | null;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<{
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            quantity: number;
            size: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    updateItemQuantity(orderId: string, itemId: string, newQty: number): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                categoryId: string | null;
                images: string[];
                sizes: string[];
                isActive: boolean;
                clicks: number;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
            quantity: number;
            size: string | null;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    findAll(page?: number, limit?: number, status?: OrderStatus): Promise<{
        orders: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
            items: {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
                productId: string;
                quantity: number;
                size: string | null;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
            notes: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            userBkashNumber: string | null;
            deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
            deliveryCharge: import("@prisma/client/runtime/library").Decimal;
            isQualifying: boolean;
            deliveredAt: Date | null;
            commissionTriggered: boolean;
            commissionReversed: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
