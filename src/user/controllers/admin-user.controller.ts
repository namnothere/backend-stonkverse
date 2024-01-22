import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from '../providers';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../entities';

@Controller('admin/user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }
}
