import { IsString, IsOptional, IsUrl, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBannerDto {
    @ApiProperty({ example: 'https://example.com/banner.jpg' })
    @IsUrl()
    imageUrl: string;

    @ApiPropertyOptional({ example: '/shop' })
    @IsOptional()
    @IsUrl()
    linkUrl?: string;

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
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
