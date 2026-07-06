import { IsArray, IsString, IsInt, IsOptional, Min, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod, DeliveryArea } from '@prisma/client';

export class OrderItemDto {
    @ApiProperty() @IsString() productId: string;
    @ApiProperty() @IsInt() @Min(1) @Type(() => Number) quantity: number;
    @ApiPropertyOptional() @IsOptional() @IsString() size?: string;
}

export class CreateOrderDto {
    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiPropertyOptional() @IsOptional() shippingAddress?: Record<string, string>;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

    @ApiPropertyOptional({ enum: PaymentMethod, default: 'CASH_ON_DELIVERY' })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    transactionId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    userBkashNumber?: string;

    @ApiPropertyOptional({ enum: DeliveryArea })
    @IsOptional()
    @IsEnum(DeliveryArea)
    deliveryArea?: DeliveryArea;
}

export class UpdateOrderStatusDto {
    @ApiProperty({ enum: OrderStatus })
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
