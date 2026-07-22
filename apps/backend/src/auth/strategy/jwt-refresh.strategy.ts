import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import type { JwtPayload, AuthenticatedUser } from 'src/types/user.types';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = req?.cookies as Record<string, string> | undefined;
          return cookies?.refresh_token ?? null;
        },
        (req: Request) => {
          const body = req?.body as Record<string, string> | undefined;
          return body?.refresh_token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    const refreshToken = ExtractJwt.fromExtractors([
      (req: Request) => {
        const cookies = req?.cookies as Record<string, string> | undefined;
        return cookies?.refresh_token ?? null;
      },
      (req: Request) => {
        const body = req?.body as Record<string, string> | undefined;
        return body?.refresh_token ?? null;
      },
    ])(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const user = await this.authService.validateRefreshToken(
      payload.sub,
      refreshToken,
    );

    if (!user) {
      throw new UnauthorizedException('Refresh token invalide ou révoqué');
    }

    return { id: user.id, email: user.email ?? '', role: user.role };
  }
}
