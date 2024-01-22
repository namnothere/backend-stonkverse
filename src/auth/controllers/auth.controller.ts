import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { AuthService } from '../providers';
import { JwtAuthGuard, LocalAuthGuard } from '../guards';
import { BaseApiResponse } from '../../shared/dtos';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { RegisterInput, AuthTokenOutput, RegisterOutput } from '../dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<AuthTokenOutput>> {
    return this.authService.login(ctx.user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@ReqContext() ctx: RequestContext): Promise<BaseApiResponse<null>> {
    return this.authService.logout(ctx.user.id);
  }

  @Post('register')
  registerUser(@Body() input: RegisterInput): Promise<BaseApiResponse<RegisterOutput>> {
    return this.authService.registerUser(input);
  }
}
