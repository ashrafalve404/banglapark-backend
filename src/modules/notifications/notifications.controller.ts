import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications (paginated)' })
    getMyNotifications(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.notificationsService.getMyNotifications(userId, +page, +limit);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.notificationsService.markRead(id, userId);
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllRead(@CurrentUser('id') userId: string) {
        return this.notificationsService.markAllRead(userId);
    }

    @Delete('clear-all')
    @ApiOperation({ summary: 'Clear all notifications' })
    clearAll(@CurrentUser('id') userId: string) {
        return this.notificationsService.clearAll(userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a single notification' })
    deleteOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.notificationsService.deleteNotification(id, userId);
    }
}
