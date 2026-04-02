import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('api/v1/payroll')
export class PayrollController {
  constructor(private svc: PayrollService) {}

  @Get('structures') @Roles('hr_manager') @ApiOperation({ summary: 'List salary structures' })
  getStructures(@CurrentUser('tenantId') tenantId: string) { return this.svc.getStructures(tenantId); }

  @Post('structures') @Roles('hr_manager') @ApiOperation({ summary: 'Create salary structure' })
  createStructure(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; baseSalary: number; allowances?: string; deductions?: string }) {
    return this.svc.createStructure(tenantId, body);
  }

  @Get('runs') @Roles('hr_manager') @ApiOperation({ summary: 'List payroll runs' })
  getRuns(@CurrentUser('tenantId') tenantId: string) { return this.svc.getRuns(tenantId); }

  @Post('run') @Roles('hr_manager') @ApiOperation({ summary: 'Run payroll for a month' })
  createRun(@CurrentUser('tenantId') tenantId: string, @CurrentUser('id') userId: string, @Body() body: { month: number; year: number }) {
    return this.svc.createRun(tenantId, body.month, body.year, userId);
  }

  @Get('runs/:id') @Roles('hr_manager') @ApiOperation({ summary: 'Payroll run detail with payslips' })
  getRunDetail(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) { return this.svc.getRunDetail(tenantId, id); }

  @Get('payslips/:id') @ApiOperation({ summary: 'Get payslip detail' })
  getPayslip(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) { return this.svc.getPayslip(tenantId, id); }

  @Get('my-payslips') @ApiOperation({ summary: 'Get my payslips' })
  getMyPayslips(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string) {
    return this.svc.getEmployeePayslips(tenantId, employeeId);
  }
}
