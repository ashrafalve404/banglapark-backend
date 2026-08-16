import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCpaTaskDto {
    @ApiProperty({ example: 'Complete Survey Task', description: 'Title of the CPA task' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Complete the survey and earn rewards.', description: 'Description of the CPA task' })
    @IsString()
    description: string;

    @ApiProperty({ example: 20, description: 'Price in BDT user pays to buy this task' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ example: 'https://example.com/cpa-landing', description: 'Redirect URL assigned by admin' })
    @IsString()
    redirectLink: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateCpaTaskDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    redirectLink?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
