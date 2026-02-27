import { Controller, Patch, Body, Request, UseGuards, Post, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../../auth/public.decorator';
import { UserService } from './user.service';
import { ZodValidationPipe } from '../../validation.pipe';
import { User_ProfileUpdate_Schema, User_ProfileUpdate_Type, User_Type, User_ChangePassword_Schema, User_ChangePassword_Type, User_ResumeUpdate_Schema, User_ResumeUpdate_Type } from './user.interface';
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
    // console.log('🔵 [UserController] updateProfile called');
    // console.log('🔵 [UserController] req.user:', req.user);
    // console.log('🔵 [UserController] profileData:', profileData);
    
    if (!req.user || !req.user.user_id) {
      console.error('❌ [UserController] No user in request or missing user_id');
      throw new Error('User not authenticated');
    }
    
    return handleRequest<User_Type>({
      execute: () => this.userService.updateProfile(req.user.user_id, profileData),
      actionName: 'updateProfile',
    });
  }

  /**
   * Change password for authenticated user
   * POST /api/v1/user/change-password
   * Requires authentication (JWT)
   */
  @Post('change-password')
  async changePassword(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: User_ChangePassword_Schema, action: 'changePassword' }))
    passwordData: User_ChangePassword_Type,
  ): Promise<ResponseDataOutput<any | ResponseDataWhenError>> {
    console.log('🔵 [UserController] changePassword called');
    
    if (!req.user || !req.user.user_id) {
      console.error('❌ [UserController] No user in request or missing user_id');
      throw new Error('User not authenticated');
    }
    
    return handleRequest<any>({
      execute: () => this.userService.changePassword(
        req.user.user_id,
        passwordData.currentPassword,
        passwordData.newPassword
      ),
      actionName: 'changePassword',
    });
  }

  /**
   * Get user resume
   * GET /api/v1/user/resume
   * Requires authentication (JWT)
   */
  @Get('resume')
  async getResume(
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<User_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    
    return handleRequest<User_Type>({
      execute: () => this.userService.getResume(req.user.user_id),
      actionName: 'getResume',
    });
  }

  /**
   * Update user resume
   * PATCH /api/v1/user/resume
   * Requires authentication (JWT)
   */
  @Patch('resume')
  async updateResume(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: User_ResumeUpdate_Schema, action: 'updateResume' }))
    resumeData: User_ResumeUpdate_Type,
  ): Promise<ResponseDataOutput<User_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    
    return handleRequest<User_Type>({
      execute: () => this.userService.updateResume(req.user.user_id, resumeData),
      actionName: 'updateResume',
    });
  }

  /**
   * Get public resume by user ID
   * GET /api/v1/user/resume/public/:userId
   * Public endpoint (no authentication required)
   */
  @Get('resume/public/:userId')
  @Public()
  async getPublicResume(
    @Param('userId') userId: string,
  ): Promise<ResponseDataOutput<User_Type | ResponseDataWhenError>> {
    return handleRequest<User_Type>({
      execute: () => this.userService.getPublicResume(userId),
      actionName: 'getPublicResume',
    });
  }
}
