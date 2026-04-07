import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  root() {
    return {
      name: 'Nexora HRMS API',
      swagger: '/api/docs',
      apiPrefix: '/api/v1',
    };
  }

  @Public()
  @Get('api')
  apiInfo() {
    return {
      message: 'Nexora HRMS API',
      swaggerUi: '/api/docs',
      openApiJson: '/api/docs-json',
      restBase: '/api/v1',
    };
  }

  @Public()
  @Get('api/health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('api/ready')
  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
