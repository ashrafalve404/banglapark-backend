import { OrderStatus, PaymentMethod, DeliveryArea } from '@prisma/client';
export declare class OrderItemDto {
    productId: string;
    quantity: number;
    size?: string;
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    shippingAddress?: Record<string, string>;
    notes?: string;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
    userBkashNumber?: string;
    deliveryArea?: DeliveryArea;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
}
