import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DailyBenefitService } from './daily-benefit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Daily Benefit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-benefit')
export class DailyBenefitController {
    constructor(private readonly dailyBenefitService: DailyBenefitService) { }

    @Get('tiers')
    @ApiOperation({ summary: 'Get the daily benefit tier table' })
    getTiers() {
        return this.dailyBenefitService.getTiers();
    }

    @Get('my/logs')
    @ApiOperation({ summary: 'Get my daily benefit history' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getMyLogs(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.dailyBenefitService.getLogs(userId, +page, +limit);
    }

    @Get('admin/logs')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Get all daily benefit logs' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getAllLogs(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.dailyBenefitService.getLogs(undefined, +page, +limit);
    }
}
