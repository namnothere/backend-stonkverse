import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { User } from '../entities';
import { STRATEGY_JWT_VERIFY } from '../constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class JwtVerifyGuard extends AuthGuard(STRATEGY_JWT_VERIFY) {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private readonly userRepo: Model<User>,
  ) {
    super();
  }

  public override getRequest(context: ExecutionContext): Request {
    if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context).getContext<{
        req: Request;
      }>();
      return ctx.req;
    }

    return context.switchToHttp().getRequest<Request>();
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
      where: {
        token: authorization,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    headers.user = user;
    return true;
  }
}
