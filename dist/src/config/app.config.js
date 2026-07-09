"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000'),
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'access_secret',
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    redisHost: process.env.REDIS_HOST ?? 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT ?? '6379'),
    redisPassword: process.env.REDIS_PASSWORD ?? undefined,
    cronTimezone: process.env.CRON_TIMEZONE ?? 'Asia/Dhaka',
    dailyBenefitCron: process.env.DAILY_BENEFIT_CRON ?? '0 0 * * *',
    qualifyingOrderAmount: parseInt(process.env.QUALIFYING_ORDER_AMOUNT ?? '2000'),
    generationCommissionAmount: parseInt(process.env.GENERATION_COMMISSION_AMOUNT ?? '200'),
    generationCommissionLevels: parseInt(process.env.GENERATION_COMMISSION_LEVELS ?? '10'),
    activationPeriodDays: parseInt(process.env.ACTIVATION_PERIOD_DAYS ?? '30'),
    minWithdrawalAmount: parseInt(process.env.MIN_WITHDRAWAL_AMOUNT ?? '1000'),
    referralBaseUrl: process.env.REFERRAL_BASE_URL ?? 'http://localhost:3000/register',
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
}));
//# sourceMappingURL=app.config.js.map