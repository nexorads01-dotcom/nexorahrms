/**
 * ============================================================
 * Migrate Existing Tenants to RBAC
 * ============================================================
 * One-time script. For all tenants created before RBAC was added:
 *   1. Seeds permissions (global)
 *   2. Seeds system roles per tenant
 *   3. Maps existing User.role → UserRole records
 *
 * Run: npx ts-node src/modules/roles/seeds/migrate-existing-tenants.ts
 * ============================================================
 */

import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { seedSystemRoles, assignRoleToUser } from './seed-roles';
import { LEGACY_ROLE_MAP } from '../constants/permissions.constants';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

async function migrate() {
  console.log('🔄 Migrating existing tenants to RBAC...\n');

  // 1. Find all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, subdomain: true },
  });

  if (tenants.length === 0) {
    console.log('❌ No tenants found. Nothing to migrate.');
    await prisma.$disconnect();
    return;
  }

  console.log(`📦 Found ${tenants.length} tenant(s)\n`);

  let totalUsersProcessed = 0;
  let totalRolesCreated = 0;
  let totalErrors = 0;

  for (const tenant of tenants) {
    console.log(`\n━━━ Tenant: ${tenant.name} (${tenant.subdomain}) ━━━`);

    try {
      // 2. Check if system roles already exist
      const existingRoles = await prisma.role.count({
        where: { tenantId: tenant.id, isSystem: true },
      });

      if (existingRoles >= 5) {
        console.log(`  ⏭️  System roles already exist (${existingRoles} found)`);
      }

      // 3. Seed system roles (idempotent)
      const roleMap = await seedSystemRoles(prisma as any, tenant.id);
      totalRolesCreated += Object.keys(roleMap).length;

      // 4. Find all users for this tenant
      const users = await prisma.user.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, email: true, role: true },
      });

      console.log(`  👥 ${users.length} user(s) found`);

      for (const user of users) {
        // Check if user already has a role assignment
        const existingAssignment = await prisma.userRole.findFirst({
          where: { userId: user.id },
        });

        if (existingAssignment) {
          console.log(`    ⏭️  ${user.email} — already assigned`);
          continue;
        }

        // Map legacy role to system role
        const systemRoleSlug = LEGACY_ROLE_MAP[user.role] || 'employee';
        const systemRoleId = roleMap[systemRoleSlug];

        if (systemRoleId) {
          await assignRoleToUser(prisma as any, user.id, systemRoleId);
          console.log(`    ✅ ${user.email} → ${systemRoleSlug}`);
          totalUsersProcessed++;
        } else {
          console.warn(`    ⚠️  ${user.email} — no matching role for "${user.role}"`);
          totalErrors++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error migrating tenant ${tenant.name}:`, error);
      totalErrors++;
    }
  }

  // 5. Summary
  console.log('\n\n════════════════════════════════════════');
  console.log('📊 Migration Summary');
  console.log('════════════════════════════════════════');
  console.log(`  Tenants processed:    ${tenants.length}`);
  console.log(`  Users role-assigned:  ${totalUsersProcessed}`);
  console.log(`  Roles created/synced: ${totalRolesCreated}`);
  console.log(`  Permissions in DB:    ${await prisma.permission.count()}`);
  console.log(`  Errors:               ${totalErrors}`);
  console.log('════════════════════════════════════════\n');

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
