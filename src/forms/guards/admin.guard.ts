import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Placeholder guard for admin-only routes.
 * TODO: Replace with real JWT + role check when auth is implemented.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
