import { Injectable } from '@nestjs/common';
import { AccountMongoService } from './services/account-mongo.service';
import { Account_Type, Account_Create_Type, Account_Update_Type } from './account.interface';

@Injectable()
export class AccountService {
  constructor(private readonly accountMongoService: AccountMongoService) {}

  async create(userId: string, createData: Account_Create_Type): Promise<Account_Type> {
    return this.accountMongoService.create(userId, createData);
  }

  async findById(accountId: string, userId: string): Promise<Account_Type | null> {
    return this.accountMongoService.findById(accountId, userId);
  }

  async findByUserId(userId: string): Promise<Account_Type[]> {
    return this.accountMongoService.findByUserId(userId);
  }

  async update(accountId: string, userId: string, updateData: Account_Update_Type): Promise<Account_Type> {
    return this.accountMongoService.update(accountId, userId, updateData);
  }

  async delete(accountId: string, userId: string): Promise<boolean> {
    return this.accountMongoService.delete(accountId, userId);
  }

  async updateBalance(accountId: string, amount: number): Promise<void> {
    return this.accountMongoService.updateBalance(accountId, amount);
  }
}
