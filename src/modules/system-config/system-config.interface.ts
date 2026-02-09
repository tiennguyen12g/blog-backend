import { z } from 'zod';
import { ConfigType } from './system-config.schema';

// ==================== Zod Schemas ====================

/**
 * Create System Config Schema
 */
export const SystemConfig_Create_Schema = z.object({
  key: z.string().min(1, 'Key is required').max(100, 'Key is too long'),
  value: z.any(), // Can be any type
  type: z.nativeEnum(ConfigType),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Update System Config Schema
 */
export const SystemConfig_Update_Schema = z.object({
  value: z.any().optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  isPublic: z.boolean().optional(),
});

// ==================== TypeScript Types ====================

/**
 * System Config Type
 */
export type SystemConfig_Type = {
  _id?: string;
  key: string;
  value: any;
  type: ConfigType;
  description?: string;
  category?: string;
  isPublic?: boolean;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create System Config Type
 */
export type SystemConfig_Create_Type = z.infer<typeof SystemConfig_Create_Schema>;

/**
 * Update System Config Type
 */
export type SystemConfig_Update_Type = z.infer<typeof SystemConfig_Update_Schema>;
