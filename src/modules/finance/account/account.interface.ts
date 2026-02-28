import { z } from 'zod';
import { AccountType } from './account.schema';

// ==================== Zod Schemas ====================

/**
 * Create Account Schema
 */
export const Account_Create_Schema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Account name is too long'),
  type: z.nativeEnum(AccountType),
  balance: z.number().default(0).optional(),
  currency: z.string().default('AUD').optional(),
  description: z.string().max(500).optional(),
});

/**
 * Update Account Schema
 */
export const Account_Update_Schema = z.object({
  name: z.string().min(1).max(100).optional(),
  balance: z.number().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

// ==================== TypeScript Types ====================

/**
 * Account Type
 */
export type Account_Type = {
  _id?: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  description?: string;
  isActive?: boolean;
  lastTransactionAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create Account Type
 */
export type Account_Create_Type = z.infer<typeof Account_Create_Schema>;

/**
 * Update Account Type
 */
export type Account_Update_Type = z.infer<typeof Account_Update_Schema>;
