import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { TxType } from '@prisma/client';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
}
