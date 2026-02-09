import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user.schema';
import { User_Register_Type, User_Login_Type, User_Type, User_RegisterOutput_Type } from '../user.interface';
import { hashPassword, validateUserPassword } from '../../../utils/bcryptPassword';
import { ResponseData } from '../../../global/GlobalResponseData';

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
          status: 'Failed',
        } as any;
      }

      // Hash password
      const hashedPassword = await hashPassword(registerData.password);

      // Create new user
      const newUser = new this.userModel({
        email: registerData.email,
        password: hashedPassword,
        role: 'user',
      });

      const savedUser = await newUser.save();
      const { password, ...userWithoutPassword } = savedUser.toObject();

      return {
        message: 'Create account successful',
        status: 'Success',
        user: {
          email: userWithoutPassword.email,
          role: userWithoutPassword.role,
          _id: userWithoutPassword._id.toString(),
        },
      } as any;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        return {
          message: 'User with this email already exists',
          status: 'Failed',
        } as any;
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
        message: error.message,
      };
    }
  }

  /**
   * Update user profile
   */
  async mongo_updateProfile(userId: string, profileData: any): Promise<any> {
    try {
      console.log('🔵 [mongo_updateProfile] Updating profile for user ID:', userId);
      console.log('🔵 [mongo_updateProfile] Profile data:', profileData);

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
   * Find user by ID
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
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
        message: error.message,
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
        message: error.message,
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
        message: error.message,
      };
    }
  }
}

