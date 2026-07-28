import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserProductDto {
    @ApiProperty({ example: 'Handmade Leather Wallet' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Premium quality handmade leather wallet.' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 1200 })
    @IsNumber()
    @Min(1)
    price: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    stock?: number;

    @ApiPropertyOptional({ example: 'cat-uuid-here' })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ example: ['http://api.banglapark.com/uploads/product1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiPropertyOptional({ example: ['M', 'L'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sizes?: string[];
}
