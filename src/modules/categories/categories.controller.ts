import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, BulkCreateCategoriesDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'List categories' })
    @ApiQuery({ name: 'includeHidden', required: false, type: Boolean })
    findAll(@Query('includeHidden') includeHidden?: string) {
        return this.categoriesService.findAll(includeHidden === 'true');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID (public)' })
    findOne(@Param('id') id: string) { return this.categoriesService.findOne(id); }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Create category' })
    create(@Body() dto: CreateCategoryDto) { return this.categoriesService.create(dto); }

    @Post('bulk')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Bulk create categories' })
    createBulk(@Body() dto: BulkCreateCategoriesDto) {
        return this.categoriesService.createBulk(dto.names);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update category' })
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoriesService.update(id, dto);
    }

    @Patch(':id/toggle-visibility')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Toggle category hidden state' })
    toggleVisibility(@Param('id') id: string) {
        return this.categoriesService.toggleVisibility(id);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Delete category' })
    remove(@Param('id') id: string) { return this.categoriesService.remove(id); }
}
