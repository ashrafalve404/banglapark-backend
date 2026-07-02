import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(
        userId: string,
        type: NotificationType,
        title: string,
        body: string,
    ) {
        return this.prisma.notification.create({
            data: { userId, type, title, body },
        });
    }

    async getMyNotifications(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where: { userId } }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        return { notifications, total, unreadCount, page, limit };
    }

    async markAllRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { message: 'All notifications marked as read' };
    }

    async markRead(notificationId: string, userId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
}
