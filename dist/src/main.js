"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const path_1 = require("path");
const fs_1 = require("fs");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const uploadDir = process.env.UPLOAD_DIR || (0, path_1.join)(process.cwd(), 'uploads');
    if (!(0, fs_1.existsSync)(uploadDir))
        (0, fs_1.mkdirSync)(uploadDir, { recursive: true });
    app.useStaticAssets(uploadDir, { prefix: '/uploads/' });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors();
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Bangla Park API')
        .setDescription('MLM e-commerce platform — full REST API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth', 'Authentication & token management')
        .addTag('Users', 'User profile & activation')
        .addTag('Referral', 'Referral codes & team stats')
        .addTag('Products', 'Product catalog')
        .addTag('Categories', 'Product categories')
        .addTag('Orders', 'Order lifecycle')
        .addTag('Wallet', 'Wallet balance & transactions')
        .addTag('Commission', 'Generation commission reports')
        .addTag('Daily Benefit', 'Daily benefit logs & rules')
        .addTag('Withdrawal', 'Withdrawal requests')
        .addTag('Admin', 'Admin management & stats')
        .addTag('Notifications', 'In-app notifications')
        .addTag('Reports', 'Platform reports & exports')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Bangla Park API is running on: http://localhost:${port}`);
    console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map