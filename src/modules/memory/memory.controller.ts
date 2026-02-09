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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RestrictedGuard } from '../../auth/restricted.guard';
import { MemoryService } from './memory.service';
import { ZodValidationPipe } from '../../validation.pipe';
import { handleRequest } from '../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../global/GlobalResponseData';
import { JwtUserPayload } from '../user/user.interface';
import {
  Memory_Type,
  Memory_Create_Type,
  Memory_Update_Type,
  Memory_Query_Type,
  Memory_ListResponse_Type,
  Memory_Create_Schema,
  Memory_Update_Schema,
  Memory_Query_Schema,
} from './memory.interface';

@Controller('api/v1/memories')
@UseGuards(JwtAuthGuard, RestrictedGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  /**
   * Create a new memory
   */
  @Post()
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Memory_Create_Schema, action: 'createMemory' }))
    createData: Memory_Create_Type,
  ): Promise<ResponseDataOutput<Memory_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Memory_Type>({
      execute: () => this.memoryService.create(req.user.user_id, createData),
      actionName: 'createMemory',
    });
  }

  /**
   * Get memories with pagination and filters
   */
  @Get()
  async findMany(
    @Request() req: { user: JwtUserPayload },
    @Query(new ZodValidationPipe({ schema: Memory_Query_Schema, action: 'getMemories' }))
    query: Memory_Query_Type,
    @Query('includePublic') includePublic?: string,
  ): Promise<ResponseDataOutput<Memory_ListResponse_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Memory_ListResponse_Type>({
      execute: () => this.memoryService.findMany(req.user.user_id, query, includePublic === 'true'),
      actionName: 'getMemories',
    });
  }

  /**
   * Get memory by ID
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<Memory_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Memory_Type>({
      execute: async () => {
        const memory = await this.memoryService.findById(id, req.user.user_id);
        if (!memory) {
          throw new Error('Memory not found');
        }
        return memory;
      },
      actionName: 'getMemory',
    });
  }

  /**
   * Update memory
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Memory_Update_Schema, action: 'updateMemory' }))
    updateData: Memory_Update_Type,
  ): Promise<ResponseDataOutput<Memory_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Memory_Type>({
      execute: () => this.memoryService.update(id, req.user.user_id, updateData),
      actionName: 'updateMemory',
    });
  }

  /**
   * Delete memory
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
        await this.memoryService.delete(id, req.user.user_id);
        return { success: true, message: 'Memory deleted successfully' };
      },
      actionName: 'deleteMemory',
    });
  }
}
