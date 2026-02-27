import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NoteDocument = Note & Document;

// ==================== Note Type Enum ====================
export enum NoteType {
  WORK = 'work',
  TASK = 'task',
  EVENT = 'event',
  FLIGHT = 'flight',
  BILL = 'bill',
  REMINDER = 'reminder',
  OTHER = 'other',
}

// ==================== Priority Enum ====================
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// ==================== Recurring Pattern Schema ====================
class RecurringPatternSchema {
  @Prop({ 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true 
  })
  frequency: string;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Date })
  nextOccurrence?: Date; // Next occurrence date for recurring events
}

// ==================== Main Note Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'notes' // Explicitly set collection name
})
export class Note {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string; // Reference to User _id - notes are user-specific

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ 
    type: String, 
    enum: Object.values(NoteType), 
    required: true,
    default: NoteType.OTHER
  })
  type: NoteType;

  @Prop({ type: Date, required: true })
  date: Date; // Start date

  @Prop({ type: Date })
  endDate?: Date; // Optional end date for multi-day events

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: Date })
  completedAt?: Date; // When the note was marked as completed

  @Prop({ type: String, trim: true })
  result?: string; // Text field for outcome/notes after completion

  @Prop({ 
    type: String, 
    enum: Object.values(Priority),
    default: Priority.MEDIUM
  })
  priority: Priority;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Boolean, default: false })
  isRecurring?: boolean;

  @Prop({ type: RecurringPatternSchema, _id: false })
  recurringPattern?: RecurringPatternSchema;

  @Prop({ type: String })
  location?: string; // Optional location for events

  @Prop({ type: [String], default: [] })
  attachments?: string[]; // Array of file URLs
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Create indexes for better query performance
NoteSchema.index({ userId: 1 }); // Index for user-specific queries (most important)
NoteSchema.index({ userId: 1, date: -1 }); // Compound index for user + date queries
NoteSchema.index({ userId: 1, type: 1 }); // Compound index for user + type queries
NoteSchema.index({ date: -1 });
NoteSchema.index({ endDate: -1 });
NoteSchema.index({ type: 1 });
NoteSchema.index({ isCompleted: 1 });
NoteSchema.index({ priority: 1 });
NoteSchema.index({ isRecurring: 1 });
NoteSchema.index({ date: 1, endDate: 1 }); // Compound index for date range queries
NoteSchema.index({ createdAt: -1 }); // For sorting by creation date
