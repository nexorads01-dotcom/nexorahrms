import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService login tenant scope', () => {
  const prisma: any = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const permissionsService: any = {};
  const jwtService: any = { sign: jest.fn(() => 'token') } as JwtService;
  const svc = new AuthService(prisma, jwtService, permissionsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries user with tenant subdomain and email', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(svc.login({ subdomain: 'acme', email: 'a@b.com', password: 'x' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'a@b.com', tenant: { subdomain: 'acme' } } }),
    );
  });

  it('fails on invalid password', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: await bcrypt.hash('right', 4),
      role: 'employee',
      tenantId: 't1',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tenant: { id: 't1', name: 'Acme', subdomain: 'acme' },
      employee: null,
    });
    prisma.user.update.mockResolvedValue({});
    await expect(svc.login({ subdomain: 'acme', email: 'a@b.com', password: 'wrong' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

