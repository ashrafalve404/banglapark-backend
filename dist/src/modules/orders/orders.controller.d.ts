import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemQuantityDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
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
                costPrice: import("@prisma/client/runtime/library").Decimal | null;
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
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    getMyOrders(userId: string, page?: number, limit?: number): Promise<{
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
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            userBkashNumber: string | null;
            deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
            deliveryCharge: import("@prisma/client/runtime/library").Decimal;
            isQualifying: boolean;
            shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
            notes: string | null;
            deliveredAt: Date | null;
            commissionTriggered: boolean;
            commissionReversed: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getMyOrder(userId: string, id: string): Promise<{
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
                costPrice: import("@prisma/client/runtime/library").Decimal | null;
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
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    findAll(page?: number, limit?: number, status?: OrderStatus, search?: string): Promise<{
        orders: ({
            user: {
                id: string;
                email: string;
                phone: string;
                name: string;
            };
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
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            userBkashNumber: string | null;
            deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
            deliveryCharge: import("@prisma/client/runtime/library").Decimal;
            isQualifying: boolean;
            shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
            notes: string | null;
            deliveredAt: Date | null;
            commissionTriggered: boolean;
            commissionReversed: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getOrder(id: string): Promise<{
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
                costPrice: import("@prisma/client/runtime/library").Decimal | null;
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
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<any>;
    updateItemQuantity(orderId: string, itemId: string, dto: UpdateOrderItemQuantityDto): Promise<{
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
                costPrice: import("@prisma/client/runtime/library").Decimal | null;
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
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        userBkashNumber: string | null;
        deliveryArea: import("@prisma/client").$Enums.DeliveryArea | null;
        deliveryCharge: import("@prisma/client/runtime/library").Decimal;
        isQualifying: boolean;
        shippingAddress: import("@prisma/client/runtime/library").JsonValue | null;
        notes: string | null;
        deliveredAt: Date | null;
        commissionTriggered: boolean;
        commissionReversed: boolean;
    }>;
}
