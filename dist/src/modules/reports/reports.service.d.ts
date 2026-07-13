import { PrismaService } from '../../prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSalesReport(from?: Date, to?: Date, page?: number, limit?: number): Promise<{
        orders: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
            items: ({
                product: {
                    name: string;
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
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getCommissionReport(from?: Date, to?: Date, page?: number, limit?: number): Promise<{
        commissions: ({
            toUser: {
                id: string;
                email: string;
                name: string;
            };
            fromUser: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            level: number;
            toUserId: string;
            fromUserId: string;
            orderId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPaid: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getActiveUserReport(page?: number, limit?: number): Promise<{
        users: {
            id: string;
            email: string;
            phone: string;
            name: string;
            activeUntil: Date | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
}
