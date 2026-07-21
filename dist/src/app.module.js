"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const app_config_1 = require("./config/app.config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const referral_module_1 = require("./modules/referral/referral.module");
const products_module_1 = require("./modules/products/products.module");
const categories_module_1 = require("./modules/categories/categories.module");
const orders_module_1 = require("./modules/orders/orders.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const commission_module_1 = require("./modules/commission/commission.module");
const daily_benefit_module_1 = require("./modules/daily-benefit/daily-benefit.module");
const withdrawal_module_1 = require("./modules/withdrawal/withdrawal.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const admin_module_1 = require("./modules/admin/admin.module");
const reports_module_1 = require("./modules/reports/reports.module");
const banners_module_1 = require("./modules/banners/banners.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const quiz_module_1 = require("./modules/quiz/quiz.module");
const quiz_category_module_1 = require("./modules/quiz-category/quiz-category.module");
const quiz_level_module_1 = require("./modules/quiz-level/quiz-level.module");
const position_module_1 = require("./modules/position/position.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.appConfig],
                validate: (config) => config,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: process.env.NODE_ENV === 'development'
                        ? { target: 'pino-pretty', options: { singleLine: true } }
                        : undefined,
                    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
                    autoLogging: { ignore: (req) => req.url === '/health' },
                    customProps: () => ({ context: 'HTTP' }),
                    genReqId: () => require('crypto').randomUUID(),
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'default',
                    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000'),
                    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100'),
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: process.env.REDIS_HOST ?? 'localhost',
                    port: parseInt(process.env.REDIS_PORT ?? '6379'),
                    password: process.env.REDIS_PASSWORD || undefined,
                    maxRetriesPerRequest: null,
                    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
                },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            referral_module_1.ReferralModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            orders_module_1.OrdersModule,
            wallet_module_1.WalletModule,
            commission_module_1.CommissionModule,
            daily_benefit_module_1.DailyBenefitModule,
            withdrawal_module_1.WithdrawalModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
            reports_module_1.ReportsModule,
            banners_module_1.BannersModule,
            uploads_module_1.UploadsModule,
            quiz_module_1.QuizModule,
            quiz_category_module_1.QuizCategoryModule,
            quiz_level_module_1.QuizLevelModule,
            position_module_1.PositionModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map