// Main application module root definition
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

import { appConfig } from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CommissionModule } from './modules/commission/commission.module';
import { DailyBenefitModule } from './modules/daily-benefit/daily-benefit.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BannersModule } from './modules/banners/banners.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { QuizCategoryModule } from './modules/quiz-category/quiz-category.module';
import { QuizLevelModule } from './modules/quiz-level/quiz-level.module';
import { PositionModule } from './modules/position/position.module';
import { TravelModule } from './modules/travel/travel.module';


@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: (config) => config,
    }),

    // ── Logging ───────────────────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
        autoLogging: { ignore: (req) => req.url === '/health' },
        customProps: () => ({ context: 'HTTP' }),
        genReqId: () => require('crypto').randomUUID(),
      },
    }),

    // ── Rate Limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100'),
      },
    ]),

    // ── Scheduling ────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── BullMQ ────────────────────────────────────────────────────────────
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      },
    }),

    // ── Database ──────────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ───────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    ReferralModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    WalletModule,
    CommissionModule,
    DailyBenefitModule,
    WithdrawalModule,
    NotificationsModule,
    AdminModule,
    ReportsModule,
    BannersModule,
    UploadsModule,
    QuizModule,
    QuizCategoryModule,
    QuizLevelModule,
    PositionModule,
    TravelModule,

  ],
})
export class AppModule { }
