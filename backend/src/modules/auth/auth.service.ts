import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { seedSystemRoles, assignRoleToUser } from '../roles/seeds/seed-roles';
import { PermissionsService } from '../roles/permissions.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private permissionsService: PermissionsService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check subdomain uniqueness
    const existing = await this.prisma.tenant.findUnique({ where: { subdomain: dto.subdomain } });
    if (existing) throw new ConflictException('Subdomain already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create tenant + admin user + seed data in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Prisma's generated TransactionClient type omits model delegates incorrectly with TS + getters; runtime tx is a full client minus denied methods.
      const db = tx as PrismaClient;

      // 1. Create Tenant
      const tenant = await db.tenant.create({
        data: {
          name: dto.companyName,
          subdomain: dto.subdomain,
          timezone: dto.timezone || 'UTC',
          currency: dto.currency || 'USD',
        },
      });

      // 2. Create Admin User
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

      // 3. Create Admin Employee Record
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

      // 4. Seed Departments
      const deptNames = ['General', 'Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Design', 'Support'];
      for (const name of deptNames) {
        await db.department.create({ data: { tenantId: tenant.id, name, code: name.substring(0, 3).toUpperCase() } });
      }

      // 5. Seed Designations
      const designations = [
        { name: 'Intern', level: 1 }, { name: 'Junior Developer', level: 2 },
        { name: 'Mid Developer', level: 3 }, { name: 'Senior Developer', level: 4 },
        { name: 'Lead', level: 5 }, { name: 'Manager', level: 6 },
        { name: 'Director', level: 7 }, { name: 'VP', level: 8 }, { name: 'CXO', level: 9 },
      ];
      for (const d of designations) {
        await db.designation.create({ data: { tenantId: tenant.id, ...d } });
      }

      // 6. Seed Leave Types & Policies
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

      // 7. Seed Default Shift
      await db.shift.create({
        data: { tenantId: tenant.id, name: 'General Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15, isDefault: true },
      });

      // 8. Seed Subscription
      await db.subscription.create({
        data: { tenantId: tenant.id, plan: 'professional', status: 'trialing', employeeLimit: 500, trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      });

      // 9. Seed RBAC — System roles + permissions
      console.log('🔐 Seeding RBAC roles & permissions...');
      const roleMap = await seedSystemRoles(db as any, tenant.id);

      // 10. Assign 'company_admin' role to the admin user
      const companyAdminRoleId = roleMap['company_admin'];
      if (companyAdminRoleId) {
        await assignRoleToUser(db as any, user.id, companyAdminRoleId);
        console.log(`  ✅ Assigned 'Company Admin' role to ${dto.email}`);
      }

      return { tenant, user, employee };
    });

    return {
      tenant: { id: result.tenant.id, name: result.tenant.name, subdomain: result.tenant.subdomain },
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      message: 'Registration successful. Verification email sent.',
    };
  }

  async login(dto: LoginDto) {
    const subdomain = dto.subdomain?.trim().toLowerCase();
    const email = dto.email?.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email, tenant: { subdomain } },
      include: { tenant: true, employee: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked. Try again later.');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email,
        employee: user.employee ? { id: user.employee.id } : null,
        tenant: { id: user.tenant.id, name: user.tenant.name, subdomain: user.tenant.subdomain },
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Invalid refresh token');

      const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
      const newHash = await bcrypt.hash(tokens.refreshToken, 10);
      await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newHash } });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
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
        userRoles: {
          include: { role: { select: { slug: true } } },
        },
      },
    });
    if (!user) throw new BadRequestException('User not found');

    const { permissions, scopes } = await this.permissionsService.getUserPermissionsWithScopes(userId);

    return {
      id: user.id,
      email: user.email,
      role: user.role, // Legacy role, kept for backward compatibility
      roles: user.userRoles.map(ur => ur.role.slug), // New RBAC roles
      employee: user.employee,
      tenant: user.tenant,
      permissions,
      dataScopes: scopes,
    };
  }

  private async generateTokens(userId: string, email: string, role: string, tenantId: string) {
    const payload = { sub: userId, email, role, tenantId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
