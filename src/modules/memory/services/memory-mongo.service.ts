import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Memory, MemoryDocument } from '../memory.schema';
import {
  Memory_Type,
  Memory_Create_Type,
  Memory_Update_Type,
  Memory_Query_Type,
  Memory_ListResponse_Type,
} from '../memory.interface';

@Injectable()
export class MemoryMongoService {
  constructor(
    @InjectModel(Memory.name) private memoryModel: Model<MemoryDocument>,
  ) {}

  /**
   * Create a new memory
   */
  async create(userId: string, createData: Memory_Create_Type): Promise<Memory_Type> {
    const newMemory = new this.memoryModel({
      ...createData,
      userId,
      date: createData.date || new Date(),
    });

    const savedMemory = await newMemory.save();
    return this.toMemoryType(savedMemory);
  }

  /**
   * Find memory by ID
   */
  async findById(memoryId: string, userId: string): Promise<Memory_Type | null> {
    const memory = await this.memoryModel.findOne({ _id: memoryId, userId }).lean();
    if (!memory) return null;
    return this.toMemoryType(memory);
  }

  /**
   * Find memories with pagination and filters
   */
  async findMany(userId: string, query: Memory_Query_Type, includePublic: boolean = false): Promise<Memory_ListResponse_Type> {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      tags,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = { isActive: true };
    
    if (includePublic) {
      // Include public memories from all users
      filter.$or = [
        { userId },
        { isPublic: true },
      ];
    } else {
      // Only user's own memories
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const [memories, total] = await Promise.all([
      this.memoryModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.memoryModel.countDocuments(filter),
    ]);

    return {
      memories: memories.map(m => this.toMemoryType(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update memory
   */
  async update(
    memoryId: string,
    userId: string,
    updateData: Memory_Update_Type,
  ): Promise<Memory_Type> {
    const memory = await this.memoryModel.findOne({ _id: memoryId, userId });
    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    Object.assign(memory, updateData);
    const updatedMemory = await memory.save();
    return this.toMemoryType(updatedMemory);
  }

  /**
   * Delete memory (soft delete)
   */
  async delete(memoryId: string, userId: string): Promise<boolean> {
    const memory = await this.memoryModel.findOne({ _id: memoryId, userId });
    if (!memory) {
      throw new NotFoundException('Memory not found');
    }

    memory.isActive = false;
    await memory.save();
    return true;
  }

  /**
   * Convert MongoDB document to Memory_Type
   */
  private toMemoryType(memory: any): Memory_Type {
    return {
      _id: memory._id?.toString(),
      userId: memory.userId?.toString() || memory.userId,
      title: memory.title,
      description: memory.description,
      images: memory.images,
      location: memory.location,
      date: memory.date,
      tags: memory.tags,
      isPublic: memory.isPublic,
      isActive: memory.isActive,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    };
  }
}
