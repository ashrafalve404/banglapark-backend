import { Module } from '@nestjs/common';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [WalletModule],
    controllers: [WithdrawalController],
    providers: [WithdrawalService],
    exports: [WithdrawalService],
})
export class WithdrawalModule { }
