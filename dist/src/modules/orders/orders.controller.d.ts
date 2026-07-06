import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(userId: string, dto: CreateOrderDto): Promise<{
        items: ({
            product: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                slug: string;
                description: string | null;
                stock: number;
                categoryId: string;
                images: string[];
                sizes: string[];
                isActive: boolean;
            };
        } & {
            id: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            size: string | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.OrderStatus;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMyOrders(userId: string, page?: number, limit?: number): Promise<{
        orders: ({
            items: ({
                product: {
                    name: string;
                    id: string;
                    images: string[];
                };
            } & {
                id: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                size: string | null;
                productId: string;
                orderId: string;
            })[];
        } & {
            id: string;
            userId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: import("@prisma/client").$Enums.OrderStatus;
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
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getMyOrder(userId: string, id: string): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
        };
        items: ({
            product: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                slug: string;
                description: string | null;
                stock: number;
                categoryId: string;
                images: string[];
                sizes: string[];
                isActive: boolean;
            };
        } & {
            id: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            size: string | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.OrderStatus;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit?: number, status?: OrderStatus): Promise<{
        orders: ({
            user: {
                name: string;
                id: string;
                email: string;
            };
            items: {
                id: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                size: string | null;
                productId: string;
                orderId: string;
            }[];
        } & {
            id: string;
            userId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: import("@prisma/client").$Enums.OrderStatus;
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
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getOrder(id: string): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
        };
        items: ({
            product: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                slug: string;
                description: string | null;
                stock: number;
                categoryId: string;
                images: string[];
                sizes: string[];
                isActive: boolean;
            };
        } & {
            id: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            size: string | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.OrderStatus;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<{
        items: {
            id: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            size: string | null;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        userId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.OrderStatus;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
}
