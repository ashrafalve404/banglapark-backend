import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DailyBenefitController } from './daily-benefit.controller';
import { DailyBenefitService, DAILY_BENEFIT_QUEUE } from './daily-benefit.service';
import { DailyBenefitProcessor } from './daily-benefit.processor';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        BullModule.registerQueue({ name: DAILY_BENEFIT_QUEUE }),
        WalletModule,
    ],
    controllers: [DailyBenefitController],
    providers: [DailyBenefitService, DailyBenefitProcessor],
    exports: [DailyBenefitService],
})
export class DailyBenefitModule { }
