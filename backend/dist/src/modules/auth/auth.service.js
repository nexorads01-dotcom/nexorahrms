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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.prisma.tenant.findUnique({ where: { subdomain: dto.subdomain } });
        if (existing)
            throw new common_1.ConflictException('Subdomain already taken');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const result = await this.prisma.$transaction(async (tx) => {
            const db = tx;
            const tenant = await db.tenant.create({
                data: {
                    name: dto.companyName,
                    subdomain: dto.subdomain,
                    timezone: dto.timezone || 'UTC',
                    currency: dto.currency || 'USD',
                },
            });
            const user = await db.user.create({
                data: {
                    tenantId: tenant.id,
                    email: dto.email,
                    passwordHash,
                    role: 'company_admin',
                    isActive: true,
                    isVerified: true,
                },
            });
            const employee = await db.employee.create({
                data: {
                    tenantId: tenant.id,
                    userId: user.id,
                    employeeCode: 'NEX-0001',
                    firstName: dto.adminFirstName,
                    lastName: dto.adminLastName,
                    email: dto.email,
                    dateOfJoining: new Date(),
                    status: 'active',
                    employmentType: 'full_time',
                },
            });
            const deptNames = ['General', 'Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Design', 'Support'];
            for (const name of deptNames) {
                await db.department.create({ data: { tenantId: tenant.id, name, code: name.substring(0, 3).toUpperCase() } });
            }
            const designations = [
                { name: 'Intern', level: 1 }, { name: 'Junior Developer', level: 2 },
                { name: 'Mid Developer', level: 3 }, { name: 'Senior Developer', level: 4 },
                { name: 'Lead', level: 5 }, { name: 'Manager', level: 6 },
                { name: 'Director', level: 7 }, { name: 'VP', level: 8 }, { name: 'CXO', level: 9 },
            ];
            for (const d of designations) {
                await db.designation.create({ data: { tenantId: tenant.id, ...d } });
            }
            const leaveTypes = [
                { name: 'Casual Leave', code: 'CL', color: '#8b5cf6', quota: 12 },
                { name: 'Sick Leave', code: 'SL', color: '#3b82f6', quota: 6 },
                { name: 'Earned Leave', code: 'EL', color: '#22c55e', quota: 15 },
                { name: 'Unpaid Leave', code: 'UL', color: '#ef4444', quota: 0 },
            ];
            for (const lt of leaveTypes) {
                const leaveType = await db.leaveType.create({
                    data: { tenantId: tenant.id, name: lt.name, code: lt.code, color: lt.color, isPaid: lt.code !== 'UL' },
                });
                await db.leavePolicy.create({
                    data: { tenantId: tenant.id, leaveTypeId: leaveType.id, annualQuota: lt.quota, allowNegative: lt.code === 'UL' },
                });
            }
            await db.shift.create({
                data: { tenantId: tenant.id, name: 'General Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15, isDefault: true },
            });
            await db.subscription.create({
                data: { tenantId: tenant.id, plan: 'professional', status: 'trialing', employeeLimit: 500, trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
            });
            return { tenant, user, employee };
        });
        return {
            tenant: { id: result.tenant.id, name: result.tenant.name, subdomain: result.tenant.subdomain },
            user: { id: result.user.id, email: result.user.email, role: result.user.role },
            message: 'Registration successful. Verification email sent.',
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
            include: { tenant: true, employee: { select: { id: true, firstName: true, lastName: true } } },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Account is deactivated');
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is locked. Try again later.');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: { increment: 1 },
                    ...(user.failedLoginAttempts >= 4 ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
                },
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
        const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });
        return {
            tokens,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email,
                tenant: { id: user.tenant.id, name: user.tenant.name, subdomain: user.tenant.subdomain },
            },
        };
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'nexora-refresh-secret-dev-2026',
            });
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user || !user.refreshTokenHash)
                throw new common_1.UnauthorizedException('Invalid refresh token');
            const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
            if (!isValid)
                throw new common_1.UnauthorizedException('Invalid refresh token');
            const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
            const newHash = await bcrypt.hash(tokens.refreshToken, 10);
            await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newHash } });
            return tokens;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isMatch)
            throw new common_1.BadRequestException('Current password is incorrect');
        const newHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
        return { message: 'Password changed successfully' };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: { select: { id: true, name: true, subdomain: true, timezone: true, currency: true } },
                employee: {
                    include: {
                        department: { select: { id: true, name: true } },
                        designation: { select: { id: true, name: true } },
                        reportingManager: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            employee: user.employee,
            tenant: user.tenant,
        };
    }
    async generateTokens(userId, email, role, tenantId) {
        const payload = { sub: userId, email, role, tenantId };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET || 'nexora-jwt-secret-dev-2026',
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'nexora-refresh-secret-dev-2026',
            expiresIn: '7d',
        });
        return { accessToken, refreshToken, expiresIn: 900 };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map