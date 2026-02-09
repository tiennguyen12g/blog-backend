import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

// ==================== Config Type Enum ====================
export enum ConfigType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
}

// ==================== Main System Config Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'system_configs' // Explicitly set collection name
})
export class SystemConfig {
  @Prop({ type: String, required: true, unique: true, trim: true })
  key: string; // Unique config key

  @Prop({ type: SchemaTypes.Mixed, required: true })
  value: any; // Config value (can be any type)

  @Prop({ 
    type: String, 
    enum: Object.values(ConfigType), 
    required: true 
  })
  type: ConfigType; // Type of the value

  @Prop({ type: String, trim: true })
  description?: string; // Description of what this config does

  @Prop({ type: String, trim: true })
  category?: string; // e.g., 'general', 'finance', 'blog'

  @Prop({ type: Boolean, default: false })
  isPublic?: boolean; // Whether this config can be accessed without auth

  @Prop({ type: String, ref: 'User' })
  updatedBy?: string; // User who last updated this config
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);

// Create indexes for better query performance
SystemConfigSchema.index({ key: 1 }, { unique: true });
SystemConfigSchema.index({ category: 1 });
SystemConfigSchema.index({ isPublic: 1 });
