import {
    IsNumber, IsEnum, IsOptional, IsString, Min, ValidateIf,
    IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WithdrawMethod, WithdrawStatus } from '@prisma/client';

export class CreateWithdrawalDto {
    @ApiProperty({ example: 1500 })
    @IsNumber()
    @Min(1000)
    @Type(() => Number)
    amount: number;

    @ApiProperty({ enum: WithdrawMethod })
    @IsEnum(WithdrawMethod)
    method: WithdrawMethod;

    @ApiProperty({
        example: { accountNumber: '01812345678', accountName: 'Rahim' },
    })
    @IsObject()
    accountDetails: Record<string, string>;
}

export class ReviewWithdrawalDto {
    @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
    @IsEnum(['APPROVED', 'REJECTED'])
    status: 'APPROVED' | 'REJECTED';

    @ApiPropertyOptional({ example: 'Account details mismatch' })
    @ValidateIf((o) => o.status === 'REJECTED')
    @IsString()
    reason?: string;
}
