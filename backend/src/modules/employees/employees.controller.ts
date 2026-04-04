import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, EmployeeQueryDto, UpdateEmployeeDto, UpdateEmployeeUserRoleDto, USER_ROLES } from './dto/employee.dto';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('api/v1/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get('roles')
  @Roles('hr_manager')
  @ApiOperation({ summary: 'List allowed user roles inside the current company (tenant)' })
  getAllowedRoles() {
    return { roles: [...USER_ROLES] };
  }

  @Get()
  @Roles('employee')
  @ApiOperation({ summary: 'List all employees (paginated)' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('employee')
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

  @Patch(':id/user-role')
  @Roles('hr_manager')
  @ApiOperation({ summary: 'Assign/Update a user role for an employee account' })
  updateEmployeeUserRole(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeUserRoleDto,
  ) {
    return this.employeesService.updateEmployeeUserRole(tenantId, id, dto);
  }

  @Delete(':id/user-role')
  @Roles('hr_manager')
  @ApiOperation({ summary: 'Remove access by deactivating an employee user account' })
  deactivateEmployeeUserRole(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.employeesService.deactivateEmployeeUser(tenantId, id);
  }
}
