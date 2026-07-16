import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuizCategoryDto {
    @ApiProperty({ example: 'General Knowledge' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'https://example.com/category.jpg' })
    @IsUrl({ require_tld: false })
    imageUrl: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateQuizCategoryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
