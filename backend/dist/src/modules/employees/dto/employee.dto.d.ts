import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    salaryStructureId?: string;
    shiftId?: string;
    dateOfJoining: string;
    employmentType?: string;
    status?: string;
}
export declare class UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    salaryStructureId?: string;
    shiftId?: string;
    status?: string;
    employmentType?: string;
}
export declare class EmployeeQueryDto extends PaginationDto {
    departmentId?: string;
    status?: string;
    employmentType?: string;
}
