import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MemoryDocument = Memory & Document;

// ==================== Main Memory Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'memories' // Explicitly set collection name
})
export class Memory {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string; // Reference to User _id

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  images: string[]; // Array of image URLs

  @Prop({ type: String, trim: true })
  location?: string; // Where the memory was created

  @Prop({ type: Date, required: true, default: Date.now })
  date: Date; // When the memory occurred

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Boolean, default: false })
  isPublic?: boolean; // Public (visible to all) or Private (only user can see)

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;
}

export const MemorySchema = SchemaFactory.createForClass(Memory);

// Create indexes for better query performance
MemorySchema.index({ userId: 1 });
MemorySchema.index({ date: -1 });
MemorySchema.index({ tags: 1 });
MemorySchema.index({ isPublic: 1 });
