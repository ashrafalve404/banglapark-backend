import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PositionService, POSITIONS } from './position.service';

@ApiTags('Position')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('position')
export class PositionController {
    constructor(private readonly positionService: PositionService) { }

    @Get('my')
    @ApiOperation({ summary: 'Get current user position eligibility and active team count' })
    async getMyPosition(@CurrentUser('id') userId: string) {
        return this.positionService.getUserPositionData(userId);
    }

    @Get('list')
    @ApiOperation({ summary: 'Get all positions and their requirements' })
    getPositionList() {
        return { positions: POSITIONS };
    }

    @Get('admin/members')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] List all users with their position/active team info' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async adminListMembers(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('search') search?: string,
    ) {
        return this.positionService.adminListMembersWithPosition(+page, +limit, search);
    }

    @Post('admin/pay/:userId')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Manually trigger position salary for a specific user' })
    async adminPayUser(@Param('userId') userId: string) {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await this.positionService.payPositionSalaryForUser(userId, monthKey);
        return { success: true, message: `Salary triggered for user ${userId} for ${monthKey}` };
    }

    @Post('admin/distribute')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Manually run the full position salary distribution' })
    async adminDistribute() {
        await this.positionService.distributePositionSalaries();
        return { success: true, message: 'Position salary distribution triggered' };
    }
}

