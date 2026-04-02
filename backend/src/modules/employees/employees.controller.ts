import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from './dto/employee.dto';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('api/v1/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  @Roles('hr_manager')
  @ApiOperation({ summary: 'List all employees (paginated)' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('hr_manager')
  @ApiOperation({ summary: 'Get employee statistics' })
  getStats(@CurrentUser('tenantId') tenantId: string) {
    return this.employeesService.getStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.employeesService.findOne(tenantId, id);
  }

  @Post()
  @Roles('hr_manager')
  @ApiOperation({ summary: 'Create new employee' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles('hr_manager')
  @ApiOperation({ summary: 'Update employee' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('company_admin')
  @ApiOperation({ summary: 'Terminate employee (soft delete)' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.employeesService.remove(tenantId, id);
  }
}
