import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

// ==================== Transaction Type Enum ====================
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// ==================== Income Category Enum ====================
export enum IncomeCategory {
  FARM_JOB = 'farm_job',
  UBER = 'uber',
  CASUAL_JOB = 'casual_job',
  PARTTIME_JOB = 'parttime_job',
  FULLTIME_JOB = 'fulltime_job',
  STOCK = 'stock',
  CRYPTO = 'crypto',
  FREELANCE = 'freelance',
  OTHER_INCOME = 'other_income',
}

// ==================== Expense Category Enum ====================
export enum ExpenseCategory {
  RENT = 'rent',
  FOOD = 'food',
  CAR = 'car',
  TRANSPORTATION = 'transportation',
  MEDICAL_CARE = 'medical_care',
  EDUCATION = 'education',
  ELECTRIC_BILL = 'electric_bill',
  WATER_BILL = 'water_bill',
  INTERNET_BILL = 'internet_bill',
  PHONE_BILL = 'phone_bill',
  INSURANCE = 'insurance',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  TAX = 'tax',
  HOBBIES = 'hobbies',
  PERSONAL_CARE = 'personal_care',
  CLOTHING = 'clothing',
  SPORTS = 'sports',
  BEAUTY = 'beauty',
  ALCOHOL = 'alcohol',
  TRAVEL = 'travel',
  REPAIR = 'repair',
  GIFT = 'gift',
  DONATE = 'donate',
  LOTTERY = 'lottery',
  OTHER_EXPENSE = 'other_expense',
}

// ==================== Recurring Pattern Schema ====================
class RecurringPatternSchema {
  @Prop({ 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true 
  })
  frequency: string;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Date })
  nextDueDate?: Date;
}

// ==================== Main Transaction Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'transactions' // Explicitly set collection name
})
export class Transaction {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string; // Reference to User _id

  @Prop({ type: String, ref: 'Account', required: true })
  accountId: string; // Reference to Account _id

  @Prop({ 
    type: String, 
    enum: Object.values(TransactionType), 
    required: true 
  })
  type: TransactionType;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number; // Always positive, type determines if income or expense

  @Prop({ type: String, default: 'AUD' })
  currency: string; // Default to AUD

  /**
   * Optional original amount & currency information.
   * Example:
   * - amount (base): 20 AUD
   * - originalAmount: 220000
   * - originalCurrency: 'VND'
   * - exchangeRate: 0.0000909 (1 VND → AUD)
   *
   * These fields are used only for display & audit; all balance calculations
   * continue to use `amount` in the account/base currency.
   */
  @Prop({ type: Number })
  originalAmount?: number;

  @Prop({ type: String })
  originalCurrency?: string;

  @Prop({ type: Number })
  exchangeRate?: number;

  @Prop({ type: Date, required: true, default: Date.now })
  date: Date; // Transaction date

  @Prop({ 
    type: String, 
    enum: Object.values(IncomeCategory) 
  })
  incomeCategory?: IncomeCategory;

  @Prop({ 
    type: String, 
    enum: Object.values(ExpenseCategory) 
  })
  expenseCategory?: ExpenseCategory;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: String, trim: true })
  location?: string; // Where the transaction occurred

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: String })
  receiptImage?: string; // URL to uploaded receipt

  @Prop({ type: [String], default: [] })
  attachments?: string[]; // Array of file URLs

  @Prop({ type: Boolean, default: false })
  isRecurring?: boolean;

  @Prop({ type: RecurringPatternSchema, _id: false })
  recurringPattern?: RecurringPatternSchema;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Create indexes for better query performance
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ accountId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ incomeCategory: 1 });
TransactionSchema.index({ expenseCategory: 1 });
TransactionSchema.index({ userId: 1, date: -1 }); // Compound index for user transactions by date
TransactionSchema.index({ userId: 1, type: 1, date: -1 }); // Compound index for filtering
