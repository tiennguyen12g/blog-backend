import { z } from 'zod';
import { PropertyType, PropertyUnit } from './property.schema';

// ==================== Zod Schemas ====================

/**
 * Create Property Schema
 */
export const Property_Create_Schema = z.object({
  name: z.string().min(1, 'Property name is required').max(200, 'Property name is too long'),
  type: z.nativeEnum(PropertyType),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  currency: z.string().default('AUD').optional(),
  purchaseDate: z.coerce.date().optional(),
  quantity: z.number().min(0).default(1).optional(),
  unit: z.nativeEnum(PropertyUnit).default(PropertyUnit.PIECE).optional(),
  currentValue: z.number().min(0).optional(), // Manual estimate for car/house
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
});

/**
 * Update Property Schema
 */
export const Property_Update_Schema = z.object({
  name: z.string().min(1).max(200).optional(),
  purchasePrice: z.number().positive('Purchase price must be positive').optional(),
  quantity: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Query Properties Schema
 */
export const Property_Query_Schema = z.object({
  type: z.nativeEnum(PropertyType).optional(),
  isActive: z.boolean().optional(),
});

// ==================== TypeScript Types ====================

/**
 * Property Type
 */
export type Property_Type = {
  _id?: string;
  userId: string;
  name: string;
  type: PropertyType;
  purchasePrice: number;
  currency: string;
  purchaseDate: Date;
  quantity: number;
  unit: PropertyUnit;
  currentValue?: number;
  description?: string;
  location?: string;
  isActive?: boolean;
  lastPriceUpdate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Property with calculated values (for frontend display)
 */
export type Property_WithCalculations_Type = Property_Type & {
  estimatedValue?: number; // Current estimated value (from API or manual)
  profitLoss?: number; // estimatedValue - purchasePrice
  profitLossPercentage?: number; // (profitLoss / purchasePrice) * 100
};

/**
 * Create Property Type
 */
export type Property_Create_Type = z.infer<typeof Property_Create_Schema>;

/**
 * Update Property Type
 */
export type Property_Update_Type = z.infer<typeof Property_Update_Schema>;

/**
 * Query Properties Type
 */
export type Property_Query_Type = z.infer<typeof Property_Query_Schema>;
