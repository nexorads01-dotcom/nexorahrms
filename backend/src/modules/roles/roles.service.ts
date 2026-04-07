import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from './permissions.service';

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: { slug: string; dataScope?: string }[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: { slug: string; dataScope?: string }[];
  isActive?: boolean;
}

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService
  ) {}

  /**
   * Retrieves all roles for a tenant along with a count of assigned users
   */
  async findAll(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    });
    return roles;
  }

  async findOne(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(tenantId: string, actorId: string, data: CreateRoleDto) {
    // Generate a slug from the name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    // Check if slug exists
    const existing = await this.prisma.role.findUnique({
      where: { tenantId_slug: { tenantId, slug } }
    });
    
    if (existing) {
      throw new BadRequestException('A role with a similar name already exists');
    }

    // Create role recursively with permissions
    const permissionLookups = await this.prisma.permission.findMany({
      where: { slug: { in: data.permissions.map(p => p.slug) } }
    });

    const rpData = data.permissions.map(p => {
      const permItem = permissionLookups.find(lookup => lookup.slug === p.slug);
      if (!permItem) throw new BadRequestException(`Invalid permission slug: ${p.slug}`);
      return {
        permissionId: permItem.id,
        dataScope: p.dataScope || 'self',
      }
    });

    const result = await this.prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        description: data.description,
        isSystem: false,
        isActive: true,
        rolePermissions: {
          create: rpData
        }
      }
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorId,
        action: 'CREATE',
        entityType: 'Role',
        entityId: result.id,
        newValues: JSON.stringify(data),
      }
    });

    return result;
  }

  async update(tenantId: string, actorId: string, roleId: string, data: UpdateRoleDto) {
    const role = await this.findOne(tenantId, roleId);
    
    // Check constraints on system roles
    if (role.isSystem) {
      if (data.name && data.name !== role.name) {
        throw new ForbiddenException('Cannot change the name of a system role');
      }
      if (data.permissions) {
        throw new ForbiddenException('Cannot modify permissions of a system role directly (assign additional custom roles instead)');
      }
      if (data.isActive !== undefined && data.isActive === false) {
        throw new ForbiddenException('Cannot deactivate a system role');
      }
    }

    const txs: any[] = [];
    
    // Update basic info
    txs.push(
      this.prisma.role.update({
        where: { id: roleId },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive
        }
      })
    );

    // If permissions array is provided, fully replace the existing ones
    if (data.permissions && !role.isSystem) {
      txs.push(
        this.prisma.rolePermission.deleteMany({
          where: { roleId }
        })
      );

      const permissionLookups = await this.prisma.permission.findMany({
        where: { slug: { in: data.permissions.map(p => p.slug) } }
      });

      const createManyData = data.permissions.map(p => {
        const permItem = permissionLookups.find(lookup => lookup.slug === p.slug);
        return {
          roleId,
          permissionId: permItem!.id,
          dataScope: p.dataScope || 'self'
        };
      });

      if (createManyData.length > 0) {
        txs.push(
          this.prisma.rolePermission.createMany({
            data: createManyData
          })
        );
      }
    }

    await this.prisma.$transaction(txs);

    // Invalidate cache for everyone who has this role
    const usersWithRole = await this.prisma.userRole.findMany({ where: { roleId } });
    for (const ur of usersWithRole) {
      this.permissionsService.invalidateCache(ur.userId);
    }

    const updatedRole = await this.findOne(tenantId, roleId);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorId,
        action: 'UPDATE',
        entityType: 'Role',
        entityId: roleId,
        oldValues: JSON.stringify(role),
        newValues: JSON.stringify(data),
      }
    });

    return updatedRole;
  }

  async delete(tenantId: string, actorId: string, roleId: string) {
    const role = await this.findOne(tenantId, roleId);
    
    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete a system role');
    }

    const assignedCount = await this.prisma.userRole.count({ where: { roleId } });
    if (assignedCount > 0) {
      throw new BadRequestException(`Cannot delete role because it is still assigned to ${assignedCount} users`);
    }

    await this.prisma.role.delete({ where: { id: roleId } });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorId,
        action: 'DELETE',
        entityType: 'Role',
        entityId: roleId,
        oldValues: JSON.stringify(role),
      }
    });
  }

  // ===== User Role Assignments ===== //

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    });
  }

  async assignRole(actorId: string, tenantId: string, userId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const result = await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {}
    });

    this.permissionsService.invalidateCache(userId);
    this.permissionsService.invalidateCache(userId);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorId,
        action: 'CREATE',
        entityType: 'UserRole',
        entityId: `${userId}_${roleId}`,
      }
    });

    return result;
  }

  async removeRole(actorId: string, tenantId: string, userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId }
    });

    this.permissionsService.invalidateCache(userId);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorId,
        action: 'DELETE',
        entityType: 'UserRole',
        entityId: `${userId}_${roleId}`,
      }
    });
  }
}
