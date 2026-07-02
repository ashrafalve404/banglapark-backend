import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales')
    @ApiOperation({ summary: '[Admin] Sales report (delivered orders)' })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    getSales(
        @Query('page') page = 1,
        @Query('limit') limit = 50,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getSalesReport(
            from ? new Date(from) : undefined,
            to ? new Date(to) : undefined,
            +page,
            +limit,
        );
    }

    @Get('commissions')
    @ApiOperation({ summary: '[Admin] Commission payout report' })
    getCommissions(
        @Query('page') page = 1,
        @Query('limit') limit = 50,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getCommissionReport(
            from ? new Date(from) : undefined,
            to ? new Date(to) : undefined,
            +page,
            +limit,
        );
    }

    @Get('active-users')
    @ApiOperation({ summary: '[Admin] Active user report' })
    getActiveUsers(@Query('page') page = 1, @Query('limit') limit = 50) {
        return this.reportsService.getActiveUserReport(+page, +limit);
    }
}
