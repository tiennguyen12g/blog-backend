import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

// ==================== Enums ====================
export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum BanStatus {
  NONE = 'none',
  RESTRICTED = 'restricted', // Can read but cannot create/write anything
  BANNED = 'banned', // Cannot login at all
}

// ==================== 2FA Schema ====================
class Google2FASchema {
  @Prop({ type: String })
  twoFactorSecret?: string;

  @Prop({ type: String })
  otpauth_url?: string;

  @Prop({ type: Boolean, default: false })
  is2FAVerified?: boolean;
}

class SecureSchema {
  @Prop({ type: Google2FASchema, _id: false })
  google2FA?: Google2FASchema;
}

// ==================== Address Schema ====================
class AddressSchema {
  @Prop({ type: String, trim: true })
  street?: string;

  @Prop({ type: String, trim: true })
  city?: string;

  @Prop({ type: String, trim: true })
  state?: string;

  @Prop({ type: String, trim: true })
  postalCode?: string;

  @Prop({ type: String, trim: true, default: 'Australia' })
  country?: string;
}

// ==================== Social Links Schema ====================
class SocialLinksSchema {
  @Prop({ type: String })
  facebook?: string;

  @Prop({ type: String })
  instagram?: string;

  @Prop({ type: String })
  linkedin?: string;

  @Prop({ type: String })
  twitter?: string;
}

// ==================== Resume Schema ====================
class ResumeSchema {
  @Prop({ type: String, trim: true })
  fullName?: string;

  @Prop({ type: String })
  profilePhoto?: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, trim: true })
  email?: string;

  @Prop({ type: String, trim: true })
  location?: string;

  @Prop({ type: String, trim: true })
  nationality?: string;

  @Prop({ type: String, trim: true })
  education?: string;

  @Prop({ type: String, trim: true })
  educationLocation?: string;

  @Prop({ type: String, trim: true })
  educationGraduation?: string;

  @Prop({ type: String, trim: true })
  visaType?: string;

  @Prop({ type: String, trim: true })
  visaExpiry?: string;

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ type: [Object], default: [] })
  languages?: Array<{
    name: string;
    level: string;
    proficiency: number; // 0-100
  }>;

  @Prop({ type: String, trim: true })
  aboutMe?: string;

  @Prop({ type: [Object], default: [] })
  workExperience?: Array<{
    date: string;
    title: string;
    location: string;
    description?: string;
  }>;

  @Prop({ type: [String], default: [] })
  strengths?: string[];
}

// ==================== Visa Points Schema ====================
class VisaPointsSchema {
  // Age points (0-30 points)
  @Prop({ type: Number, min: 0, max: 30, default: 0 })
  agePoints?: number;

  // English Language points (0-20 points)
  @Prop({ type: Number, min: 0, max: 20, default: 0 })
  englishLanguagePoints?: number;

  // Skilled Employment Experience - Australia (0-20 points)
  @Prop({ type: Number, min: 0, max: 20, default: 0 })
  australiaExperiencePoints?: number;

  // Skilled Employment Experience - Overseas (0-15 points)
  @Prop({ type: Number, min: 0, max: 15, default: 0 })
  overseasExperiencePoints?: number;

  // Qualifications points (0-20 points)
  @Prop({ type: Number, min: 0, max: 20, default: 0 })
  qualificationsPoints?: number;

  // Australian Study Requirement (0 or 5 points)
  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  australianStudyPoints?: number;

  // Specialist Education Qualification (0 or 5 points) - Masters by research or Doctorate from Australian institution with 2+ academic years study
  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  specialistEducationPoints?: number;

  // Study in Regional Australia (0 or 5 points) - Degree/diploma/trade qualification from Australian institution obtained while living and studying in eligible regional area
  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  regionalStudyPoints?: number;

  // Professional Year in Australia (0 or 5 points)
  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  professionalYearPoints?: number;

  // Credentials in Community Language / NAATI (0 or 5 points)
  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  communityLanguagePoints?: number;

  // Partner Skills (0 or 5 or 10 points)
  @Prop({ type: Number, min: 0, max: 10, default: 0 })
  partnerSkillsPoints?: number;

  // State/Territory Nomination - 190 visa (0 or 5 points)
  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  stateNominationPoints190?: number;

  // Regional Sponsorship - 491 visa (0 or 15 points)
  @Prop({ type: Number, min: 0, max: 15, default: 0 })
  regionalSponsorshipPoints491?: number;

  // Calculated total points
  @Prop({ type: Number, default: 0 })
  totalPoints?: number;

  // Breakdown for display
  @Prop({ type: Date })
  lastUpdated?: Date;
}

// ==================== Profile Schema ====================
class ProfileSchema {
  @Prop({ type: String, trim: true })
  firstName?: string;

  @Prop({ type: String, trim: true })
  lastName?: string;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: String, trim: true })
  bio?: string;

  @Prop({ type: String, trim: true })
  phoneNumber?: string;

  @Prop({ 
    type: String, 
    enum: ['male', 'female', 'other', 'prefer-not-to-say'] 
  })
  sex?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ type: AddressSchema, _id: false })
  address?: AddressSchema;

  @Prop({ type: String, trim: true })
  location?: string; // Current location in Australia

  @Prop({ type: [String], default: [] })
  interests?: string[];

  @Prop({ type: SocialLinksSchema, _id: false })
  socialLinks?: SocialLinksSchema;

  @Prop({ type: VisaPointsSchema, _id: false })
  visaPoints?: VisaPointsSchema;

  @Prop({ type: String, default: 'VND', trim: true, uppercase: true })
  currency?: string; // User's preferred currency (e.g., VND, USD, AUD)
}

// ==================== Main User Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'users' // Explicitly set collection name
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  })
  role: UserRole;

  @Prop({ type: ProfileSchema, _id: false })
  profile?: ProfileSchema;

  @Prop({ type: ResumeSchema, _id: false })
  resume?: ResumeSchema;

  @Prop({ type: SecureSchema, _id: false, default: {} })
  secure?: SecureSchema;

  @Prop({ 
    type: String, 
    enum: Object.values(BanStatus), 
    default: BanStatus.NONE 
  })
  isBan?: BanStatus;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  // Email verification fields
  @Prop({ type: Boolean, default: false })
  emailVerified?: boolean;

  @Prop({ type: String })
  emailVerificationToken?: string;

  @Prop({ type: Date })
  emailVerificationTokenExpiry?: Date;

  // Password reset fields
  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetTokenExpiry?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isBan: 1 });
