import { z } from 'zod';
import { ArticleStatus } from './article.schema';

// ==================== Zod Schemas ====================

/**
 * Create Article Schema
 */
export const Article_Create_Schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Update Article Schema
 */
export const Article_Update_Schema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  publishedAt: z.date().optional(),
});

/**
 * Query Articles Schema (for filtering)
 */
export const Article_Query_Schema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  authorId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  categories: z.string().optional(), // Comma-separated categories
  search: z.string().optional(), // Search in title and content
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'viewCount', 'likeCount']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ==================== TypeScript Types ====================

/**
 * Author Info Type (populated from User)
 */
export type AuthorInfo_Type = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
};

/**
 * Article Type
 */
export type Article_Type = {
  _id?: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId: string;
  author?: AuthorInfo_Type; // Populated author info
  status?: ArticleStatus;
  tags?: string[];
  categories?: string[];
  coverImage?: string;
  images?: string[];
  viewCount?: number;
  likeCount?: number;
  isFeatured?: boolean;
  publishedAt?: Date;
  metadata?: Record<string, any>;
  isActive?: boolean;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create Article Type
 */
export type Article_Create_Type = z.infer<typeof Article_Create_Schema>;

/**
 * Update Article Type
 */
export type Article_Update_Type = z.infer<typeof Article_Update_Schema>;

/**
 * Query Articles Type
 */
export type Article_Query_Type = z.infer<typeof Article_Query_Schema>;

/**
 * Article List Response Type
 */
export interface Article_ListResponse_Type {
  articles: Article_Type[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
