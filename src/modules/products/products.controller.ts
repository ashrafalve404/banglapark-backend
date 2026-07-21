import {
    Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'List all active products (public)' })
    findAll(@Query() query: ProductQueryDto) { return this.productsService.findAll(query); }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID or slug (public)' })
    findOne(@Param('id') id: string) { return this.productsService.findOne(id); }

    @Post(':id/click')
    @ApiOperation({ summary: 'Record a product click (public)' })
    recordClick(@Param('id') id: string) { return this.productsService.recordClick(id); }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Create product' })
    create(@Body() dto: CreateProductDto) { return this.productsService.create(dto); }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update product' })
    update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productsService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Soft-delete product' })
    remove(@Param('id') id: string) { return this.productsService.remove(id); }

    @Post('bulk-delete')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Bulk soft-delete products' })
    bulkRemove(@Body('ids') ids: string[]) {
        return this.productsService.bulkRemove(ids);
    }
}
