import { Controller, Post, Get, Query, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { RequirePermissions } from '../roles/permissions.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('api/v1/attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Post('check-in') @RequirePermissions('attendance:create') @ApiOperation({ summary: 'Clock in' })
  checkIn(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string, @Req() req: any) {
    return this.svc.checkIn(tenantId, employeeId, req.ip);
  }

  @Post('check-out') @RequirePermissions('attendance:create') @ApiOperation({ summary: 'Clock out' })
  checkOut(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string) {
    return this.svc.checkOut(tenantId, employeeId);
  }

  /** Employees have `attendance:view` (self); HR has `attendance:view_all`. Either may call today (scoped in service). */
  @Get('today') @RequirePermissions('attendance:view_all', 'attendance:view') @ApiOperation({ summary: 'Today\'s attendance report' })
  getToday(@CurrentUser() user: any) { return this.svc.getToday(user); }

  @Get('my') @RequirePermissions('attendance:view') @ApiOperation({ summary: 'My attendance history' })
  getMyAttendance(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getEmployeeAttendance(tenantId, employeeId, from, to);
  }

  // ======== DATE-RANGE REPORT (must be before @Get('report') to avoid route conflict) ========

  @Get('report/range')
  @RequirePermissions('attendance:view_all')
  @ApiOperation({ summary: 'Attendance report for a date range with filters' })
  getDateRangeReport(
    @CurrentUser() user: any,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getDateRangeReport(user, from, to, { departmentId, employeeId, status });
  }

  @Get('report/range/csv')
  @RequirePermissions('attendance:export')
  @ApiOperation({ summary: 'Export date-range attendance report as CSV' })
  async getDateRangeReportCsv(
    @CurrentUser() user: any,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Res() res?: any,
  ) {
    const csv = await this.svc.getDateRangeReportCsv(user, from, to, { departmentId, employeeId, status });
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', `attachment; filename="attendance_report_${from}_to_${to}.csv"`);
    res!.send(csv);
  }

  // ======== SINGLE-DATE REPORT ========

  @Get('report') @RequirePermissions('attendance:view_all') @ApiOperation({ summary: 'Attendance report for a date' })
  getReport(@CurrentUser() user: any, @Query('date') date: string) { return this.svc.getReport(user, date); }
}

