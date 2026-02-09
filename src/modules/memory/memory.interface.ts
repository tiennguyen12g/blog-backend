import { z } from 'zod';

// ==================== Zod Schemas ====================

/**
 * Create Memory Schema
 */
export const Memory_Create_Schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000).optional(),
  images: z.array(z.string()).default([]).optional(),
  location: z.string().max(200).optional(),
  date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Update Memory Schema
 */
export const Memory_Update_Schema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  images: z.array(z.string()).optional(),
  location: z.string().max(200).optional(),
  date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Query Memories Schema
 */
export const Memory_Query_Schema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  search: z.string().optional(),
  sortBy: z.enum(['date', 'createdAt']).default('date').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ==================== TypeScript Types ====================

/**
 * Memory Type
 */
export type Memory_Type = {
  _id?: string;
  userId: string;
  title: string;
  description?: string;
  images?: string[];
  location?: string;
  date: Date;
  tags?: string[];
  isPublic?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create Memory Type
 */
export type Memory_Create_Type = z.infer<typeof Memory_Create_Schema>;

/**
 * Update Memory Type
 */
export type Memory_Update_Type = z.infer<typeof Memory_Update_Schema>;

/**
 * Query Memories Type
 */
export type Memory_Query_Type = z.infer<typeof Memory_Query_Schema>;

/**
 * Memory List Response Type
 */
export interface Memory_ListResponse_Type {
  memories: Memory_Type[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
