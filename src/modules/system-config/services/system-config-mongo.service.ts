import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from '../system-config.schema';
import {
  SystemConfig_Type,
  SystemConfig_Create_Type,
  SystemConfig_Update_Type,
} from '../system-config.interface';

@Injectable()
export class SystemConfigMongoService {
  constructor(
    @InjectModel(SystemConfig.name) private configModel: Model<SystemConfigDocument>,
  ) {}

  /**
   * Create a new config
   */
  async create(createData: SystemConfig_Create_Type, updatedBy?: string): Promise<SystemConfig_Type> {
    const newConfig = new this.configModel({
      ...createData,
      updatedBy,
    });

    const savedConfig = await newConfig.save();
    return this.toConfigType(savedConfig);
  }

  /**
   * Find config by key
   */
  async findByKey(key: string): Promise<SystemConfig_Type | null> {
    const config = await this.configModel.findOne({ key }).lean();
    if (!config) return null;
    return this.toConfigType(config);
  }

  /**
   * Find all configs (optionally filtered by category)
   */
  async findAll(category?: string, includePrivate: boolean = false): Promise<SystemConfig_Type[]> {
    const filter: any = {};
    if (category) filter.category = category;
    if (!includePrivate) filter.isPublic = true;

    const configs = await this.configModel.find(filter).lean();
    return configs.map(config => this.toConfigType(config));
  }

  /**
   * Update config
   */
  async update(key: string, updateData: SystemConfig_Update_Type, updatedBy?: string): Promise<SystemConfig_Type> {
    const config = await this.configModel.findOne({ key });
    if (!config) {
      throw new NotFoundException(`Config with key '${key}' not found`);
    }

    Object.assign(config, updateData);
    if (updatedBy) {
      config.updatedBy = updatedBy;
    }

    const updatedConfig = await config.save();
    return this.toConfigType(updatedConfig);
  }

  /**
   * Delete config
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.configModel.deleteOne({ key });
    return result.deletedCount > 0;
  }

  /**
   * Convert MongoDB document to SystemConfig_Type
   */
  private toConfigType(config: any): SystemConfig_Type {
    return {
      _id: config._id?.toString(),
      key: config.key,
      value: config.value,
      type: config.type,
      description: config.description,
      category: config.category,
      isPublic: config.isPublic,
      updatedBy: config.updatedBy?.toString() || config.updatedBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
