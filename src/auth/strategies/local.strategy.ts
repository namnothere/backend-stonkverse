import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserAccessTokenClaims } from '../dtos';
import { Request } from 'express';
import { STRATEGY_LOCAL } from '../constants/strategy.constant';
import { AuthService } from '../providers';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, STRATEGY_LOCAL) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    username: string,
    password: string,
  ): Promise<UserAccessTokenClaims> {
    return this.authService.validateUsernamePassword(
      username || request?.body?.username,
      password || request?.body?.password,
    );
  }
}
