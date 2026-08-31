import { Controller, Get, Post, UseGuards, Query, Body } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiBody,
} from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { TxType } from '@prisma/client';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class TransferDto {
    @IsString()
    recipientPhone: string;

    @IsNumber()
    @Min(10)
    amount: number;
}

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('balance')
    @ApiOperation({ summary: 'Get my wallet balance' })
    getBalance(@CurrentUser('id') userId: string) {
        return this.walletService.getBalance(userId);
    }

    @Get('transactions')
    @ApiOperation({ summary: 'Get my wallet transaction history (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'type', required: false, enum: TxType })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    getTransactions(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('type') type?: TxType,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.walletService.getTransactions(
            userId,
            +page,
            +limit,
            type,
            from ? new Date(from) : undefined,
            to ? new Date(to) : undefined,
        );
    }

    @Get('lookup')
    @ApiOperation({ summary: 'Look up a user by phone number before transfer' })
    @ApiQuery({ name: 'phone', required: true, type: String })
    lookupRecipient(@Query('phone') phone: string) {
        return this.walletService.lookupRecipient(phone);
    }

    @Post('transfer')
    @ApiOperation({ summary: 'Transfer balance to another user by phone number' })
    @ApiBody({ type: TransferDto })
    transfer(
        @CurrentUser('id') userId: string,
        @Body() body: TransferDto,
    ) {
        return this.walletService.transfer(userId, body.recipientPhone, Number(body.amount));
    }
}
