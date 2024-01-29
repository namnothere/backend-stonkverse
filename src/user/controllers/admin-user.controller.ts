import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminUserService, UserService } from '../providers';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../entities';
import { UserRoleUpdateInput } from '../dtos';

@Controller('admin/user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly adminUserService: AdminUserService,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Patch('role/:id')
  updateRole(@Param('id') id: string, @Body() input: UserRoleUpdateInput) {
    return this.adminUserService.updateRole(id, input);
  }
}
