import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { User, USER_ROLE } from '../entities';
import { STRATEGY_JWT_ADMIN } from '../constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class JwtAuthAdminGuard extends AuthGuard(STRATEGY_JWT_ADMIN) {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User.name)
    private readonly userRepo: Model<User>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) return true;
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const http = context.switchToHttp();
    const { headers } = http.getRequest();
    if (!headers.authorization) {
      throw new UnauthorizedException();
    }
    const authorization = headers.authorization.replace('Bearer ', '');

    const user = await this.userRepo.findOne({
      token: authorization,
      // role: USER_ROLE.ADMIN,
    });

    console.log(user);

    if (!user) {
      throw new UnauthorizedException();
    }

    headers.user = user;
    return true;
  }
}
