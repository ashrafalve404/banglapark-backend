import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CpaMarketingService } from './cpa-marketing.service';
import { CreateCpaTaskDto, UpdateCpaTaskDto } from './dto/cpa-marketing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('CPA Marketing')
@Controller('cpa-marketing')
export class CpaMarketingController {
    constructor(private readonly cpaService: CpaMarketingService) { }

    // ── Admin Endpoints ──────────────────────────────────────────────────────

    @Get('admin/tasks')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Get all CPA tasks with secret redirect links' })
    async adminGetAllTasks() {
        return this.cpaService.adminGetAllTasks();
    }

    @Post('admin/tasks')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Create a new CPA task' })
    async adminCreateTask(@Body() dto: CreateCpaTaskDto) {
        return this.cpaService.adminCreateTask(dto);
    }

    @Patch('admin/tasks/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Update an existing CPA task' })
    async adminUpdateTask(@Param('id') id: string, @Body() dto: UpdateCpaTaskDto) {
        return this.cpaService.adminUpdateTask(id, dto);
    }

    @Delete('admin/tasks/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Delete a CPA task' })
    async adminDeleteTask(@Param('id') id: string) {
        return this.cpaService.adminDeleteTask(id);
    }

    // ── User Endpoints ───────────────────────────────────────────────────────

    @Get('public/tasks')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User: List active CPA tasks (redirect link omitted for privacy)' })
    async userGetPublicTasks(@CurrentUser('id') userId: string) {
        return this.cpaService.userGetPublicTasks(userId);
    }

    @Post('user/buy/:taskId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User: Purchase a CPA task using Wallet balance' })
    async userBuyTask(
        @CurrentUser('id') userId: string,
        @Param('taskId') taskId: string,
    ) {
        return this.cpaService.userBuyTask(userId, taskId);
    }

    @Get('user/my-purchases')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User: Get purchased CPA tasks with redirect links for Daily Work' })
    async userGetMyPurchases(@CurrentUser('id') userId: string) {
        return this.cpaService.userGetMyPurchases(userId);
    }
}
