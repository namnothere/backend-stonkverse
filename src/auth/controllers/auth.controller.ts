import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { AuthService } from '../providers';
import { LocalAuthGuard } from '../guards';
import { AuthTokenOutput } from '../dtos';
import { BaseApiResponse } from '../../shared/dtos/base-api-response.dto';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { RegisterInput } from '../dtos/auth-register-input.dto';

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

  @Post('register')
  registerUser(@Body() input: RegisterInput): Promise<BaseApiResponse<any>> {
    return this.authService.registerUser(input);
  }
}
