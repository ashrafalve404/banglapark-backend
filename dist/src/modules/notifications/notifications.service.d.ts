import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, type: NotificationType, title: string, body: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    getMyNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            userId: string;
            title: string;
            type: import("@prisma/client").$Enums.NotificationType;
            body: string;
            isRead: boolean;
        }[];
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
    }>;
    markAllRead(userId: string): Promise<{
        message: string;
    }>;
    markRead(notificationId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
}
