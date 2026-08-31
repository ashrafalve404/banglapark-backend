import {
    Controller, Get, Post, Patch, UseGuards, Query, Body, Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsNumber, IsString, Min, IsOptional } from 'class-validator';
import { DepositService, ADMIN_BKASH_NUMBER } from './deposit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DepositStatus } from '@prisma/client';

class SubmitDepositDto {
    @IsNumber()
    @Min(10)
    amount: number;

    @IsString()
    transactionId: string;

    @IsString()
    senderPhone: string;
}

class AdminActionDto {
    @IsOptional()
    @IsString()
    adminNote?: string;
}

@ApiTags('Deposit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deposit')
export class DepositController {
    constructor(private readonly depositService: DepositService) { }

    @Get('admin-info')
    @ApiOperation({ summary: 'Get admin Bkash number for deposit' })
    getAdminInfo() {
        return { bkashNumber: ADMIN_BKASH_NUMBER };
    }

    @Post()
    @ApiOperation({ summary: 'Submit a Bkash deposit request' })
    submit(@CurrentUser('id') userId: string, @Body() dto: SubmitDepositDto) {
        return this.depositService.submitRequest(userId, {
            amount: Number(dto.amount),
            transactionId: dto.transactionId,
            senderPhone: dto.senderPhone,
        });
    }

    @Get('my')
    @ApiOperation({ summary: 'Get my deposit request history' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getMyRequests(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.depositService.getMyRequests(userId, +page, +limit);
    }

    // Admin routes
    @Get('admin/list')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] List all deposit requests' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: DepositStatus })
    adminList(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: DepositStatus,
    ) {
        return this.depositService.adminList(+page, +limit, status);
    }

    @Patch('admin/:id/approve')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] Approve a deposit request' })
    approve(@Param('id') id: string, @Body() dto: AdminActionDto) {
        return this.depositService.approve(id, dto.adminNote);
    }

    @Patch('admin/:id/reject')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] Reject a deposit request' })
    reject(@Param('id') id: string, @Body() dto: AdminActionDto) {
        return this.depositService.reject(id, dto.adminNote);
    }
}
