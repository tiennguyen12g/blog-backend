import { Injectable } from '@nestjs/common';
import { MemoryMongoService } from './services/memory-mongo.service';
import {
  Memory_Type,
  Memory_Create_Type,
  Memory_Update_Type,
  Memory_Query_Type,
  Memory_ListResponse_Type,
} from './memory.interface';

@Injectable()
export class MemoryService {
  constructor(private readonly memoryMongoService: MemoryMongoService) {}

  async create(userId: string, createData: Memory_Create_Type): Promise<Memory_Type> {
    return this.memoryMongoService.create(userId, createData);
  }

  async findById(memoryId: string, userId: string): Promise<Memory_Type | null> {
    return this.memoryMongoService.findById(memoryId, userId);
  }

  async findMany(userId: string, query: Memory_Query_Type, includePublic: boolean = false): Promise<Memory_ListResponse_Type> {
    return this.memoryMongoService.findMany(userId, query, includePublic);
  }

  async update(memoryId: string, userId: string, updateData: Memory_Update_Type): Promise<Memory_Type> {
    return this.memoryMongoService.update(memoryId, userId, updateData);
  }

  async delete(memoryId: string, userId: string): Promise<boolean> {
    return this.memoryMongoService.delete(memoryId, userId);
  }
}
