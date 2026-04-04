import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class CreateUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      body?: { role?: UserRole };
      headers?: { authorization?: string };
    }>();

    const requestedRole = request.body?.role ?? UserRole.USER;

    if (requestedRole === UserRole.USER) {
      return true;
    }

    const authHeader = request.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Superadmin token is required to create admin users',
      );
    }

    const token = authHeader.slice('Bearer '.length).trim();

    let payload: { role?: string };
    try {
      payload = this.jwtService.verify<{ role?: string }>(token, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmin can create admin users');
    }

    return true;
  }
}
