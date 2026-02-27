import { z } from 'zod';
import { TransactionType, IncomeCategory, ExpenseCategory } from './transaction.schema';

// ==================== Zod Schemas ====================

/**
 * Create Transaction Schema
 */
export const Transaction_Create_Schema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('AUD').optional(),
  originalAmount: z.number().positive().optional(),
  originalCurrency: z.string().optional(),
  exchangeRate: z.number().positive().optional(),
  date: z.coerce.date().optional(),
  incomeCategory: z.nativeEnum(IncomeCategory).optional(),
  expenseCategory: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  receiptImage: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    endDate: z.date().optional(),
    nextDueDate: z.date().optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.type === TransactionType.INCOME && !data.incomeCategory) {
      return false;
    }
    if (data.type === TransactionType.EXPENSE && !data.expenseCategory) {
      return false;
    }
    return true;
  },
  {
    message: 'Income category is required for income transactions, expense category is required for expense transactions',
  }
);

/**
 * Update Transaction Schema
 */
export const Transaction_Update_Schema = z.object({
  accountId: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  originalAmount: z.number().positive().optional(),
  originalCurrency: z.string().optional(),
  exchangeRate: z.number().positive().optional(),
  date: z.coerce.date().optional(),
  incomeCategory: z.nativeEnum(IncomeCategory).optional(),
  expenseCategory: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  receiptImage: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    endDate: z.date().optional(),
    nextDueDate: z.date().optional(),
  }).optional(),
});

/**
 * Query Transactions Schema
 */
export const Transaction_Query_Schema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  accountId: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  incomeCategory: z.nativeEnum(IncomeCategory).optional(),
  expenseCategory: z.nativeEnum(ExpenseCategory).optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  search: z.string().optional(), // Search in description, note
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ==================== TypeScript Types ====================

/**
 * Transaction Type
 */
export type Transaction_Type = {
  _id?: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  date: Date;
  incomeCategory?: IncomeCategory;
  expenseCategory?: ExpenseCategory;
  description?: string;
  note?: string;
  location?: string;
  tags?: string[];
  receiptImage?: string;
  attachments?: string[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
    nextDueDate?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create Transaction Type
 */
export type Transaction_Create_Type = z.infer<typeof Transaction_Create_Schema>;

/**
 * Update Transaction Type
 */
export type Transaction_Update_Type = z.infer<typeof Transaction_Update_Schema>;

/**
 * Query Transactions Type
 */
export type Transaction_Query_Type = z.infer<typeof Transaction_Query_Schema>;

/**
 * Transaction List Response Type
 */
export interface Transaction_ListResponse_Type {
  transactions: Transaction_Type[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
