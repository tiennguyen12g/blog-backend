import { z } from 'zod';
import { NoteType, Priority } from './note.schema';

// ==================== Zod Schemas ====================

/**
 * Create Note Schema
 */
export const Note_Create_Schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  type: z.nativeEnum(NoteType).default(NoteType.OTHER),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCompleted: z.boolean().default(false).optional(),
  result: z.string().max(2000, 'Result must be less than 2000 characters').optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM).optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().default(false).optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    endDate: z.coerce.date().optional(),
    nextOccurrence: z.coerce.date().optional(),
  }).optional(),
  location: z.string().max(200).optional(),
  attachments: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // If endDate is provided, it should be after or equal to date
    if (data.endDate && data.date && data.endDate < data.date) {
      return false;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
  }
);

/**
 * Update Note Schema
 */
export const Note_Update_Schema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(NoteType).optional(),
  date: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCompleted: z.boolean().optional(),
  completedAt: z.coerce.date().optional(),
  result: z.string().max(2000).optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    endDate: z.coerce.date().optional(),
    nextOccurrence: z.coerce.date().optional(),
  }).optional(),
  location: z.string().max(200).optional(),
  attachments: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // If both dates are provided, endDate should be after or equal to date
    if (data.endDate && data.date && data.endDate < data.date) {
      return false;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
  }
);

/**
 * Query Notes Schema
 */
export const Note_Query_Schema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  type: z.nativeEnum(NoteType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  isCompleted: z.coerce.boolean().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  month: z.coerce.number().min(1).max(12).optional(), // Filter by month (1-12)
  year: z.coerce.number().min(2000).max(2100).optional(), // Filter by year
  search: z.string().optional(), // Search in title, description, result
  sortBy: z.enum(['date', 'priority', 'createdAt', 'title']).default('date').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  includeRecurring: z.coerce.boolean().default(true).optional(), // Include recurring events
});

// ==================== TypeScript Types ====================

/**
 * Note Type
 */
export type Note_Type = {
  _id?: string;
  title: string;
  description?: string;
  type: NoteType;
  date: Date;
  endDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  result?: string;
  priority: Priority;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
    nextOccurrence?: Date;
  };
  location?: string;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create Note Type
 */
export type Note_Create_Type = z.infer<typeof Note_Create_Schema>;

/**
 * Update Note Type
 */
export type Note_Update_Type = z.infer<typeof Note_Update_Schema>;

/**
 * Query Notes Type
 */
export type Note_Query_Type = z.infer<typeof Note_Query_Schema>;

/**
 * Note List Response Type
 */
export interface Note_ListResponse_Type {
  notes: Note_Type[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Calendar View Response Type (events grouped by date)
 */
export interface Note_CalendarResponse_Type {
  [date: string]: Note_Type[]; // Key is date string (YYYY-MM-DD), value is array of notes
}
