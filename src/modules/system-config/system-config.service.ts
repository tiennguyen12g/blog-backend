import { Injectable } from '@nestjs/common';
import { SystemConfigMongoService } from './services/system-config-mongo.service';
import {
  SystemConfig_Type,
  SystemConfig_Create_Type,
  SystemConfig_Update_Type,
} from './system-config.interface';

@Injectable()
export class SystemConfigService {
  constructor(private readonly configMongoService: SystemConfigMongoService) {}

  async create(createData: SystemConfig_Create_Type, updatedBy?: string): Promise<SystemConfig_Type> {
    return this.configMongoService.create(createData, updatedBy);
  }

  async findByKey(key: string): Promise<SystemConfig_Type | null> {
    return this.configMongoService.findByKey(key);
  }

  async findAll(category?: string, includePrivate: boolean = false): Promise<SystemConfig_Type[]> {
    return this.configMongoService.findAll(category, includePrivate);
  }

  async update(key: string, updateData: SystemConfig_Update_Type, updatedBy?: string): Promise<SystemConfig_Type> {
    return this.configMongoService.update(key, updateData, updatedBy);
  }

  async delete(key: string): Promise<boolean> {
    return this.configMongoService.delete(key);
  }
}
