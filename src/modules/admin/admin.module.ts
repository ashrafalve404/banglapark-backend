import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PublicStatsController } from './public-stats.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [AdminController, PublicStatsController],
    providers: [AdminService],
})
export class AdminModule { }
