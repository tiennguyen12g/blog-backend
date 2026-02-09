import { Controller, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ZodValidationPipe } from '../../validation.pipe';
import { User_ProfileUpdate_Schema, User_ProfileUpdate_Type, User_Type } from './user.interface';
import { handleRequest } from '../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../global/GlobalResponseData';
import { JwtUserPayload } from './user.interface';

@Controller('api/v1/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Update user profile
   * PATCH /api/v1/user/profile
   * Requires authentication (JWT)
   */
  @Patch('profile')
  async updateProfile(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: User_ProfileUpdate_Schema, action: 'updateProfile' }))
    profileData: User_ProfileUpdate_Type,
  ): Promise<ResponseDataOutput<User_Type | ResponseDataWhenError>> {
    console.log('🔵 [UserController] updateProfile called');
    console.log('🔵 [UserController] req.user:', req.user);
    console.log('🔵 [UserController] profileData:', profileData);
    
    if (!req.user || !req.user.user_id) {
      console.error('❌ [UserController] No user in request or missing user_id');
      throw new Error('User not authenticated');
    }
    
    return handleRequest<User_Type>({
      execute: () => this.userService.updateProfile(req.user.user_id, profileData),
      actionName: 'updateProfile',
    });
  }
}
