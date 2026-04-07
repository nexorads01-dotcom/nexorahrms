import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../roles/permissions.service';
import { requireEnv } from '../../config/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; tenantId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { employee: { select: { id: true, firstName: true, lastName: true, departmentId: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { permissions, scopes } = await this.permissionsService.getUserPermissionsWithScopes(user.id);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      employeeId: user.employee?.id,
      departmentId: user.employee?.departmentId,
      name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email,
      permissions,
      dataScopes: scopes,
    };
  }
}
