import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

// ==================== Account Type Enum ====================
export enum AccountType {
  CASH = 'cash',
  BANK_ACCOUNT = 'bank_account',
  CRYPTO_WALLET = 'crypto_wallet',
}

// ==================== Main Account Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'accounts' // Explicitly set collection name
})
export class Account {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string; // Reference to User _id

  @Prop({ type: String, required: true, trim: true })
  name: string; // e.g., "Main Bank Account", "Cash Wallet"

  @Prop({ 
    type: String, 
    enum: Object.values(AccountType), 
    required: true 
  })
  type: AccountType;

  @Prop({ type: Number, default: 0 })
  balance: number; // Current balance in AUD

  @Prop({ type: String, default: 'AUD' })
  currency: string; // Default to AUD

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: Date })
  lastTransactionAt?: Date; // Last transaction date for this account
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Create indexes for better query performance
AccountSchema.index({ userId: 1 });
AccountSchema.index({ type: 1 });
AccountSchema.index({ userId: 1, type: 1 }); // Compound index
