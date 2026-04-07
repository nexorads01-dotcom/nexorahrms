"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsAllowAll = process.env.CORS_ALLOW_ALL === 'true';
    const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({
        origin: corsAllowAll ? true : corsOrigins?.length ? corsOrigins : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`\n🚀 Nexora HRMS API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map