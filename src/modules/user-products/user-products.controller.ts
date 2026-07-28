import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserProductsService } from './user-products.service';
import { CreateUserProductDto } from './dto/user-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-products')
export class UserProductsController {
    constructor(private readonly userProductsService: UserProductsService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a new product for admin approval (Active users only)' })
    createProduct(@CurrentUser('id') userId: string, @Body() dto: CreateUserProductDto) {
        return this.userProductsService.createProduct(userId, dto);
    }

    @Get('my-products')
    @ApiOperation({ summary: 'Get products submitted by the current user' })
    getMyProducts(@CurrentUser('id') userId: string) {
        return this.userProductsService.getMyProducts(userId);
    }
}
