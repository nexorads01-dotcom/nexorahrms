import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from './dto/employee.dto';
export declare class EmployeesController {
    private employeesService;
    constructor(employeesService: EmployeesService);
    findAll(tenantId: string, query: EmployeeQueryDto): Promise<{
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        items: ({
            department: {
                name: string;
                id: string;
            } | null;
            designation: {
                name: string;
                id: string;
            } | null;
            reportingManager: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            email: string;
            id: string;
            country: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            dateOfJoining: Date;
            dateOfLeaving: Date | null;
            employmentType: string;
            profilePhotoUrl: string | null;
            emergencyContact: string;
            bankDetails: string;
            customFields: string;
            userId: string | null;
            departmentId: string | null;
            designationId: string | null;
            reportingManagerId: string | null;
            salaryStructureId: string | null;
            shiftId: string | null;
        })[];
    }>;
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        onLeave: number;
        departments: number;
    }>;
    findOne(tenantId: string, id: string): Promise<{
        department: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            isActive: boolean;
            tenantId: string;
            code: string | null;
            headId: string | null;
            parentId: string | null;
        } | null;
        designation: {
            name: string;
            id: string;
            createdAt: Date;
            isActive: boolean;
            tenantId: string;
            level: number;
        } | null;
        shift: {
            name: string;
            id: string;
            createdAt: Date;
            isActive: boolean;
            tenantId: string;
            startTime: string;
            endTime: string;
            graceMinutes: number;
            isDefault: boolean;
        } | null;
        salaryStructure: {
            name: string;
            id: string;
            createdAt: Date;
            isActive: boolean;
            tenantId: string;
            baseSalary: number;
            allowances: string;
            deductions: string;
        } | null;
        reportingManager: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        email: string;
        id: string;
        country: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        dateOfJoining: Date;
        dateOfLeaving: Date | null;
        employmentType: string;
        profilePhotoUrl: string | null;
        emergencyContact: string;
        bankDetails: string;
        customFields: string;
        userId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        salaryStructureId: string | null;
        shiftId: string | null;
    }>;
    create(tenantId: string, dto: CreateEmployeeDto): Promise<{
        department: {
            name: string;
        } | null;
        designation: {
            name: string;
        } | null;
    } & {
        email: string;
        id: string;
        country: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        dateOfJoining: Date;
        dateOfLeaving: Date | null;
        employmentType: string;
        profilePhotoUrl: string | null;
        emergencyContact: string;
        bankDetails: string;
        customFields: string;
        userId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        salaryStructureId: string | null;
        shiftId: string | null;
    }>;
    update(tenantId: string, id: string, dto: UpdateEmployeeDto): Promise<{
        department: {
            name: string;
        } | null;
        designation: {
            name: string;
        } | null;
    } & {
        email: string;
        id: string;
        country: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        dateOfJoining: Date;
        dateOfLeaving: Date | null;
        employmentType: string;
        profilePhotoUrl: string | null;
        emergencyContact: string;
        bankDetails: string;
        customFields: string;
        userId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        salaryStructureId: string | null;
        shiftId: string | null;
    }>;
    remove(tenantId: string, id: string): Promise<{
        email: string;
        id: string;
        country: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        dateOfJoining: Date;
        dateOfLeaving: Date | null;
        employmentType: string;
        profilePhotoUrl: string | null;
        emergencyContact: string;
        bankDetails: string;
        customFields: string;
        userId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        salaryStructureId: string | null;
        shiftId: string | null;
    }>;
}
