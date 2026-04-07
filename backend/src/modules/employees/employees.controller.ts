import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, EmployeeQueryDto, UpdateEmployeeDto, UpdateEmployeeUserRoleDto, USER_ROLES } from './dto/employee.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RequirePermissions } from '../roles/permissions.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('api/v1/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get('roles')
  @RequirePermissions('roles:view_all')
  @ApiOperation({ summary: 'List allowed user roles inside the current company (tenant)' })
  getAllowedRoles() {
    return { roles: [...USER_ROLES] };
  }

  @Get()
  @RequirePermissions('employees:view')
  @ApiOperation({ summary: 'List all employees (paginated)' })
  findAll(@CurrentUser() user: any, @Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(user, query);
  }

  @Get('stats')
  @RequirePermissions('employees:view')
  @ApiOperation({ summary: 'Get employee statistics' })
  getStats(@CurrentUser('tenantId') tenantId: string) {
    return this.employeesService.getStats(tenantId);
  }

  @Get(':id')
  @RequirePermissions('employees:view')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.employeesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('employees:create')
  @ApiOperation({ summary: 'Create new employee' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('employees:edit_all')
  @ApiOperation({ summary: 'Update employee' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('employees:delete')
  @ApiOperation({ summary: 'Terminate employee (soft delete)' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.employeesService.remove(tenantId, id);
  }

  @Patch(':id/user-role')
  @RequirePermissions('roles:edit')
  @ApiOperation({ summary: 'Assign/Update a user role for an employee account' })
  updateEmployeeUserRole(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeUserRoleDto,
  ) {
    return this.employeesService.updateEmployeeUserRole(tenantId, id, dto);
  }

  @Delete(':id/user-role')
  @RequirePermissions('roles:edit')
  @ApiOperation({ summary: 'Remove access by deactivating an employee user account' })
  deactivateEmployeeUserRole(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.employeesService.deactivateEmployeeUser(tenantId, id);
  }
}
