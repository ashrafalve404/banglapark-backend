import { Module } from '@nestjs/common';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [WalletModule, NotificationsModule],
    controllers: [WithdrawalController],
    providers: [WithdrawalService],
    exports: [WithdrawalService],
})
export class WithdrawalModule { }
