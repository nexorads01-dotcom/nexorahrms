import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController, PermissionsController],
  providers: [RolesService, PermissionsService],
  exports: [PermissionsService, RolesService], // Export needed for PermissionsGuard
})
export class RolesModule {}
