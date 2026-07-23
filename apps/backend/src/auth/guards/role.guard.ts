import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/decorators/role';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      this.logger.warn('Access denied: No roles defined for this resource.');
      throw new ForbiddenException(
        'No roles defined for this resource. Access denied.',
      );
    }

    const request: Request = context.switchToHttp().getRequest();
    const userRole = request.user?.role;
    const userId = request.user?.id;

    if (!userRole || !requiredRoles.includes(userRole)) {
      this.logger.warn(
        `User ${userId || 'unknown'} (role: ${userRole || 'none'}) was denied access to route ${request.method} ${request.url} (required: ${requiredRoles.join(', ')})`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
