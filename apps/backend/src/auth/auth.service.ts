import { RegisterDto, LoginDto } from 'src/dtos/auth.dto';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { SAFE_USER_OMIT } from 'src/users/users.service';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser, SafeUser } from 'src/types/user.types';
import { AuthResponse } from 'src/types/auth.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as crypto from 'crypto';
import { THIRTY_DAYS } from 'src/utils/macros';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateAuthTokens(
    user: AuthenticatedUser,
  ): Promise<AuthResponse> {
    const access_token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refresh_token = this.jwtService.sign(
      { sub: user.id, jti: randomUUID() },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );

    const hashedRefreshToken = this.hashToken(refresh_token);

    await this.prisma.sessions.create({
      data: {
        user_id: user.id,
        session_token: hashedRefreshToken,
        is_valid: true,
        expires_at: new Date(Date.now() + THIRTY_DAYS),
      },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, role } = registerDto;

    const emailTrim = email.trim().toLowerCase();

    if (role === Role.CONSULTANT) {
      const { last_name, first_name, professional_title } = registerDto;

      if (!last_name || !first_name || !professional_title) {
        throw new BadRequestException(
          'last_name, first_name and professional_title are required for consultants',
        );
      }
    } else if (role === Role.COMPANY) {
      const { company_name } = registerDto;

      if (!company_name) {
        throw new BadRequestException('company_name is required for companies');
      }
    }

    const existingUsers = await this.usersService.getUserByEmail(emailTrim);
    if (existingUsers) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword: string = await hash(password, 10);
    let user: SafeUser;

    try {
      user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: emailTrim,
            password: hashedPassword,
            ...(role && { role }),
          },
          omit: SAFE_USER_OMIT,
        });

        if (role === Role.CONSULTANT) {
          const { last_name, first_name, professional_title, description } =
            registerDto;
          await tx.consultant.create({
            data: {
              last_name: last_name!,
              first_name: first_name!,
              professional_title: professional_title!,
              description,
              id_user: createdUser.id,
            },
          });
        } else if (role === Role.COMPANY) {
          const { company_name, company_size, description } = registerDto;
          await tx.company.create({
            data: {
              company_name: company_name!,
              company_size,
              description,
              id_user: createdUser.id,
            },
          });
        }
        return createdUser;
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }

    return this.generateAuthTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const emailTrim = email.trim().toLowerCase();

    const user = await this.usersService.getUserByEmail(emailTrim);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid: boolean = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthTokens(user);
  }

  async refreshToken(
    user: AuthenticatedUser,
    refreshToken: string,
  ): Promise<AuthResponse> {
    const hashedRefreshToken = this.hashToken(refreshToken);

    const updated = await this.prisma.sessions.updateMany({
      where: {
        session_token: hashedRefreshToken,
        is_valid: true,
        expires_at: { gt: new Date() },
      },
      data: { is_valid: false },
    });

    if (updated.count === 1) {
      return this.generateAuthTokens(user);
    }

    const session = await this.prisma.sessions.findUnique({
      where: { session_token: hashedRefreshToken },
    });

    if (!session) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    if (!session.is_valid) {
      await this.prisma.sessions.updateMany({
        where: { user_id: session.user_id },
        data: { is_valid: false },
      });
      throw new UnauthorizedException(
        'Tentative de réutilisation détectée. Toutes vos sessions ont été révoquées.',
      );
    }

    if (session.expires_at <= new Date()) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    throw new UnauthorizedException('Refresh token invalide');
  }

  async logout(refreshToken: string): Promise<void> {
    const hashedRefreshToken = this.hashToken(refreshToken);

    const session = await this.prisma.sessions.findUnique({
      where: { session_token: hashedRefreshToken },
    });

    if (session && session.is_valid) {
      await this.prisma.sessions.update({
        where: { id: session.id },
        data: { is_valid: false },
      });
    }
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<SafeUser | null> {
    const hashedRefreshToken = this.hashToken(refreshToken);

    const storedToken = await this.prisma.sessions.findUnique({
      where: { session_token: hashedRefreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.user_id !== userId) {
      return null;
    }

    return {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };
  }

  async validateUser(userId: string): Promise<SafeUser | null> {
    return await this.usersService.getUserById(userId);
  }
}
