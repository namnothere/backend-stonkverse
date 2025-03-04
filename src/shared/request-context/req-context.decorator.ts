import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestContext } from './request-context.dto';
import { createRequestContext } from './util';

export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();

    return createRequestContext(request);
  },
);
