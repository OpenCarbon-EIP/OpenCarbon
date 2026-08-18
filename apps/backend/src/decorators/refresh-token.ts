import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const body = request.body as { refresh_token?: string } | undefined;
    const cookies = request.cookies as { refresh_token?: string } | undefined;

    return cookies?.refresh_token ?? body?.refresh_token;
  },
);
