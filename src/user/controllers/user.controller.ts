import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from '../providers';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { JwtAuthGuard } from '../../auth/guards';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('profile')
  getProfile(@ReqContext() ctx: RequestContext) {
    return this.userService.getProfile(ctx.user.id);
  }
}
