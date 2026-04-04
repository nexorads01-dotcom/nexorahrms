import { IsBoolean, IsDateString, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const USER_ROLES = ['super_admin', 'company_admin', 'hr_manager', 'manager', 'employee'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export class CreateEmployeeDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zipCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() designationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() salaryStructureId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shiftId?: string;
  @ApiProperty() @IsDateString() dateOfJoining: string;
  @ApiPropertyOptional({ default: 'full_time' }) @IsOptional() @IsString() employmentType?: string;
  @ApiPropertyOptional({ default: 'active' }) @IsOptional() @IsString() status?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() designationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() salaryStructureId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shiftId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
}

export class EmployeeQueryDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
}

export class UpdateEmployeeUserRoleDto {
  @ApiProperty({ example: 'manager', description: 'User role inside the current company (tenant)' })
  @IsIn(USER_ROLES as unknown as string[])
  role: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ example: false, description: 'If true, sets password to default "NewPassword123!"' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  resetPassword?: boolean;
}
