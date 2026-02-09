import { Injectable } from '@nestjs/common';
import { ArticleMongoService } from './services/article-mongo.service';
import {
  Article_Type,
  Article_Create_Type,
  Article_Update_Type,
  Article_Query_Type,
  Article_ListResponse_Type,
} from './article.interface';

@Injectable()
export class ArticleService {
  constructor(private readonly articleMongoService: ArticleMongoService) {}

  /**
   * Create a new article
   */
  async create(authorId: string, createData: Article_Create_Type): Promise<Article_Type> {
    return this.articleMongoService.create(authorId, createData);
  }

  /**
   * Get article by ID
   */
  async findById(articleId: string): Promise<Article_Type | null> {
    return this.articleMongoService.findById(articleId);
  }

  /**
   * Get articles with pagination and filters
   */
  async findMany(query: Article_Query_Type): Promise<Article_ListResponse_Type> {
    return this.articleMongoService.findMany(query);
  }

  /**
   * Update article
   */
  async update(
    articleId: string,
    authorId: string,
    updateData: Article_Update_Type,
  ): Promise<Article_Type> {
    return this.articleMongoService.update(articleId, authorId, updateData);
  }

  /**
   * Delete article
   */
  async delete(articleId: string, authorId: string): Promise<boolean> {
    return this.articleMongoService.delete(articleId, authorId);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(articleId: string): Promise<void> {
    return this.articleMongoService.incrementViewCount(articleId);
  }

  /**
   * Increment like count
   */
  async incrementLikeCount(articleId: string): Promise<void> {
    return this.articleMongoService.incrementLikeCount(articleId);
  }
}
