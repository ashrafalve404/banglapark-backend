import { Module } from '@nestjs/common';
import { UserProductsController } from './user-products.controller';
import { UserProductsService } from './user-products.service';

@Module({
    controllers: [UserProductsController],
    providers: [UserProductsService],
    exports: [UserProductsService],
})
export class UserProductsModule { }
