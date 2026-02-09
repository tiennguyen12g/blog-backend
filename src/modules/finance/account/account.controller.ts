import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RestrictedGuard } from '../../../auth/restricted.guard';
import { AccountService } from './account.service';
import { ZodValidationPipe } from '../../../validation.pipe';
import { handleRequest } from '../../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../../global/GlobalResponseData';
import { JwtUserPayload } from '../../user/user.interface';
import {
  Account_Type,
  Account_Create_Type,
  Account_Update_Type,
  Account_Create_Schema,
  Account_Update_Schema,
} from './account.interface';

@Controller('api/v1/finance/accounts')
@UseGuards(JwtAuthGuard, RestrictedGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * Create a new account
   */
  @Post()
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Account_Create_Schema, action: 'createAccount' }))
    createData: Account_Create_Type,
  ): Promise<ResponseDataOutput<Account_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Account_Type>({
      execute: () => this.accountService.create(req.user.user_id, createData),
      actionName: 'createAccount',
    });
  }

  /**
   * Get all accounts for the current user
   */
  @Get()
  async findAll(
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<Account_Type[] | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Account_Type[]>({
      execute: () => this.accountService.findByUserId(req.user.user_id),
      actionName: 'getAccounts',
    });
  }

  /**
   * Get account by ID
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<Account_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Account_Type>({
      execute: async () => {
        const account = await this.accountService.findById(id, req.user.user_id);
        if (!account) {
          throw new Error('Account not found');
        }
        return account;
      },
      actionName: 'getAccount',
    });
  }

  /**
   * Update account
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Account_Update_Schema, action: 'updateAccount' }))
    updateData: Account_Update_Type,
  ): Promise<ResponseDataOutput<Account_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Account_Type>({
      execute: () => this.accountService.update(id, req.user.user_id, updateData),
      actionName: 'updateAccount',
    });
  }

  /**
   * Delete account
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
        await this.accountService.delete(id, req.user.user_id);
        return { success: true, message: 'Account deleted successfully' };
      },
      actionName: 'deleteAccount',
    });
  }
}
