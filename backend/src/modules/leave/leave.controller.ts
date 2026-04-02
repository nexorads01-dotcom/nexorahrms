import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Leave')
@ApiBearerAuth()
@Controller('api/v1/leave')
export class LeaveController {
  constructor(private svc: LeaveService) {}

  @Get('types') @ApiOperation({ summary: 'List leave types' })
  getTypes(@CurrentUser('tenantId') tenantId: string) { return this.svc.getLeaveTypes(tenantId); }

  @Post('types') @Roles('hr_manager') @ApiOperation({ summary: 'Create leave type' })
  createType(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; code: string; color?: string; isPaid?: boolean; annualQuota: number }) {
    return this.svc.createLeaveType(tenantId, body);
  }

  @Post('requests') @ApiOperation({ summary: 'Apply for leave' })
  apply(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string,
    @Body() body: { leaveTypeId: string; startDate: string; endDate: string; reason?: string; isHalfDay?: boolean }) {
    return this.svc.applyLeave(tenantId, employeeId, body);
  }

  @Get('requests') @ApiOperation({ summary: 'List leave requests' })
  getRequests(@CurrentUser('tenantId') tenantId: string, @Query('status') status?: string, @Query('employeeId') employeeId?: string) {
    return this.svc.getRequests(tenantId, { status, employeeId });
  }

  @Get('requests/pending') @Roles('manager') @ApiOperation({ summary: 'Pending approvals' })
  getPending(@CurrentUser('tenantId') tenantId: string) { return this.svc.getRequests(tenantId, { status: 'pending' }); }

  @Put('requests/:id/approve') @Roles('manager') @ApiOperation({ summary: 'Approve leave' })
  approve(@CurrentUser('tenantId') tenantId: string, @CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.svc.approveLeave(tenantId, id, userId, body?.comment);
  }

  @Put('requests/:id/reject') @Roles('manager') @ApiOperation({ summary: 'Reject leave' })
  reject(@CurrentUser('tenantId') tenantId: string, @CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.svc.rejectLeave(tenantId, id, userId, body?.comment);
  }

  @Delete('requests/:id') @ApiOperation({ summary: 'Cancel own leave request' })
  cancel(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string, @Param('id') id: string) {
    return this.svc.cancelLeave(tenantId, id, employeeId);
  }

  @Get('balance/:employeeId') @ApiOperation({ summary: 'Get leave balance' })
  getBalance(@CurrentUser('tenantId') tenantId: string, @Param('employeeId') employeeId: string) {
    return this.svc.getBalance(tenantId, employeeId);
  }

  @Get('holidays') @ApiOperation({ summary: 'List holidays' })
  getHolidays(@CurrentUser('tenantId') tenantId: string, @Query('year') year?: string) {
    return this.svc.getHolidays(tenantId, year ? parseInt(year) : undefined);
  }

  @Post('holidays') @Roles('hr_manager') @ApiOperation({ summary: 'Add holiday' })
  addHoliday(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; date: string; isOptional?: boolean; description?: string }) {
    return this.svc.createHoliday(tenantId, body);
  }
}
