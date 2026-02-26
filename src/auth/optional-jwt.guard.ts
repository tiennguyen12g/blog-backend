import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Optional JWT Guard
 * Tries to authenticate the user if a token is present,
 * but doesn't throw an error if no token is provided.
 * This allows public endpoints to still get user info when available.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Try to authenticate, but don't throw if it fails
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any) {
    // If there's an error or no user, just return undefined instead of throwing
    // This allows the endpoint to work for both authenticated and unauthenticated users
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
