import {
    IsString, IsNumber, IsOptional, IsArray, IsBoolean,
    Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @ApiProperty() @IsString() @MaxLength(200) name: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) price: number;
    @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) stock: number;
    @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
    @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
    @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) sizes?: string[];
}

export class UpdateProductDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) price?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) stock?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
    @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
    @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) sizes?: string[];
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ProductQueryDto {
    @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
    @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() page?: number;
    @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() limit?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}
