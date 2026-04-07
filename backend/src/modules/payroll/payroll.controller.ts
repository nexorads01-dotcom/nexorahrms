import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RequirePermissions } from '../roles/permissions.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('api/v1/payroll')
export class PayrollController {
  constructor(private svc: PayrollService) {}

  @Get('structures') @RequirePermissions('payroll:view_all') @ApiOperation({ summary: 'List salary structures' })
  getStructures(@CurrentUser('tenantId') tenantId: string) { return this.svc.getStructures(tenantId); }

  @Post('structures') @RequirePermissions('payroll:edit_all') @ApiOperation({ summary: 'Create salary structure' })
  createStructure(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; baseSalary: number; allowances?: string; deductions?: string }) {
    return this.svc.createStructure(tenantId, body);
  }

  @Get('runs') @RequirePermissions('payroll:view_all') @ApiOperation({ summary: 'List payroll runs' })
  getRuns(@CurrentUser('tenantId') tenantId: string) { return this.svc.getRuns(tenantId); }

  @Post('run') @RequirePermissions('payroll:create') @ApiOperation({ summary: 'Run payroll for a month' })
  createRun(@CurrentUser('tenantId') tenantId: string, @CurrentUser('id') userId: string, @Body() body: { month: number; year: number }) {
    return this.svc.createRun(tenantId, body.month, body.year, userId);
  }

  @Get('runs/:id') @RequirePermissions('payroll:view_all') @ApiOperation({ summary: 'Payroll run detail with payslips' })
  getRunDetail(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) { return this.svc.getRunDetail(tenantId, id); }

  @Get('payslips/:id') @RequirePermissions('payroll:view') @ApiOperation({ summary: 'Get payslip detail' })
  getPayslip(@CurrentUser() user: any, @Param('id') id: string) { return this.svc.getPayslip(user, id); }

  @Get('my-payslips') @RequirePermissions('payroll:view') @ApiOperation({ summary: 'Get my payslips' })
  getMyPayslips(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string) {
    return this.svc.getEmployeePayslips(tenantId, employeeId);
  }
}
