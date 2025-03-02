import { plainToClass } from 'class-transformer';
import { Request } from 'express';

import { UserAccessTokenClaims } from '../../../auth/dtos';
import {
  FORWARDED_FOR_TOKEN_HEADER,
  REQUEST_ID_TOKEN_HEADER,
} from '../../constants';
import { RequestContext } from '../request-context.dto';

// Creates a RequestContext object from Request
export function createRequestContext(request: Request): RequestContext {
  const ctx = new RequestContext();
  ctx.requestID = request.header(REQUEST_ID_TOKEN_HEADER);
  ctx.url = request.url;
  ctx.ip = request.header(FORWARDED_FOR_TOKEN_HEADER)
    ? request.header(FORWARDED_FOR_TOKEN_HEADER)
    : request.ip;
  // const user = request.user ? request.user : request.header('user');
  // If request.user does not exist, we explicitly set it to null.
  const user = request.header('user') ? request.header('user') : request.user;
  ctx.user = plainToClass(UserAccessTokenClaims, user);

  return ctx;
}
