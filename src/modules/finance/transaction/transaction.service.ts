import { Injectable } from '@nestjs/common';
import { TransactionMongoService } from './services/transaction-mongo.service';
import {
  Transaction_Type,
  Transaction_Create_Type,
  Transaction_Update_Type,
  Transaction_Query_Type,
  Transaction_ListResponse_Type,
} from './transaction.interface';

@Injectable()
export class TransactionService {
  constructor(private readonly transactionMongoService: TransactionMongoService) {}

  async create(userId: string, createData: Transaction_Create_Type): Promise<Transaction_Type> {
    return this.transactionMongoService.create(userId, createData);
  }

  async findById(transactionId: string, userId: string): Promise<Transaction_Type | null> {
    return this.transactionMongoService.findById(transactionId, userId);
  }

  async findMany(userId: string, query: Transaction_Query_Type): Promise<Transaction_ListResponse_Type> {
    return this.transactionMongoService.findMany(userId, query);
  }

  async update(
    transactionId: string,
    userId: string,
    updateData: Transaction_Update_Type,
  ): Promise<Transaction_Type> {
    return this.transactionMongoService.update(transactionId, userId, updateData);
  }

  async delete(transactionId: string, userId: string): Promise<boolean> {
    return this.transactionMongoService.delete(transactionId, userId);
  }

  async getSummary(userId: string, startDate?: Date, endDate?: Date) {
    return this.transactionMongoService.getSummary(userId, startDate, endDate);
  }
}
