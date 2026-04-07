import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: Docker / LAN browsers send Origin http://<host>:3001 — not only localhost.
  const corsAllowAll = process.env.CORS_ALLOW_ALL === 'true';
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: corsAllowAll ? true : corsOrigins?.length ? corsOrigins : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nexora HRMS API')
    .setDescription('API documentation for Nexora HRMS — The HR Platform That Grows With You')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & authorization')
    .addTag('Employees', 'Employee management')
    .addTag('Departments', 'Department management')
    .addTag('Attendance', 'Attendance tracking')
    .addTag('Leave', 'Leave management')
    .addTag('Payroll', 'Payroll & payslips')
    .addTag('Notifications', 'Notification center')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀 Nexora HRMS API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs\n`);
}
bootstrap();
