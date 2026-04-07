import { Controller, Get, Post, Body, Put, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RequirePermissions } from './permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions('roles:view_all')
  @Get()
  @ApiOperation({ summary: 'List all roles for the tenant' })
  findAll(@Request() req: any) {
    return this.rolesService.findAll(req.user.tenantId);
  }

  @RequirePermissions('roles:view_all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.rolesService.findOne(req.user.tenantId, id);
  }

  @RequirePermissions('roles:create')
  @Post()
  @ApiOperation({ summary: 'Create a new custom role' })
  create(@Request() req: any, @Body() createRoleDto: any) {
    return this.rolesService.create(req.user.tenantId, req.user.id, createRoleDto);
  }

  @RequirePermissions('roles:edit')
  @Put(':id')
  @ApiOperation({ summary: 'Update a custom role' })
  update(@Request() req: any, @Param('id') id: string, @Body() updateRoleDto: any) {
    return this.rolesService.update(req.user.tenantId, req.user.id, id, updateRoleDto);
  }

  @RequirePermissions('roles:delete')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom role' })
  delete(@Request() req: any, @Param('id') id: string) {
    return this.rolesService.delete(req.user.tenantId, req.user.id, id);
  }
}
