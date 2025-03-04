import {
  Controller,
  Get,
  Post,
  UseGuards,
  UnauthorizedException,
  Body,
  Param,
} from '@nestjs/common';

import { RESULT_STATUS } from '../../shared/constants';
import { BaseApiResponse } from '../../shared/dtos';
// import { MailService } from '../../shared/mail';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import {
  ActivateInput,
  AuthTokenOutput,
  RegisterInput,
  RegisterOutput,
} from '../dtos';
import { JwtAuthGuard, LocalLoginGuard } from '../guards';
import { JwtSign } from '../interfaces';
import { AuthService } from '../providers';

/**
 * https://docs.nestjs.com/techniques/authentication
 */
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    // private mailService: MailService,
  ) {}

  /**
   * See test/e2e/local-auth.spec.ts
   * need username, password in body
   * skip guard to @Public when using global guard
   */
  // @Post('login')
  // @UseGuards(LocalLoginGuard)
  // public login(@ReqContext() ctx: RequestContext): Promise<BaseApiResponse<AuthTokenOutput>> {
  //   return this.auth.login(ctx.user.id);
  // }

  // @Get('logout')
  // @UseGuards(JwtAuthGuard)
  // public logout(@ReqContext() ctx: RequestContext): Promise<BaseApiResponse<null>> {
  //   return this.auth.logout(ctx.user.id);
  // }

  // /**
  //  * See test/e2e/jwt-auth.spec.ts
  //  */
  // @UseGuards(LocalAuthGuard)
  // @Post('jwt/login')
  // public jwtLogin(@ReqContext() ctx: RequestContext): JwtSign {
  //   return this.auth.jwtSign(ctx.user);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('jwt/check')
  // public jwtCheck(@ReqUser() user: Payload): Payload {
  //   return user;
  // }

  // Only verify is performed without checking the expiration of the access_token.
  // @UseGuards(JwtAuthGuard)
  // @Post('jwt/refresh')
  // public jwtRefresh(@ReqContext() ctx: RequestContext, @Body('refresh_token') token?: string): JwtSign {
  //   if (!token || !this.auth.validateRefreshToken(ctx.user.id, token)) {
  //     throw new UnauthorizedException('InvalidRefreshToken');
  //   }

  //   return this.auth.jwtSign(ctx.user);
  // }

  // @Post('register')
  // registerUser(@Body() input: RegisterInput): Promise<BaseApiResponse<RegisterOutput>> {
  //   return this.auth.registerUser(input);
  // }

  // @Post('activate-user')
  // activateUser(@Body() input: ActivateInput): Promise<BaseApiResponse<RegisterOutput>> {
  //   return this.auth.activateUser(input);
  // }

  // @Get('resend-verify/:email')
  // resendVerify(@Param('email') email: string) {
  //   return this.auth.resendUserConfirmation(email);
  // }

  // @Get('test-email/:email')
  // testEmail(@Param('email') email: string) {
  //   return this.mailService.sendUserConfirmationTest(email, 'test');
  // }

  @Get('health')
  public health() {
    return {
      status: RESULT_STATUS.SUCCEED,
      error: false,
      data: null,
      code: 0,
      message: 'OK',
    };
  }
}
