import { Controller, Post, Get, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('api/v1/attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Post('check-in') @ApiOperation({ summary: 'Clock in' })
  checkIn(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string, @Req() req: any) {
    return this.svc.checkIn(tenantId, employeeId, req.ip);
  }

  @Post('check-out') @ApiOperation({ summary: 'Clock out' })
  checkOut(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string) {
    return this.svc.checkOut(tenantId, employeeId);
  }

  @Get('today') @Roles('hr_manager') @ApiOperation({ summary: 'Today\'s attendance report' })
  getToday(@CurrentUser('tenantId') tenantId: string) { return this.svc.getToday(tenantId); }

  @Get('my') @ApiOperation({ summary: 'My attendance history' })
  getMyAttendance(@CurrentUser('tenantId') tenantId: string, @CurrentUser('employeeId') employeeId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getEmployeeAttendance(tenantId, employeeId, from, to);
  }

  @Get('report') @Roles('hr_manager') @ApiOperation({ summary: 'Attendance report for a date' })
  getReport(@CurrentUser('tenantId') tenantId: string, @Query('date') date: string) { return this.svc.getReport(tenantId, date); }
}
