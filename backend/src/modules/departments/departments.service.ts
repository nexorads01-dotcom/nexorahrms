import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const depts = await this.prisma.department.findMany({
      where: { tenantId },
      include: { head: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
    return depts.map((d: (typeof depts)[number]) => ({ ...d, employeeCount: d._count.employees }));
  }

  async findOne(tenantId: string, id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: { head: { select: { id: true, firstName: true, lastName: true } }, employees: { select: { id: true, firstName: true, lastName: true, employeeCode: true, status: true } } },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(tenantId: string, data: { name: string; code?: string; description?: string; headId?: string }) {
    const existing = await this.prisma.department.findFirst({ where: { tenantId, name: data.name } });
    if (existing) throw new ConflictException('Department with this name already exists');
    return this.prisma.department.create({ data: { tenantId, ...data } });
  }

  async update(tenantId: string, id: string, data: { name?: string; code?: string; description?: string; headId?: string }) {
    await this.findOne(tenantId, id);
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    const dept = await this.findOne(tenantId, id);
    if ((dept as any).employees?.length > 0) throw new ConflictException('Cannot delete department with employees');
    return this.prisma.department.delete({ where: { id } });
  }
}
