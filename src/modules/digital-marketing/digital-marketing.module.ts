import { Module } from '@nestjs/common';
import { DigitalMarketingController } from './digital-marketing.controller';
import { DigitalMarketingService } from './digital-marketing.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [WalletModule, NotificationsModule],
    controllers: [DigitalMarketingController],
    providers: [DigitalMarketingService],
    exports: [DigitalMarketingService],
})
export class DigitalMarketingModule { }
