import { LoginDto, RegisterDto } from '@dtos/auth.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ApiResponse } from 'src/types/global';
import { AuthResponse } from 'src/types/auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (consultant or company)' })
  @SwaggerResponse({ status: 201, description: 'User registered successfully' })
  @SwaggerResponse({ status: 400, description: 'Validation error' })
  @SwaggerResponse({ status: 409, description: 'Email already in use' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.register(registerDto);
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
  @SwaggerResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: result,
      message: 'Login successful',
    };
  }
}
