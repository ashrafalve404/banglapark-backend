import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
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
    markRead(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        message: string;
    }>;
    clearAll(userId: string): Promise<{
        message: string;
    }>;
    deleteOne(id: string, userId: string): Promise<{
        message: string;
    }>;
}
