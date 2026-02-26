import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArticleDocument = Article & Document;

// ==================== Article Status Enum ====================
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// ==================== Main Article Schema ====================
@Schema({ 
  timestamps: true,
  collection: 'articles' // Explicitly set collection name
})
export class Article {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string; // HTML content from Quill editor

  @Prop({ type: String, trim: true })
  excerpt?: string; // Short description/summary

  @Prop({ type: String, ref: 'User', required: true })
  authorId: string; // Reference to User _id

  @Prop({ 
    type: String, 
    enum: Object.values(ArticleStatus), 
    default: ArticleStatus.DRAFT 
  })
  status: ArticleStatus;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: [String], default: [] })
  categories?: string[];

  @Prop({ type: String })
  coverImage?: string; // URL to cover image

  @Prop({ type: [String], default: [] })
  images?: string[]; // Array of image URLs

  @Prop({ type: Number, default: 0 })
  viewCount?: number;

  @Prop({ type: Number, default: 0 })
  likeCount?: number;

  @Prop({ type: [String], default: [] })
  likedBy?: string[]; // Array of user IDs who liked this article

  @Prop({ type: Boolean, default: false })
  isFeatured?: boolean;

  @Prop({ type: Date })
  publishedAt?: Date; // When article was published

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional metadata (SEO, reading time, etc.)

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: Boolean, default: true })
  isPublic?: boolean; // Public (visible to all) or Private (only author can see)
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

// Create indexes for better query performance
ArticleSchema.index({ authorId: 1 });
ArticleSchema.index({ status: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ categories: 1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' }); // Text search index
