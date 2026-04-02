import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('api/v1/departments')
export class DepartmentsController {
  constructor(private svc: DepartmentsService) {}

  @Get() @ApiOperation({ summary: 'List departments' })
  findAll(@CurrentUser('tenantId') tenantId: string) { return this.svc.findAll(tenantId); }

  @Get(':id') @ApiOperation({ summary: 'Get department' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) { return this.svc.findOne(tenantId, id); }

  @Post() @Roles('hr_manager') @ApiOperation({ summary: 'Create department' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; code?: string; description?: string; headId?: string }) { return this.svc.create(tenantId, body); }

  @Put(':id') @Roles('hr_manager') @ApiOperation({ summary: 'Update department' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() body: { name?: string; description?: string; headId?: string }) { return this.svc.update(tenantId, id, body); }

  @Delete(':id') @Roles('company_admin') @ApiOperation({ summary: 'Delete department' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) { return this.svc.remove(tenantId, id); }
}
