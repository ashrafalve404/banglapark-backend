import { Module } from '@nestjs/common';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [WalletModule],
    controllers: [PositionController],
    providers: [PositionService],
    exports: [PositionService],
})
export class PositionModule { }
