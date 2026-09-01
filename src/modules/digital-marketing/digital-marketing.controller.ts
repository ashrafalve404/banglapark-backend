import {
    Controller, Get, Post, Patch, Delete, UseGuards, Query, Body, Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsBoolean, Min } from 'class-validator';
import { DigitalMarketingService } from './digital-marketing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class PurchasePackageDto {
    @IsString()
    packageId: string;
}

class CreatePackageDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    link?: string;

    @IsNumber()
    @Min(1)
    price: number;

    @IsOptional()
    @IsNumber()
    profitPercent?: number;

    @IsOptional()
    @IsNumber()
    durationHours?: number;

    @IsOptional()
    @IsBoolean()
    isHidden?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

class UpdatePackageDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    link?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    price?: number;

    @IsOptional()
    @IsNumber()
    profitPercent?: number;

    @IsOptional()
    @IsNumber()
    durationHours?: number;

    @IsOptional()
    @IsBoolean()
    isHidden?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

@ApiTags('Digital Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('digital-marketing')
export class DigitalMarketingController {
    constructor(private readonly dmService: DigitalMarketingService) { }

    @Get('packages')
    @ApiOperation({ summary: 'Get active digital marketing packages' })
    getPackages() {
        return this.dmService.getPackages();
    }

    @Post('purchase')
    @ApiOperation({ summary: 'Purchase a digital marketing package with wallet balance' })
    purchase(@CurrentUser('id') userId: string, @Body() dto: PurchasePackageDto) {
        return this.dmService.purchasePackage(userId, dto.packageId);
    }

    @Get('my-purchases')
    @ApiOperation({ summary: 'Get my digital marketing package purchases & active returns' })
    getMyPurchases(@CurrentUser('id') userId: string) {
        return this.dmService.getMyPurchases(userId);
    }

    // ── Admin Endpoints ──────────────────────────────────────────────────────
    @Get('admin/packages')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] Get all packages' })
    adminGetAllPackages() {
        return this.dmService.adminGetAllPackages();
    }

    @Post('admin/packages')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] Create a package' })
    adminCreatePackage(@Body() dto: CreatePackageDto) {
        return this.dmService.adminCreatePackage(dto);
    }

    @Patch('admin/packages/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] Update a package' })
    adminUpdatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
        return this.dmService.adminUpdatePackage(id, dto);
    }

    @Delete('admin/packages/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] Delete a package' })
    adminDeletePackage(@Param('id') id: string) {
        return this.dmService.adminDeletePackage(id);
    }

    @Get('admin/purchases')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: '[Admin] List all user digital marketing purchases' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    adminGetAllPurchases(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: string,
    ) {
        return this.dmService.adminGetAllPurchases(+page, +limit, status);
    }
}
