import {
    Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemQuantityDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Place a new order (cart checkout)' })
    create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(userId, dto);
    }

    @Get('my')
    @ApiOperation({ summary: 'Get my order history' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getMyOrders(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.ordersService.findMyOrders(userId, +page, +limit);
    }

    @Get('my/:id')
    @ApiOperation({ summary: 'Get a specific order (mine only)' })
    getMyOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.ordersService.findOne(id, userId);
    }

    @Get('admin/all')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] List all orders' })
    @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
    @ApiQuery({ name: 'search', required: false, type: String })
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: OrderStatus,
        @Query('search') search?: string,
    ) {
        return this.ordersService.findAll(+page, +limit, status, search);
    }

    @Get('admin/:id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Get any order' })
    getOrder(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch('admin/:id/status')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update order status (triggers activation + commission on DELIVERED)' })
    updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(id, dto);
    }

    @Patch('admin/:orderId/items/:itemId')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Reduce quantity of an order item (restocks the difference)' })
    updateItemQuantity(
        @Param('orderId') orderId: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateOrderItemQuantityDto,
    ) {
        return this.ordersService.updateItemQuantity(orderId, itemId, dto.quantity);
    }
}
