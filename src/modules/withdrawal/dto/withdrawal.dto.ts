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
    @Min(2000)
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
    @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'RETURNED'] })
    @IsEnum(['APPROVED', 'REJECTED', 'RETURNED'])
    status: 'APPROVED' | 'REJECTED' | 'RETURNED';

    @ApiPropertyOptional({ example: 'Account details mismatch or returned to wallet' })
    @ValidateIf((o) => o.status === 'REJECTED' || o.status === 'RETURNED')
    @IsString()
    reason?: string;
}
