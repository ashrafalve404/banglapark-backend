import { IsString, IsNumber, IsOptional, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
    @ApiProperty({ example: 'What is 2+2?' })
    @IsString()
    question: string;

    @ApiProperty({ example: ['1', '2', '3', '4'] })
    @IsArray()
    @IsString({ each: true })
    options: string[];

    @ApiProperty({ example: 3 })
    @IsInt()
    @Min(0)
    correctIndex: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    sortOrder?: number;
}

export class PurchaseDto {
    @ApiProperty({ example: 10, description: 'Number of questions to buy' })
    @IsInt()
    @Min(1)
    questionCount: number;

    @ApiPropertyOptional({ default: 'WALLET' })
    @IsOptional()
    @IsString()
    paymentMethod?: string;
}

export class SubmitAnswerDto {
    @ApiProperty({ example: 'question-uuid' })
    @IsString()
    questionId: string;

    @ApiProperty({ example: 2 })
    @IsInt()
    @Min(0)
    selectedIndex: number;
}
