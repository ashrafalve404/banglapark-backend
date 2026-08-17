import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGiftCardDto {
    @ApiProperty({ example: '2000 TK Shopping Voucher' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Get 2000 TK worth of products + 30 Days Account Activation!' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 2000 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48' })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiPropertyOptional({ example: 'GIFT-2000-VIP-889' })
    @IsOptional()
    @IsString()
    voucherCode?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateGiftCardDto {
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
    image?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    voucherCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class BuyGiftCardDto {
    @ApiPropertyOptional({ example: 'WALLET', enum: ['WALLET', 'BKASH'] })
    @IsOptional()
    @IsString()
    paymentMethod?: 'WALLET' | 'BKASH';

    @ApiPropertyOptional({ example: '01823674796' })
    @IsOptional()
    @IsString()
    userBkashNumber?: string;

    @ApiPropertyOptional({ example: 'TRX99887766' })
    @IsOptional()
    @IsString()
    bkashTrxId?: string;
}
