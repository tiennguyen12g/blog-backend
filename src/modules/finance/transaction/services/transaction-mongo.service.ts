import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from '../transaction.schema';
import { Account, AccountDocument } from '../../account/account.schema';
import {
  Transaction_Type,
  Transaction_Create_Type,
  Transaction_Update_Type,
  Transaction_Query_Type,
  Transaction_ListResponse_Type,
} from '../transaction.interface';
import { TransactionType } from '../transaction.schema';

@Injectable()
export class TransactionMongoService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Create a new transaction and update account balance
   */
  async create(userId: string, createData: Transaction_Create_Type): Promise<Transaction_Type> {
    // Verify account belongs to user
    const account = await this.accountModel.findOne({ _id: createData.accountId, userId });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const newTransaction = new this.transactionModel({
      ...createData,
      userId,
      date: createData.date || new Date(),
    });

    const savedTransaction = await newTransaction.save();

    // Update account balance
    const balanceChange = createData.type === TransactionType.INCOME 
      ? createData.amount 
      : -createData.amount;
    await this.accountModel.findByIdAndUpdate(createData.accountId, {
      $inc: { balance: balanceChange },
      $set: { lastTransactionAt: savedTransaction.date },
    });

    return this.toTransactionType(savedTransaction);
  }

  /**
   * Find transaction by ID
   */
  async findById(transactionId: string, userId: string): Promise<Transaction_Type | null> {
    const transaction = await this.transactionModel.findOne({ _id: transactionId, userId }).lean();
    if (!transaction) return null;
    return this.toTransactionType(transaction);
  }

  /**
   * Find transactions with pagination and filters
   */
  async findMany(userId: string, query: Transaction_Query_Type): Promise<Transaction_ListResponse_Type> {
    const {
      page = 1,
      limit = 20,
      accountId,
      type,
      incomeCategory,
      expenseCategory,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = { userId };

    if (accountId) filter.accountId = accountId;
    if (type) filter.type = type;
    if (incomeCategory) filter.incomeCategory = incomeCategory;
    if (expenseCategory) filter.expenseCategory = expenseCategory;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.transactionModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      transactions: transactions.map(t => this.toTransactionType(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update transaction and adjust account balance
   */
  async update(
    transactionId: string,
    userId: string,
    updateData: Transaction_Update_Type,
  ): Promise<Transaction_Type> {
    const transaction = await this.transactionModel.findOne({ _id: transactionId, userId });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // If amount or type changed, need to adjust account balance
    const oldAmount = transaction.amount;
    const oldType = transaction.type;
    const oldAccountId = transaction.accountId.toString();
    const newAmount = updateData.amount || oldAmount;
    const newType = updateData.type || oldType;
    const newAccountId = updateData.accountId || oldAccountId;

    // Calculate balance adjustment
    const oldBalanceChange = oldType === TransactionType.INCOME ? oldAmount : -oldAmount;
    const newBalanceChange = newType === TransactionType.INCOME ? newAmount : -newAmount;
    const balanceAdjustment = newBalanceChange - oldBalanceChange;

    // Update transaction
    Object.assign(transaction, updateData);
    const updatedTransaction = await transaction.save();

    // Update account balances
    if (oldAccountId !== newAccountId) {
      // Revert old account
      await this.accountModel.findByIdAndUpdate(oldAccountId, {
        $inc: { balance: -oldBalanceChange },
      });
      // Apply to new account
      await this.accountModel.findByIdAndUpdate(newAccountId, {
        $inc: { balance: newBalanceChange },
        $set: { lastTransactionAt: updatedTransaction.date },
      });
    } else {
      // Same account, just adjust balance
      await this.accountModel.findByIdAndUpdate(newAccountId, {
        $inc: { balance: balanceAdjustment },
        $set: { lastTransactionAt: updatedTransaction.date },
      });
    }

    return this.toTransactionType(updatedTransaction);
  }

  /**
   * Delete transaction and revert account balance
   */
  async delete(transactionId: string, userId: string): Promise<boolean> {
    const transaction = await this.transactionModel.findOne({ _id: transactionId, userId });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Revert account balance
    const balanceChange = transaction.type === TransactionType.INCOME 
      ? -transaction.amount 
      : transaction.amount;
    await this.accountModel.findByIdAndUpdate(transaction.accountId, {
      $inc: { balance: balanceChange },
    });

    await this.transactionModel.findByIdAndDelete(transactionId);
    return true;
  }

  /**
   * Get summary statistics for a user
   */
  async getSummary(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    incomeByCategory: { category: string; amount: number }[];
    expenseByCategory: { category: string; amount: number }[];
  }> {
    const filter: any = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const transactions = await this.transactionModel.find(filter).lean();

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        totalIncome += t.amount;
        if (t.incomeCategory) {
          incomeByCategory[t.incomeCategory] = (incomeByCategory[t.incomeCategory] || 0) + t.amount;
        }
      } else {
        totalExpense += t.amount;
        if (t.expenseCategory) {
          expenseByCategory[t.expenseCategory] = (expenseByCategory[t.expenseCategory] || 0) + t.amount;
        }
      }
    });

    return {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      incomeByCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
      expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  }

  /**
   * Convert MongoDB document to Transaction_Type
   */
  private toTransactionType(transaction: any): Transaction_Type {
    return {
      _id: transaction._id?.toString(),
      userId: transaction.userId?.toString() || transaction.userId,
      accountId: transaction.accountId?.toString() || transaction.accountId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      date: transaction.date,
      incomeCategory: transaction.incomeCategory,
      expenseCategory: transaction.expenseCategory,
      description: transaction.description,
      note: transaction.note,
      location: transaction.location,
      tags: transaction.tags,
      receiptImage: transaction.receiptImage,
      attachments: transaction.attachments,
      isRecurring: transaction.isRecurring,
      recurringPattern: transaction.recurringPattern,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
