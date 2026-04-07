import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto, UpdateEmployeeUserRoleDto } from './dto/employee.dto';
import { buildScopeFilter } from '../roles/data-scope.util';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, query: EmployeeQueryDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, departmentId, status, employmentType } = query;
    const skip = (page - 1) * limit;

    const scope = user.dataScopes?.['employees'] || 'self';
    const baseWhere = buildScopeFilter(scope, user, { employeeField: 'id' });

    const where: any = { ...baseWhere, tenantId: user.tenantId };
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeCode: { contains: search } },
      ];
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
          reportingManager: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { role: true, isActive: true } },
        },
      }),
      this.prisma.employee.count({ where: where as any }),
    ]);

    return {
      ...{ items: employees },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        designation: true,
        reportingManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        shift: true,
        salaryStructure: true,
        user: { select: { role: true, isActive: true } },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployeeUserRole(tenantId: string, employeeId: string, dto: UpdateEmployeeUserRoleDto) {
    const defaultPassword = 'NewPassword123!';
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: { user: true },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    // If employee doesn't have an account yet, create it now.
    if (!employee.user) {
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      const user = await this.prisma.user.create({
        data: {
          tenantId,
          email: employee.email,
          passwordHash,
          role: dto.role,
          isActive: dto.isActive ?? true,
          isVerified: dto.isVerified ?? true,
        },
      });

      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });

      return { message: 'User account created and role assigned', userId: user.id };
    }

    const updateData: any = {
      role: dto.role,
      isActive: dto.isActive ?? true,
    };

    if (dto.isVerified !== undefined) updateData.isVerified = dto.isVerified;

    if (dto.resetPassword) {
      updateData.passwordHash = await bcrypt.hash(defaultPassword, 12);
    }

    // Sanity: user belongs to the same tenant.
    if (employee.user.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to the current tenant');
    }

    const updated = await this.prisma.user.update({
      where: { id: employee.user.id },
      data: updateData,
      select: { id: true, email: true, role: true, isActive: true },
    });

    return { message: 'User role updated', user: updated };
  }

  async deactivateEmployeeUser(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: { user: true },
    });

    if (!employee) throw new NotFoundException('Employee not found');
    if (!employee.user) throw new NotFoundException('Employee user account not found');

    if (employee.user.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to the current tenant');
    }

    const updated = await this.prisma.user.update({
      where: { id: employee.user.id },
      data: { isActive: false },
      select: { id: true, email: true, role: true, isActive: true },
    });

    return { message: 'User deactivated', user: updated };
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    // Check for duplicate email
    const existing = await this.prisma.employee.findFirst({ where: { tenantId, email: dto.email } });
    if (existing) throw new ConflictException('Employee with this email already exists');

    // Auto-generate employee code
    const lastEmployee = await this.prisma.employee.findFirst({
      where: { tenantId },
      orderBy: { employeeCode: 'desc' },
    });
    let nextCode = 1;
    if (lastEmployee) {
      const num = parseInt(lastEmployee.employeeCode.replace('NEX-', ''), 10);
      nextCode = (isNaN(num) ? 0 : num) + 1;
    }
    const employeeCode = `NEX-${nextCode.toString().padStart(4, '0')}`;

    const defaultPassword = 'NewPassword123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    return this.prisma.employee.create({
      data: {
        tenant: { connect: { id: tenantId } },
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        zipCode: dto.zipCode,
        department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
        designation: dto.designationId ? { connect: { id: dto.designationId } } : undefined,
        reportingManager: dto.reportingManagerId ? { connect: { id: dto.reportingManagerId } } : undefined,
        salaryStructure: dto.salaryStructureId ? { connect: { id: dto.salaryStructureId } } : undefined,
        shift: dto.shiftId ? { connect: { id: dto.shiftId } } : undefined,
        dateOfJoining: new Date(dto.dateOfJoining),
        employmentType: dto.employmentType || 'full_time',
        status: dto.status || 'active',
        user: {
          create: {
            tenant: { connect: { id: tenantId } },
            email: dto.email,
            passwordHash,
            role: 'employee',
            isActive: true,
            isVerified: true,
          },
        },
      },
      include: { department: { select: { name: true } }, designation: { select: { name: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(tenantId, id);
    return this.prisma.employee.update({
      where: { id },
      data: dto as any,
      include: { department: { select: { name: true } }, designation: { select: { name: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.employee.update({ where: { id }, data: { status: 'terminated', dateOfLeaving: new Date() } });
  }

  async getStats(tenantId: string) {
    const [total, active, onLeave, departments] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.employee.count({ where: { tenantId, status: 'active' } }),
      this.prisma.employee.count({ where: { tenantId, status: 'on_leave' } }),
      this.prisma.department.count({ where: { tenantId } }),
    ]);
    return { total, active, onLeave, departments };
  }
}
