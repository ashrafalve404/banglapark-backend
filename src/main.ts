import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // ── Ensure upload directory exists ─────────────────────────────────────
  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  // ── Static file serving ────────────────────────────────────────────────
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  // ── Structured logging ────────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── Global validation ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  const devOrigin = process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [];
  app.enableCors({
    origin: ['https://www.banglapark.com', 'https://banglapark.vercel.app', 'https://api.banglapark.com', ...devOrigin],
  });

  // ── API versioning ────────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Swagger ───────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Bangla Park API is running on: http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
