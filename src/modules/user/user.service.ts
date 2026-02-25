import { Injectable } from '@nestjs/common';
import { UserMongoService } from './services/user-mongo.service';
import { User_Register_Type, User_Login_Type, User_Type } from './user.interface';

@Injectable()
export class UserService {
  constructor(private readonly userMongoService: UserMongoService) {}

  /**
   * Register a new user
   */
  async register(registerData: User_Register_Type) {
    return this.userMongoService.mongo_createUser(registerData);
  }

  /**
   * Login user
   */
  async login(loginData: User_Login_Type): Promise<User_Type | null> {
    return this.userMongoService.mongo_loginUser(loginData);
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string) {
    return this.userMongoService.findByEmail(email);
  }

  /**
   * Get user by ID
   */
  async findById(id: string) {
    return this.userMongoService.findById(id);
  }

  /**
   * Get base user data
   */
  async getBaseUserData({ existingUser, network_name }: { existingUser: User_Type; network_name?: string }) {
    return this.userMongoService.mongo_get_baseUserData({ existingUser, network_name });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: any) {
    return this.userMongoService.mongo_updateProfile(userId, profileData);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    return this.userMongoService.verifyEmail(token);
  }

  /**
   * Resend verification email
   */
  async resendVerificationToken(email: string) {
    return this.userMongoService.resendVerificationToken(email);
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string) {
    return this.userMongoService.generatePasswordResetToken(email);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    return this.userMongoService.resetPassword(token, newPassword);
  }

  /**
   * Create or find user from Google OAuth
   */
  async createOrFindGoogleUser(googleUser: {
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    return this.userMongoService.createOrFindGoogleUser(googleUser);
  }
}

