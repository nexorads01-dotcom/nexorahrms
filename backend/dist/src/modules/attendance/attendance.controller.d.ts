import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private svc;
    constructor(svc: AttendanceService);
    checkIn(tenantId: string, employeeId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }>;
    checkOut(tenantId: string, employeeId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }>;
    getToday(user: any): Promise<{
        records: any[];
        stats: {
            totalEmployees: number;
            present: number;
            late: number;
            absent: number;
            onLeave: number;
        };
    }>;
    getMyAttendance(tenantId: string, employeeId: string, from?: string, to?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }[]>;
    getDateRangeReport(user: any, from: string, to: string, departmentId?: string, employeeId?: string, status?: string): Promise<{
        records: never[];
        summary: never[];
        stats: {
            totalRecords: number;
            totalPresent: number;
            totalLate: number;
            totalAbsent: number;
            avgHours: number;
            workingDays?: undefined;
            uniqueEmployees?: undefined;
        };
    } | {
        records: {
            id: string;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            hoursWorked: number | null;
            status: string;
            source: string;
            employeeId: string;
            employeeName: string;
            employeeCode: any;
            department: any;
        }[];
        summary: {
            employeeId: string;
            employeeName: string;
            employeeCode: string;
            department: string;
            totalDays: number;
            presentDays: number;
            lateDays: number;
            absentDays: number;
            totalHours: number;
            avgHoursPerDay: number;
            avgCheckIn: string;
            punctuality: number;
        }[];
        stats: {
            totalRecords: number;
            totalPresent: number;
            totalLate: number;
            totalAbsent: number;
            avgHours: number;
            workingDays: number;
            uniqueEmployees: number;
        };
    }>;
    getDateRangeReportCsv(user: any, from: string, to: string, departmentId?: string, employeeId?: string, status?: string, res?: any): Promise<void>;
    getReport(user: any, date: string): Promise<({
        employee: {
            department: {
                name: string;
            } | null;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    })[]>;
}
