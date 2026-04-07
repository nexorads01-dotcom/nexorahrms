"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSystemRoles = seedSystemRoles;
exports.assignRoleToUser = assignRoleToUser;
const permissions_constants_1 = require("../constants/permissions.constants");
const seed_permissions_1 = require("./seed-permissions");
async function seedSystemRoles(prisma, tenantId) {
    await (0, seed_permissions_1.seedPermissions)(prisma);
    const permMap = new Map();
    for (const pDef of permissions_constants_1.MASTER_PERMISSIONS) {
        const perm = await prisma.permission.findUnique({ where: { slug: pDef.slug } });
        if (perm) {
            permMap.set(pDef.slug, perm.id);
        }
    }
    const roleMap = {};
    for (const roleDef of permissions_constants_1.SYSTEM_ROLES) {
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
        await prisma.rolePermission.deleteMany({
            where: { roleId: role.id },
        });
        const rpData = [];
        for (const permDef of roleDef.permissions) {
            const permId = permMap.get(permDef.slug);
            if (permId) {
                rpData.push({
                    roleId: role.id,
                    permissionId: permId,
                    dataScope: permDef.dataScope,
                });
            }
            else {
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
async function assignRoleToUser(prisma, userId, roleId) {
    await prisma.userRole.upsert({
        where: {
            userId_roleId: { userId, roleId },
        },
        create: { userId, roleId },
        update: {},
    });
}
//# sourceMappingURL=seed-roles.js.map