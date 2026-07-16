import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionDto {
    @ApiProperty({ example: 'What is 2+2?' })
    @IsString()
    question: string;

    @ApiProperty({ example: ['1', '2', '3', '4'] })
    @IsArray()
    @IsString({ each: true })
    options: string[];

    @ApiProperty({ example: 3, description: 'Index of the correct answer (0-based)' })
    @IsInt()
    @Min(0)
    correctIndex: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    sortOrder?: number;
}

export class CreateQuizDto {
    @ApiProperty({ example: 'General Knowledge Quiz' })
    @IsString()
    title: string;

    @ApiProperty({ example: 50 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ default: 2 })
    @IsOptional()
    @IsInt()
    @Min(1)
    timeLimit?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ type: [QuestionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    questions: QuestionDto[];
}

export class UpdateQuizDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    timeLimit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class SubmitQuizDto {
    @ApiProperty({ description: 'Array of { questionId, selectedIndex } answers' })
    @IsArray()
    answers: { questionId: string; selectedIndex: number }[];
}
