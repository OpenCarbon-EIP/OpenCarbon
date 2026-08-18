import { LoginDto, RegisterDto } from 'src/dtos/auth.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ApiResponse } from 'src/types/global';
import { AuthResponse } from 'src/types/auth.types';
import { RefreshTokenAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user';
import { RefreshToken } from 'src/decorators/refresh-token';
import type { Response } from 'express';
import type { AuthenticatedUser } from 'src/types/user.types';
import { THIRTY_DAYS } from 'src/utils/macros';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: THIRTY_DAYS,
    });
  }

  @Post('register/email')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (consultant or company)' })
  @SwaggerResponse({ status: 201, description: 'User registered successfully' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.register(registerDto);
    this.setRefreshCookie(res, result.refresh_token);

    return {
      success: true,
      data: result,
      message: 'User registered successfully',
    };
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @SwaggerResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.login(loginDto);
    this.setRefreshCookie(res, result.refresh_token);

    return {
      success: true,
      data: result,
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @SwaggerResponse({ status: 200, description: 'Token refreshed successfully' })
  @SwaggerResponse({
    status: 401,
    description: 'Invalid, expired or reused refresh token',
  })
  async refreshToken(
    @CurrentUser() user: AuthenticatedUser,
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<AuthResponse>> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const result = await this.authService.refreshToken(user, refreshToken);
    this.setRefreshCookie(res, result.refresh_token);

    return {
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and invalidate refresh token' })
  @SwaggerResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      data: null,
      message: 'Logout successful',
    };
  }
}
