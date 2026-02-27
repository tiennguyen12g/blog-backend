import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user.schema';
import { User_Register_Type, User_Login_Type, User_Type, User_RegisterOutput_Type, User_ResumeUpdate_Type } from '../user.interface';
import { hashPassword, validateUserPassword } from '../../../utils/bcryptPassword';
import { ResponseData } from '../../../global/GlobalResponseData';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserMongoService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Create a new user (Signup)
   */
  async mongo_createUser(registerData: User_Register_Type): Promise<User_RegisterOutput_Type> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email: registerData.email }).lean();
      if (existingUser) {
        return {
          message: 'User with this email already exists',
          status: 'Failed' as const,
        };
      }

      // Hash password
      const hashedPassword = await hashPassword(registerData.password);

      // Generate email verification token
      const verificationToken = uuidv4();
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours expiry

      // Create new user with default resume data
      const defaultResume = this.getDefaultResumeData();
      const newUser = new this.userModel({
        email: registerData.email,
        password: hashedPassword,
        role: 'user',
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
        resume: defaultResume,
      });

      const savedUser = await newUser.save();
      const { password, ...userWithoutPassword } = savedUser.toObject();

      return {
        message: 'Create account successful',
        status: 'Success' as const,
        user: {
          email: userWithoutPassword.email,
          role: userWithoutPassword.role,
          _id: userWithoutPassword._id.toString(),
        },
      };
    } catch (error) {
      if ((error as any).code === 11000) {
        // Duplicate key error
        return {
          message: 'User with this email already exists',
          status: 'Failed' as const,
        };
      }
      throw error;
    }
  }

  /**
   * Login user
   */
  async mongo_loginUser(loginData: User_Login_Type): Promise<User_Type | null> {
    const user = await this.userModel.findOne({ email: loginData.email }).lean();

    if (!user) {
      return null;
    }

    const isPasswordMatch = await validateUserPassword({
      password: loginData.password,
      hash: user.password,
    });

    if (!isPasswordMatch) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      _id: userWithoutPassword._id.toString(),
    } as User_Type;
  }

  /**
   * Get base user data
   */
  async mongo_get_baseUserData({
    existingUser,
  }: {
    existingUser: User_Type;
    network_name?: string;
  }): Promise<any> {
    try {
      const user = await this.userModel.findById(existingUser._id).lean();
      if (!user) {
        return {
          status: 'Failed',
          message: 'User not found',
        };
      }

      const { password, ...userWithoutPassword } = user;
      return {
        status: 'Success',
        message: 'Get user data successful',
        data: userWithoutPassword,
      };
    } catch (error) {
      return {
        status: 'Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Update user profile
   */
  async mongo_updateProfile(userId: string, profileData: any): Promise<any> {
    try {
      console.log('🔵 [mongo_updateProfile] Updating profile for user ID:', userId);
      // console.log('🔵 [mongo_updateProfile] Profile data:', profileData);

      const user = await this.userModel.findById(userId);
      if (!user) {
        console.log('❌ [mongo_updateProfile] User not found');
        throw new Error('User not found');
      }

      // Update profile fields (merge with existing profile)
      if (!user.profile) {
        user.profile = {} as any;
      }

      // Update only provided fields
      if (profileData.firstName !== undefined) {
        (user.profile as any).firstName = profileData.firstName;
      }
      if (profileData.lastName !== undefined) {
        (user.profile as any).lastName = profileData.lastName;
      }
      if (profileData.bio !== undefined) {
        (user.profile as any).bio = profileData.bio;
      }
      if (profileData.avatar !== undefined) {
        (user.profile as any).avatar = profileData.avatar;
      }
      if (profileData.phoneNumber !== undefined) {
        (user.profile as any).phoneNumber = profileData.phoneNumber;
      }
      if (profileData.sex !== undefined) {
        (user.profile as any).sex = profileData.sex;
      }
      if (profileData.address !== undefined) {
        (user.profile as any).address = profileData.address;
      }
      if (profileData.location !== undefined) {
        (user.profile as any).location = profileData.location;
      }
      if (profileData.interests !== undefined) {
        (user.profile as any).interests = profileData.interests;
      }
      if (profileData.currency !== undefined) {
        (user.profile as any).currency = profileData.currency.toUpperCase();
      }
      if (profileData.visaPoints !== undefined) {
        // Initialize visaPoints if it doesn't exist
        if (!(user.profile as any).visaPoints) {
          (user.profile as any).visaPoints = {};
        }
        // Calculate total points (base points WITHOUT state nomination bonuses)
        // State nomination points are visa-specific and added separately in the frontend
        const points = profileData.visaPoints;
        const totalPoints = 
          (points.agePoints || 0) +
          (points.englishLanguagePoints || 0) +
          (points.australiaExperiencePoints || 0) +
          (points.overseasExperiencePoints || 0) +
          (points.qualificationsPoints || 0) +
          (points.australianStudyPoints || 0) +
          (points.specialistEducationPoints || 0) +
          (points.regionalStudyPoints || 0) +
          (points.professionalYearPoints || 0) +
          (points.communityLanguagePoints || 0) +
          (points.partnerSkillsPoints || 0);
          // Exclude stateNominationPoints190 and regionalSponsorshipPoints491
          // These are visa-specific bonuses added separately per visa type
        
        // Update visa points fields
        Object.assign((user.profile as any).visaPoints, profileData.visaPoints, {
          totalPoints,
          lastUpdated: new Date(),
        });
      }

      // Mark profile as modified for Mongoose to save nested changes
      user.markModified('profile');

      const savedUser = await user.save();
      const { password, ...userWithoutPassword } = savedUser.toObject();

      return {
        ...userWithoutPassword,
        _id: userWithoutPassword._id.toString(),
      };
    } catch (error) {
      console.error('❌ [mongo_updateProfile] Error:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userModel.findOne({
        emailVerificationToken: token,
        emailVerificationTokenExpiry: { $gt: new Date() }, // Token not expired
      }).exec();

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token',
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email already verified',
        };
      }

      // Mark email as verified and clear token
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpiry = undefined;
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('❌ [verifyEmail] Error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email (generate new token)
   */
  async resendVerificationToken(email: string): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const user = await this.userModel.findOne({ email }).exec();

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email already verified',
        };
      }

      // Generate new verification token
      const verificationToken = uuidv4();
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours expiry

      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpiry = verificationTokenExpiry;
      await user.save();

      return {
        success: true,
        token: verificationToken,
        message: 'Verification token generated',
      };
    } catch (error) {
      console.error('❌ [resendVerificationToken] Error:', error);
      throw error;
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const user = await this.userModel.findOne({ email }).exec();

      if (!user) {
        // Don't reveal if user exists or not (security best practice)
        return {
          success: true, // Return success even if user doesn't exist
          message: 'If an account exists with this email, a password reset link has been sent',
        };
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

      user.passwordResetToken = resetToken;
      user.passwordResetTokenExpiry = resetTokenExpiry;
      await user.save();

      return {
        success: true,
        token: resetToken,
        message: 'Password reset token generated',
      };
    } catch (error) {
      console.error('❌ [generatePasswordResetToken] Error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userModel.findOne({
        passwordResetToken: token,
        passwordResetTokenExpiry: { $gt: new Date() }, // Token not expired
      }).exec();

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiry = undefined;
      await user.save();

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('❌ [resetPassword] Error:', error);
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    try {
      const user = await this.userModel.findById(userId).exec();
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if user has a password (OAuth users might not have one)
      if (!user.password) {
        return {
          success: false,
          message: 'Password change not available for OAuth accounts',
        };
      }

      // Validate current password
      const isPasswordMatch = await validateUserPassword({
        password: currentPassword,
        hash: user.password,
      });

      if (!isPasswordMatch) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('❌ [changePassword] Error:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Create or find user from Google OAuth
   * Google users don't need email verification (Google already verified)
   */
  async createOrFindGoogleUser(googleUser: {
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }): Promise<User_Type> {
    try {
      // Check if user already exists
      let user = await this.userModel.findOne({ email: googleUser.email }).exec();

      if (user) {
        // User exists - update emailVerified if not already verified
        if (!user.emailVerified) {
          user.emailVerified = true;
          user.emailVerificationToken = undefined;
          user.emailVerificationTokenExpiry = undefined;
          await user.save();
        }

        // Update profile if Google provides more info
        if (!user.profile) {
          user.profile = {} as any;
        }
        if (googleUser.firstName && !(user.profile as any).firstName) {
          (user.profile as any).firstName = googleUser.firstName;
        }
        if (googleUser.lastName && !(user.profile as any).lastName) {
          (user.profile as any).lastName = googleUser.lastName;
        }
        if (googleUser.picture && !(user.profile as any).avatar) {
          (user.profile as any).avatar = googleUser.picture;
        }
        user.markModified('profile');
        await user.save();

        const { password, ...userWithoutPassword } = user.toObject();
        return {
          ...userWithoutPassword,
          _id: userWithoutPassword._id.toString(),
        } as User_Type;
      }

      // Create new user - email is already verified by Google
      // Set default password for OAuth users (they won't use it, but backend requires it)
      const defaultPassword = '12345678';
      const hashedPassword = await hashPassword(defaultPassword);
      
      // Create new user with default resume data
      const defaultResume = this.getDefaultResumeData();
      // Pre-fill resume with Google profile data
      if (googleUser.firstName || googleUser.lastName) {
        defaultResume.fullName = `${googleUser.firstName || ''} ${googleUser.lastName || ''}`.trim();
      }
      if (googleUser.picture) {
        defaultResume.profilePhoto = googleUser.picture;
      }
      defaultResume.email = googleUser.email;

      const newUser = new this.userModel({
        email: googleUser.email,
        password: hashedPassword, // Default password for OAuth users
        role: 'user',
        emailVerified: true, // Google already verified
        profile: {
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          avatar: googleUser.picture,
        },
        resume: defaultResume,
      });

      const savedUser = await newUser.save();
      const { password, ...userWithoutPassword } = savedUser.toObject();

      return {
        ...userWithoutPassword,
        _id: userWithoutPassword._id.toString(),
      } as User_Type;
    } catch (error) {
      console.error('❌ [createOrFindGoogleUser] Error:', error);
      throw error;
    }
  }

  /**
   * Add 2FA secret to user
   */
  async mongo_user_add2fa({
    email,
    user_id,
    secure,
  }: {
    email: string;
    user_id: string;
    secure: { google2FA: { twoFactorSecret: string; otpauth_url: string; is2FAVerified: boolean } };
  }): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email, _id: user_id }).exec();
      if (!user) {
        return {
          status: 'Failed',
          message: 'User not found',
        };
      }

      user.secure = user.secure || {};
      user.secure.google2FA = {
        twoFactorSecret: secure.google2FA.twoFactorSecret,
        otpauth_url: secure.google2FA.otpauth_url,
        is2FAVerified: secure.google2FA.is2FAVerified,
      };

      await user.save();
      return {
        status: 'Success',
        message: '2FA secret added successfully',
        data: {
          otpauth_url: secure.google2FA.otpauth_url,
        },
      };
    } catch (error) {
      return {
        status: 'Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Verify and enable 2FA for user
   */
  async mongo_user_verify2FA({ email, user_id }: { email: string; user_id: string }): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email, _id: user_id }).exec();
      if (!user) {
        return {
          status: 'Failed',
          message: 'User not found',
        };
      }

      if (!user.secure?.google2FA) {
        return {
          status: 'Failed',
          message: '2FA not set up for this user',
        };
      }

      user.secure.google2FA.is2FAVerified = true;
      await user.save();

      return {
        status: 'Success',
        message: '2FA verified and enabled successfully',
      };
    } catch (error) {
      return {
        status: 'Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Test sensitive data endpoint (requires 2FA)
   */
  async mongo_testSensitive({ email, user_id }: { email: string; user_id: string }): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email, _id: user_id }).lean();
      if (!user) {
        return {
          status: 'Failed',
          message: 'User not found',
        };
      }

      return {
        status: 'Success',
        message: 'Sensitive data accessed successfully',
        data: {
          // Example sensitive data
          accountBalance: '***',
          personalInfo: 'Protected by 2FA',
        },
      };
    } catch (error) {
      return {
        status: 'Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Get default resume data for new users
   */
  getDefaultResumeData() {
    return {
      fullName: '',
      profilePhoto: '',
      phone: '',
      email: '',
      location: '',
      nationality: '',
      education: '',
      educationLocation: '',
      educationGraduation: '',
      visaType: '',
      visaExpiry: '',
      skills: [],
      languages: [],
      aboutMe: '',
      workExperience: [],
      strengths: [],
    };
  }

  /**
   * Get user resume
   */
  async getResume(userId: string): Promise<User_Type> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user doesn't have resume, return with default resume data
    if (!user.resume) {
      const defaultResume = this.getDefaultResumeData();
      // Merge with user profile data if available
      if (user.profile) {
        defaultResume.fullName = `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
        defaultResume.profilePhoto = user.profile.avatar || '';
        defaultResume.phone = user.profile.phoneNumber || '';
        defaultResume.email = user.email;
        defaultResume.location = user.profile.location || '';
      }
      return {
        ...user,
        _id: user._id.toString(),
        resume: defaultResume,
      } as User_Type;
    }

    return {
      ...user,
      _id: user._id.toString(),
    } as User_Type;
  }

  /**
   * Update user resume
   */
  async updateResume(userId: string, resumeData: User_ResumeUpdate_Type): Promise<User_Type> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize resume if it doesn't exist
    if (!user.resume) {
      user.resume = this.getDefaultResumeData() as any;
    }

    // Update only provided fields
    Object.keys(resumeData).forEach((key) => {
      if (resumeData[key as keyof User_ResumeUpdate_Type] !== undefined) {
        (user.resume as any)[key] = resumeData[key as keyof User_ResumeUpdate_Type];
      }
    });

    // Mark resume as modified to ensure Mongoose saves nested object changes
    user.markModified('resume');
    await user.save();
    const { password, ...userWithoutPassword } = user.toObject();
    return {
      ...userWithoutPassword,
      _id: userWithoutPassword._id.toString(),
    } as User_Type;
  }

  /**
   * Get public resume by user ID (no authentication required)
   */
  async getPublicResume(userId: string): Promise<User_Type> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return only resume data, no sensitive information
    const { password, secure, emailVerificationToken, passwordResetToken, ...publicUser } = user;
    
    return {
      ...publicUser,
      _id: publicUser._id.toString(),
    } as User_Type;
  }
}

