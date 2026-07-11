import { IsString, IsOptional, IsUrl, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerSection } from '@prisma/client';

export class CreateBannerDto {
    @ApiPropertyOptional({ enum: BannerSection, default: 'SLIDER' })
    @IsOptional()
    @IsEnum(BannerSection)
    section?: BannerSection;

    @ApiProperty({ example: 'https://example.com/banner.jpg' })
    @IsUrl({ require_tld: false })
    imageUrl: string;

    @ApiPropertyOptional({ example: '/shop' })
    @IsOptional()
    @IsUrl({ require_tld: false })
    linkUrl?: string;

    @ApiPropertyOptional({ example: 'Special Deals' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'Offer' })
    @IsOptional()
    @IsString()
    badge?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class UpdateBannerDto {
    @ApiPropertyOptional({ enum: BannerSection })
    @IsOptional()
    @IsEnum(BannerSection)
    section?: BannerSection;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    linkUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    badge?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
