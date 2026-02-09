import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument, AccountType } from '../account.schema';
import { Account_Type, Account_Create_Type, Account_Update_Type } from '../account.interface';

@Injectable()
export class AccountMongoService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Create a new account
   */
  async create(userId: string, createData: Account_Create_Type): Promise<Account_Type> {
    const newAccount = new this.accountModel({
      ...createData,
      userId,
      balance: createData.balance || 0,
    });

    const savedAccount = await newAccount.save();
    return this.toAccountType(savedAccount);
  }

  /**
   * Find account by ID
   */
  async findById(accountId: string, userId: string): Promise<Account_Type | null> {
    const account = await this.accountModel.findOne({ _id: accountId, userId }).lean();
    if (!account) return null;
    return this.toAccountType(account);
  }

  /**
   * Find all accounts for a user
   * If no accounts exist, creates a default Cash account
   */
  async findByUserId(userId: string): Promise<Account_Type[]> {
    let accounts = await this.accountModel.find({ userId, isActive: true }).lean();
    
    // If no accounts exist, create default Cash account
    if (accounts.length === 0) {
      const defaultCashAccount = new this.accountModel({
        userId,
        name: 'Cash',
        type: AccountType.CASH,
        balance: 0,
        currency: 'AUD',
        description: 'Default cash account',
        isActive: true,
      });
      const savedAccount = await defaultCashAccount.save();
      accounts = [savedAccount.toObject()];
    }
    
    return accounts.map(account => this.toAccountType(account));
  }

  /**
   * Update account
   */
  async update(accountId: string, userId: string, updateData: Account_Update_Type): Promise<Account_Type> {
    const account = await this.accountModel.findOne({ _id: accountId, userId });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    Object.assign(account, updateData);
    const updatedAccount = await account.save();
    return this.toAccountType(updatedAccount);
  }

  /**
   * Delete account (soft delete)
   */
  async delete(accountId: string, userId: string): Promise<boolean> {
    const account = await this.accountModel.findOne({ _id: accountId, userId });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    account.isActive = false;
    await account.save();
    return true;
  }

  /**
   * Update account balance
   */
  async updateBalance(accountId: string, amount: number): Promise<void> {
    await this.accountModel.findByIdAndUpdate(accountId, { 
      $inc: { balance: amount },
      $set: { lastTransactionAt: new Date() }
    });
  }

  /**
   * Convert MongoDB document to Account_Type
   */
  private toAccountType(account: any): Account_Type {
    return {
      _id: account._id?.toString(),
      userId: account.userId?.toString() || account.userId,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      description: account.description,
      isActive: account.isActive,
      lastTransactionAt: account.lastTransactionAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
