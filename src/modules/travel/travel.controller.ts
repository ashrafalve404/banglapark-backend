import {
    Controller, Get, Post, Delete,
    Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TravelService } from './travel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Travel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('travel')
export class TravelController {
    constructor(private readonly travelService: TravelService) { }

    // ── User: get own eligibility ──────────────────────────────────────────
    @Get('eligibility')
    @ApiOperation({ summary: 'Get current user travel eligibility for this month' })
    getUserEligibility(@CurrentUser('id') userId: string) {
        return this.travelService.getUserEligibility(userId);
    }
    // ── Public/User: get monthly travel achievers ─────────────────────────
    @Get('achievers')
    @ApiOperation({ summary: 'Get list of monthly travel achievers' })
    getAchievers(
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number,
    ) {
        return this.travelService.getAchieversList(month, year);
    }

    // ── Admin: get tiers for a month/year ─────────────────────────────────
    @Get('admin/tiers')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: '[Admin] Get travel tiers for a month/year' })
    getAdminTiers(
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number,
    ) {
        return this.travelService.getTiersForMonth(month, year);
    }

    // ── Admin: upsert tier destinations ───────────────────────────────────
    @Post('admin/tiers')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: '[Admin] Upsert travel tier destinations' })
    upsertTier(
        @Body() body: {
            tierNumber: number;
            destinations: string[];
            month: number;
            year: number;
        },
    ) {
        return this.travelService.upsertTier(
            body.tierNumber,
            body.destinations,
            body.month,
            body.year,
        );
    }

    // ── Admin: clear a tier for a month ───────────────────────────────────
    @Delete('admin/tiers/:tierNumber')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: '[Admin] Clear travel tier for a month/year' })
    clearTier(
        @Param('tierNumber', ParseIntPipe) tierNumber: number,
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number,
    ) {
        return this.travelService.clearTier(tierNumber, month, year);
    }
}
