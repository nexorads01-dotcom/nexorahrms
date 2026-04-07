import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RequirePermissions } from '../roles/permissions.decorator';

@ApiTags('Leave')
@ApiBearerAuth()
@Controller('api/v1/leave')
export class LeaveController {
  constructor(private svc: LeaveService) {}

  @Get('types') @RequirePermissions('leaves:view') @ApiOperation({ summary: 'List leave types' })
  getTypes(@CurrentUser('tenantId') tenantId: string) { return this.svc.getLeaveTypes(tenantId); }

  @Post('types') @RequirePermissions('leaves:edit_all') @ApiOperation({ summary: 'Create leave type' })
  createType(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; code: string; color?: string; isPaid?: boolean; annualQuota: number }) {
    return this.svc.createLeaveType(tenantId, body);
  }

  @Post('requests') @RequirePermissions('leaves:create') @ApiOperation({ summary: 'Apply for leave' })
  apply(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string,
    @Body() body: { leaveTypeId: string; startDate: string; endDate: string; reason?: string; isHalfDay?: boolean }) {
    return this.svc.applyLeave(tenantId, employeeId, body);
  }

  @Get('requests') @RequirePermissions('leaves:view') @ApiOperation({ summary: 'List leave requests' })
  getRequests(@CurrentUser() user: any, @Query('status') status?: string, @Query('employeeId') employeeId?: string) {
    return this.svc.getRequests(user, { status, employeeId });
  }

  @Get('requests/pending') @RequirePermissions('leaves:view_all') @ApiOperation({ summary: 'Pending approvals' })
  getPending(@CurrentUser() user: any) { return this.svc.getRequests(user, { status: 'pending' }); }

  @Put('requests/:id/approve') @RequirePermissions('leaves:approve') @ApiOperation({ summary: 'Approve leave' })
  approve(@CurrentUser('tenantId') tenantId: string, @CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.svc.approveLeave(tenantId, id, userId, body?.comment);
  }

  @Put('requests/:id/reject') @RequirePermissions('leaves:approve') @ApiOperation({ summary: 'Reject leave' })
  reject(@CurrentUser('tenantId') tenantId: string, @CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.svc.rejectLeave(tenantId, id, userId, body?.comment);
  }

  @Delete('requests/:id') @RequirePermissions('leaves:delete') @ApiOperation({ summary: 'Cancel own leave request' })
  cancel(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string, @Param('id') id: string) {
    return this.svc.cancelLeave(tenantId, id, employeeId);
  }

  @Get('balance/:employeeId') @RequirePermissions('leaves:view') @ApiOperation({ summary: 'Get leave balance' })
  getBalance(@CurrentUser('tenantId') tenantId: string, @Param('employeeId') employeeId: string) {
    return this.svc.getBalance(tenantId, employeeId);
  }

  @Get('holidays') @RequirePermissions('leaves:view') @ApiOperation({ summary: 'List holidays' })
  getHolidays(@CurrentUser('tenantId') tenantId: string, @Query('year') year?: string) {
    return this.svc.getHolidays(tenantId, year ? parseInt(year) : undefined);
  }

  @Post('holidays') @RequirePermissions('settings:edit_all') @ApiOperation({ summary: 'Add holiday' })
  addHoliday(@CurrentUser('tenantId') tenantId: string, @Body() body: { name: string; date: string; isOptional?: boolean; description?: string }) {
    return this.svc.createHoliday(tenantId, body);
  }
}
