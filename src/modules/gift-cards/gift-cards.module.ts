import { Module } from '@nestjs/common';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [WalletModule, NotificationsModule],
    controllers: [GiftCardsController],
    providers: [GiftCardsService],
    exports: [GiftCardsService],
})
export class GiftCardsModule { }
