import {
    Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { WithdrawStatus } from '@prisma/client';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto, ReviewWithdrawalDto } from './dto/withdrawal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Withdrawal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdrawals')
export class WithdrawalController {
    constructor(private readonly withdrawalService: WithdrawalService) { }

    @Post()
    @ApiOperation({ summary: 'Request a withdrawal' })
    request(@CurrentUser('id') userId: string, @Body() dto: CreateWithdrawalDto) {
        return this.withdrawalService.request(userId, dto);
    }

    @Get('my')
    @ApiOperation({ summary: 'Get my withdrawal requests' })
    getMyRequests(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.withdrawalService.getMyRequests(userId, +page, +limit);
    }

    @Get('admin/all')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] List all withdrawal requests' })
    @ApiQuery({ name: 'status', required: false, enum: WithdrawStatus })
    getAllRequests(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: WithdrawStatus,
    ) {
        return this.withdrawalService.getAllRequests(+page, +limit, status);
    }

    @Patch('admin/:id/review')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Approve or reject a withdrawal' })
    review(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
        @Body() dto: ReviewWithdrawalDto,
    ) {
        return this.withdrawalService.review(id, adminId, dto);
    }
}
