import { z } from 'zod';

// ==================== Zod Schemas ====================

/**
 * User Registration Schema
 */
export const User_Register_Schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * User Login Schema
 */
export const User_Login_Schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Change Password Schema
 */
export const User_ChangePassword_Schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

/**
 * User Profile Update Schema
 */
export const User_ProfileUpdate_Schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  phoneNumber: z.string().optional(),
  sex: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  address: z.string().optional(), // Simple string address for blog
  location: z.string().optional(),
  interests: z.array(z.string()).optional(),
  currency: z.string().optional(), // User's preferred currency (e.g., VND, USD, AUD)
  visaPoints: z.object({
    agePoints: z.number().min(0).max(30).optional(),
    englishLanguagePoints: z.number().min(0).max(20).optional(),
    australiaExperiencePoints: z.number().min(0).max(20).optional(),
    overseasExperiencePoints: z.number().min(0).max(15).optional(),
    qualificationsPoints: z.number().min(0).max(20).optional(),
    australianStudyPoints: z.number().min(0).max(5).optional(),
    specialistEducationPoints: z.number().min(0).max(5).optional(),
    regionalStudyPoints: z.number().min(0).max(5).optional(),
    professionalYearPoints: z.number().min(0).max(5).optional(),
    communityLanguagePoints: z.number().min(0).max(5).optional(),
    partnerSkillsPoints: z.number().min(0).max(10).optional(),
    stateNominationPoints190: z.number().min(0).max(5).optional(),
    regionalSponsorshipPoints491: z.number().min(0).max(15).optional(),
    totalPoints: z.number().optional(),
    lastUpdated: z.date().optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * Base User Schema (for validation)
 */
export const User_Schema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.string().optional(),
});

// ==================== TypeScript Types ====================

/**
 * User Registration Type
 */
export type User_Register_Type = z.infer<typeof User_Register_Schema>;

/**
 * User Login Type
 */
export type User_Login_Type = z.infer<typeof User_Login_Schema>;

/**
 * User Profile Update Type
 */
export type User_ProfileUpdate_Type = z.infer<typeof User_ProfileUpdate_Schema>;
export type User_ChangePassword_Type = z.infer<typeof User_ChangePassword_Schema>;

/**
 * JWT Payload Type (what's stored in JWT token)
 */
export type JwtUserPayload = {
  email: string;
  user_id: string;
  role?: string;
};

/**
 * Base User Type
 */
export type User_Type = {
  _id?: string;
  email: string;
  password?: string;
  role?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    phoneNumber?: string;
    sex?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    dateOfBirth?: Date;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    location?: string;
    interests?: string[];
    currency?: string; // User's preferred currency (e.g., VND, USD, AUD)
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      twitter?: string;
    };
    visaPoints?: {
      agePoints?: number;
      englishLanguagePoints?: number;
      australiaExperiencePoints?: number;
      overseasExperiencePoints?: number;
      qualificationsPoints?: number;
      australianStudyPoints?: number;
      specialistEducationPoints?: number;
      regionalStudyPoints?: number;
      professionalYearPoints?: number;
      communityLanguagePoints?: number;
      partnerSkillsPoints?: number;
      stateNominationPoints190?: number;
      regionalSponsorshipPoints491?: number;
      totalPoints?: number;
      lastUpdated?: Date;
    };
  };
  secure?: {
    google2FA?: {
      twoFactorSecret?: string;
      otpauth_url?: string;
      is2FAVerified?: boolean;
    };
  };
  isBan?: 'none' | 'restricted' | 'banned';
  isActive?: boolean;
  lastLoginAt?: Date;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

// ==================== Response Types ====================

/**
 * User Registration Output
 */
export interface User_RegisterOutput_Type {
  message: string;
  status?: 'Success' | 'Failed';
  user?: {
    email: string;
    role: string;
    _id: string;
  };
}

/**
 * User Login Output
 */
export interface User_LoginOutput_Type {
  user: User_Type;
  access_token: string;
  refresh_token: string;
}

/**
 * User Error Output
 */
export interface User_ErrorOutput_Type {
  message: string;
  status: 'Failed';
}

