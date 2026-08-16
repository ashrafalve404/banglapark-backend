import { Module } from '@nestjs/common';
import { CpaMarketingController } from './cpa-marketing.controller';
import { CpaMarketingService } from './cpa-marketing.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [WalletModule],
    controllers: [CpaMarketingController],
    providers: [CpaMarketingService],
    exports: [CpaMarketingService],
})
export class CpaMarketingModule { }
