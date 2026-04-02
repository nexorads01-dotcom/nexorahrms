import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators';

@Controller()
export class AppController {
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
}
