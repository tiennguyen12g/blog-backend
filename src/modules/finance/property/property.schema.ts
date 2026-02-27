import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

// ==================== Property Type Enum ====================
export enum PropertyType {
  GOLD = 'gold',
  SILVER = 'silver',
  CAR = 'car',
  HOUSE = 'house',
  STOCK = 'stock',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

// ==================== Unit Type Enum (for gold/silver) ====================
export enum PropertyUnit {
  GRAM = 'gram',
  OUNCE = 'ounce',
  KILOGRAM = 'kilogram',
  PIECE = 'piece', // For cars, houses, etc.
}

// ==================== Main Property Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'properties' // Explicitly set collection name
})
export class Property {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string; // Reference to User _id

  @Prop({ type: String, required: true, trim: true })
  name: string; // e.g., "Gold Bar 1kg", "Toyota Camry 2020", "House in Melbourne"

  @Prop({ 
    type: String, 
    enum: Object.values(PropertyType), 
    required: true 
  })
  type: PropertyType;

  @Prop({ type: Number, required: true, min: 0 })
  purchasePrice: number; // Cost when purchased

  @Prop({ type: String, default: 'AUD' })
  currency: string; // Currency of purchase price

  @Prop({ type: Date, required: true, default: Date.now })
  purchaseDate: Date; // When purchased

  @Prop({ type: Number, default: 1, min: 0 })
  quantity: number; // Quantity (for gold/silver: weight, for car/house: usually 1)

  @Prop({ 
    type: String, 
    enum: Object.values(PropertyUnit),
    default: PropertyUnit.PIECE 
  })
  unit: PropertyUnit; // Unit of measurement

  @Prop({ type: Number, min: 0 })
  currentValue?: number; // Manual estimate value (for car, house, etc.)

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, trim: true })
  location?: string; // Location of property (for house, car, etc.)

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: Date })
  lastPriceUpdate?: Date; // Last time price was fetched (for gold/silver)
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Create indexes for better query performance
PropertySchema.index({ userId: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ userId: 1, type: 1 }); // Compound index
PropertySchema.index({ userId: 1, isActive: 1 }); // Compound index for active properties
