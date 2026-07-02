import {
    Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

class SetConfigDto {
    @ApiProperty() @IsString() key: string;
    @ApiProperty() @IsObject() value: Record<string, unknown>;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Platform-wide stats' })
    getStats() { return this.adminService.getPlatformStats(); }

    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    getUsers(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUsers(+page, +limit, search);
    }

    @Patch('users/:id/ban')
    @ApiOperation({ summary: 'Ban a user' })
    ban(@Param('id') id: string) { return this.adminService.banUser(id); }

    @Patch('users/:id/unban')
    @ApiOperation({ summary: 'Unban a user' })
    unban(@Param('id') id: string) { return this.adminService.unbanUser(id); }

    @Patch('users/:id/activate')
    @ApiOperation({ summary: 'Force-activate a user for 30 days' })
    activate(@Param('id') id: string) { return this.adminService.overrideActivation(id, true); }

    @Patch('users/:id/deactivate')
    @ApiOperation({ summary: 'Force-deactivate a user' })
    deactivate(@Param('id') id: string) { return this.adminService.overrideActivation(id, false); }

    @Get('config')
    @ApiOperation({ summary: 'List all platform configs (income rules, thresholds)' })
    getConfigs() { return this.adminService.getAllConfigs(); }

    @Post('config')
    @ApiOperation({ summary: 'Set a platform config value' })
    setConfig(@Body() dto: SetConfigDto) { return this.adminService.setConfig(dto.key, dto.value); }
}
