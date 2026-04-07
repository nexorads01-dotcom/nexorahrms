/**
 * ============================================================
 * Seed Permissions — Inserts all permissions into the DB
 * ============================================================
 * Idempotent: safe to run multiple times.
 * Uses upsert on slug to avoid duplicates.
 */

import { MASTER_PERMISSIONS } from '../constants/permissions.constants';

type PrismaTransactionClient = {
  permission: {
    upsert: (args: any) => Promise<any>;
    count: () => Promise<number>;
  };
};

export async function seedPermissions(prisma: PrismaTransactionClient): Promise<number> {
  let created = 0;
  let updated = 0;

  for (const perm of MASTER_PERMISSIONS) {
    const result = await prisma.permission.upsert({
      where: { slug: perm.slug },
      create: {
        module: perm.module,
        action: perm.action,
        slug: perm.slug,
        description: perm.description,
        category: perm.category,
      },
      update: {
        description: perm.description,
        category: perm.category,
      },
    });

    // If createdAt === updatedAt (just created), otherwise updated
    if (result.createdAt?.getTime() === result.createdAt?.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  const totalCount = await prisma.permission.count();
  console.log(`  📋 Permissions: ${totalCount} total (${MASTER_PERMISSIONS.length} defined)`);
  return totalCount;
}
