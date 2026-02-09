import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RestrictedGuard } from '../../../auth/restricted.guard';
import { TransactionService } from './transaction.service';
import { ZodValidationPipe } from '../../../validation.pipe';
import { handleRequest } from '../../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../../global/GlobalResponseData';
import { JwtUserPayload } from '../../user/user.interface';
import {
  Transaction_Type,
  Transaction_Create_Type,
  Transaction_Update_Type,
  Transaction_Query_Type,
  Transaction_ListResponse_Type,
  Transaction_Create_Schema,
  Transaction_Update_Schema,
  Transaction_Query_Schema,
} from './transaction.interface';

@Controller('api/v1/finance/transactions')
@UseGuards(JwtAuthGuard, RestrictedGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Create a new transaction
   */
  @Post()
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Transaction_Create_Schema, action: 'createTransaction' }))
    createData: Transaction_Create_Type,
  ): Promise<ResponseDataOutput<Transaction_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Transaction_Type>({
      execute: () => this.transactionService.create(req.user.user_id, createData),
      actionName: 'createTransaction',
    });
  }

  /**
   * Get transactions with pagination and filters
   */
  @Get()
  async findMany(
    @Request() req: { user: JwtUserPayload },
    @Query(new ZodValidationPipe({ schema: Transaction_Query_Schema, action: 'getTransactions' }))
    query: Transaction_Query_Type,
  ): Promise<ResponseDataOutput<Transaction_ListResponse_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Transaction_ListResponse_Type>({
      execute: () => this.transactionService.findMany(req.user.user_id, query),
      actionName: 'getTransactions',
    });
  }

  /**
   * Get transaction by ID
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<Transaction_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Transaction_Type>({
      execute: async () => {
        const transaction = await this.transactionService.findById(id, req.user.user_id);
        if (!transaction) {
          throw new Error('Transaction not found');
        }
        return transaction;
      },
      actionName: 'getTransaction',
    });
  }

  /**
   * Update transaction
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Transaction_Update_Schema, action: 'updateTransaction' }))
    updateData: Transaction_Update_Type,
  ): Promise<ResponseDataOutput<Transaction_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Transaction_Type>({
      execute: () => this.transactionService.update(id, req.user.user_id, updateData),
      actionName: 'updateTransaction',
    });
  }

  /**
   * Delete transaction
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<{ success: boolean; message: string } | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<{ success: boolean; message: string }>({
      execute: async () => {
        await this.transactionService.delete(id, req.user.user_id);
        return { success: true, message: 'Transaction deleted successfully' };
      },
      actionName: 'deleteTransaction',
    });
  }
}
