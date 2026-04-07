"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPermissions = seedPermissions;
const permissions_constants_1 = require("../constants/permissions.constants");
async function seedPermissions(prisma) {
    let created = 0;
    let updated = 0;
    for (const perm of permissions_constants_1.MASTER_PERMISSIONS) {
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
        if (result.createdAt?.getTime() === result.createdAt?.getTime()) {
            created++;
        }
        else {
            updated++;
        }
    }
    const totalCount = await prisma.permission.count();
    console.log(`  📋 Permissions: ${totalCount} total (${permissions_constants_1.MASTER_PERMISSIONS.length} defined)`);
    return totalCount;
}
//# sourceMappingURL=seed-permissions.js.map