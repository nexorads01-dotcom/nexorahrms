"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const seed_roles_1 = require("./seed-roles");
const permissions_constants_1 = require("../constants/permissions.constants");
const connectionString = process.env.DATABASE_URL;
if (!connectionString)
    throw new Error('DATABASE_URL not set');
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
async function migrate() {
    console.log('🔄 Migrating existing tenants to RBAC...\n');
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
            const existingRoles = await prisma.role.count({
                where: { tenantId: tenant.id, isSystem: true },
            });
            if (existingRoles >= 5) {
                console.log(`  ⏭️  System roles already exist (${existingRoles} found)`);
            }
            const roleMap = await (0, seed_roles_1.seedSystemRoles)(prisma, tenant.id);
            totalRolesCreated += Object.keys(roleMap).length;
            const users = await prisma.user.findMany({
                where: { tenantId: tenant.id },
                select: { id: true, email: true, role: true },
            });
            console.log(`  👥 ${users.length} user(s) found`);
            for (const user of users) {
                const existingAssignment = await prisma.userRole.findFirst({
                    where: { userId: user.id },
                });
                if (existingAssignment) {
                    console.log(`    ⏭️  ${user.email} — already assigned`);
                    continue;
                }
                const systemRoleSlug = permissions_constants_1.LEGACY_ROLE_MAP[user.role] || 'employee';
                const systemRoleId = roleMap[systemRoleSlug];
                if (systemRoleId) {
                    await (0, seed_roles_1.assignRoleToUser)(prisma, user.id, systemRoleId);
                    console.log(`    ✅ ${user.email} → ${systemRoleSlug}`);
                    totalUsersProcessed++;
                }
                else {
                    console.warn(`    ⚠️  ${user.email} — no matching role for "${user.role}"`);
                    totalErrors++;
                }
            }
        }
        catch (error) {
            console.error(`  ❌ Error migrating tenant ${tenant.name}:`, error);
            totalErrors++;
        }
    }
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
//# sourceMappingURL=migrate-existing-tenants.js.map