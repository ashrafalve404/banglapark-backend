import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CommissionModule } from '../commission/commission.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [CommissionModule, WalletModule],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
