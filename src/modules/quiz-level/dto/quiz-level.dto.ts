import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuizLevelDto {
    @ApiProperty({ example: 'Easy' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    sortOrder?: number;
}

export class UpdateQuizLevelDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    sortOrder?: number;
}
