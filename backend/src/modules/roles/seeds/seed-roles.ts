/**
 * ============================================================
 * Seed System Roles — Creates 5 default roles for a tenant
 * ============================================================
 * Called by:
 *   - Registration flow (new tenant)
 *   - Migration script (existing tenants)
 *   - Seed script (demo data)
 *
 * Idempotent: uses upsert on (tenantId, slug).
 */

import { SYSTEM_ROLES, MASTER_PERMISSIONS } from '../constants/permissions.constants';
import { seedPermissions } from './seed-permissions';

type PrismaTransactionClient = {
  permission: {
    upsert: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    count: () => Promise<number>;
  };
  role: {
    upsert: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
  };
  rolePermission: {
    upsert: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
  };
  userRole: {
    upsert: (args: any) => Promise<any>;
  };
};

/**
 * Seeds all system roles and their permission mappings for a tenant.
 * Returns a map of { roleSlug → roleId } for downstream use.
 */
export async function seedSystemRoles(
  prisma: PrismaTransactionClient,
  tenantId: string,
): Promise<Record<string, string>> {
  // 1. Ensure all permissions exist in DB
  await seedPermissions(prisma);

  // 2. Load all permissions from DB for lookup
  const permMap = new Map<string, string>();
  for (const pDef of MASTER_PERMISSIONS) {
    const perm = await prisma.permission.findUnique({ where: { slug: pDef.slug } });
    if (perm) {
      permMap.set(pDef.slug, perm.id);
    }
  }

  // 3. Create system roles and their permission mappings
  const roleMap: Record<string, string> = {};

  for (const roleDef of SYSTEM_ROLES) {
    // Upsert the role
    const role = await prisma.role.upsert({
      where: {
        tenantId_slug: { tenantId, slug: roleDef.slug },
      },
      create: {
        tenantId,
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: true,
        isActive: true,
        level: roleDef.level,
      },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        level: roleDef.level,
      },
    });

    roleMap[roleDef.slug] = role.id;

    // Clear existing role permissions for this system role (to re-sync)
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Create role-permission mappings in batch
    const rpData: Array<{
      roleId: string;
      permissionId: string;
      dataScope: string;
    }> = [];

    for (const permDef of roleDef.permissions) {
      const permId = permMap.get(permDef.slug);
      if (permId) {
        rpData.push({
          roleId: role.id,
          permissionId: permId,
          dataScope: permDef.dataScope,
        });
      } else {
        console.warn(`  ⚠️  Permission "${permDef.slug}" not found in DB — skipped for role "${roleDef.name}"`);
      }
    }

    if (rpData.length > 0) {
      await prisma.rolePermission.createMany({ data: rpData });
    }

    console.log(`  🔑 Role "${roleDef.name}" (${roleDef.slug}): ${rpData.length} permissions`);
  }

  return roleMap;
}

/**
 * Assigns a role to a user. Idempotent (upsert).
 */
export async function assignRoleToUser(
  prisma: PrismaTransactionClient,
  userId: string,
  roleId: string,
): Promise<void> {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId, roleId },
    },
    create: { userId, roleId },
    update: {},
  });
}
