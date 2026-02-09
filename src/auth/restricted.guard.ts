import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserMongoService } from '../modules/user/services/user-mongo.service';
import { BanStatus } from '../modules/user/user.schema';
import { JwtUserPayload } from '../modules/user/user.interface';

/**
 * Guard to prevent restricted users from creating/writing anything
 * Restricted users can read but cannot create/write
 */
@Injectable()
export class RestrictedGuard implements CanActivate {
  constructor(private userMongoService: UserMongoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtUserPayload;

    if (!user || !user.user_id) {
      throw new ForbiddenException('User not authenticated');
    }

    const dbUser = await this.userMongoService.findById(user.user_id);
    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    const userObj = dbUser.toObject();
    
    // Check if user is restricted (can read but cannot create/write)
    if (userObj.isBan === BanStatus.RESTRICTED) {
      throw new ForbiddenException('Your account is restricted. You can read content but cannot create or modify anything.');
    }

    // Check if user is banned (should not reach here if banned, but double check)
    if (userObj.isBan === BanStatus.BANNED) {
      throw new ForbiddenException('Your account has been banned.');
    }

    return true;
  }
}
