"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("./permissions.decorator");
const permissions_service_1 = require("./permissions.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let PermissionsGuard = class PermissionsGuard {
    reflector;
    permissionsService;
    constructor(reflector, permissionsService) {
        this.reflector = reflector;
        this.permissionsService = permissionsService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return false;
        }
        const { permissions, scopes } = await this.permissionsService.getUserPermissionsWithScopes(user.id);
        request.user.permissions = permissions;
        request.user.dataScopes = scopes;
        if (!requiredPermissions || requiredPermissions.length === 0) {
            const oldRoles = this.reflector.getAllAndOverride('roles', [
                context.getHandler(),
                context.getClass(),
            ]);
            if (oldRoles && oldRoles.length > 0) {
                return this.checkLegacyRole(user.role, oldRoles);
            }
            return true;
        }
        const hasPermission = requiredPermissions.some((permission) => permissions.includes(permission));
        if (!hasPermission) {
            throw new common_1.ForbiddenException(`Access denied. Missing required permission(s).`);
        }
        return true;
    }
    checkLegacyRole(userRole, requiredRoles) {
        const hierarchies = {
            super_admin: 100,
            company_admin: 80,
            hr_manager: 60,
            manager: 40,
            employee: 20,
        };
        const userLevel = hierarchies[userRole] || 0;
        const requiredLevel = Math.min(...requiredRoles.map((r) => hierarchies[r] || 100));
        return userLevel >= requiredLevel;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permissions_service_1.PermissionsService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map