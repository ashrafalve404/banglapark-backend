import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Get()
    @ApiOperation({ summary: 'List all banners (public)' })
    findAll() { return this.bannersService.findAll(); }

    @Get('active')
    @ApiOperation({ summary: 'List active banners only (public)' })
    findActive() { return this.bannersService.findActive(); }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Create banner' })
    create(@Body() dto: CreateBannerDto) { return this.bannersService.create(dto); }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update banner' })
    update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
        return this.bannersService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Delete banner' })
    remove(@Param('id') id: string) { return this.bannersService.remove(id); }
}
