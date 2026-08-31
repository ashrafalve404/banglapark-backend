import { Module } from '@nestjs/common';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { WalletModule } from '../wallet/wallet.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [WalletModule, NotificationsModule],
    controllers: [DepositController],
    providers: [DepositService],
    exports: [DepositService],
})
export class DepositModule { }
