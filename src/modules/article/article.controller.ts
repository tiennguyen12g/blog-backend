import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt.guard';
import { RestrictedGuard } from '../../auth/restricted.guard';
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { UserRole } from '../user/user.schema';
import { ArticleService } from './article.service';
import { ZodValidationPipe } from '../../validation.pipe';
import { handleRequest } from '../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../global/GlobalResponseData';
import { JwtUserPayload } from '../user/user.interface';
import {
  Article_Type,
  Article_Create_Type,
  Article_Update_Type,
  Article_Query_Type,
  Article_ListResponse_Type,
  Article_Create_Schema,
  Article_Update_Schema,
  Article_Query_Schema,
} from './article.interface';

@Controller('api/v1/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /**
   * Create a new article
   * POST /api/v1/articles
   * Requires authentication + Manager/Admin role + Not restricted
   */
  @Post()
  @UseGuards(JwtAuthGuard, RestrictedGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Article_Create_Schema, action: 'createArticle' }))
    createData: Article_Create_Type,
  ): Promise<ResponseDataOutput<Article_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Article_Type>({
      execute: () => this.articleService.create(req.user.user_id, createData),
      actionName: 'createArticle',
    });
  }

  /**
   * Get article by ID
   * GET /api/v1/articles/:id
   * Public endpoint (but includes isLiked if user is authenticated)
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findById(
    @Request() req: { user?: JwtUserPayload },
    @Param('id') id: string,
  ): Promise<ResponseDataOutput<Article_Type & { isLiked?: boolean } | ResponseDataWhenError>> {
    return handleRequest<Article_Type & { isLiked?: boolean }>({
      execute: async () => {
        const article = await this.articleService.findById(id, req.user?.user_id);
        if (!article) {
          throw new Error('Article not found');
        }
        // Increment view count in background
        this.articleService.incrementViewCount(id).catch(console.error);
        return article;
      },
      actionName: 'getArticle',
    });
  }

  /**
   * Get articles with pagination and filters
   * GET /api/v1/articles
   * Public endpoint
   */
  @Get()
  async findMany(
    @Query(new ZodValidationPipe({ schema: Article_Query_Schema, action: 'getArticles' }))
    query: Article_Query_Type,
  ): Promise<ResponseDataOutput<Article_ListResponse_Type | ResponseDataWhenError>> {
    return handleRequest<Article_ListResponse_Type>({
      execute: () => this.articleService.findMany(query),
      actionName: 'getArticles',
    });
  }

  /**
   * Update article
   * PUT /api/v1/articles/:id
   * Requires authentication (author only or manager/admin) + Not restricted
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RestrictedGuard)
  async update(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Article_Update_Schema, action: 'updateArticle' }))
    updateData: Article_Update_Type,
  ): Promise<ResponseDataOutput<Article_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Article_Type>({
      execute: () => this.articleService.update(id, req.user.user_id, updateData),
      actionName: 'updateArticle',
    });
  }

  /**
   * Delete article
   * DELETE /api/v1/articles/:id
   * Requires authentication (author only or manager/admin) + Not restricted
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RestrictedGuard)
  async delete(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<{ success: boolean; message: string } | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<{ success: boolean; message: string }>({
      execute: async () => {
        await this.articleService.delete(id, req.user.user_id);
        return { success: true, message: 'Article deleted successfully' };
      },
      actionName: 'deleteArticle',
    });
  }

  /**
   * Like article
   * POST /api/v1/articles/:id/like
   * Requires authentication
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async like(
    @Request() req: { user: JwtUserPayload },
    @Param('id') id: string,
  ): Promise<ResponseDataOutput<{ success: boolean; message: string; alreadyLiked?: boolean } | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<{ success: boolean; message: string; alreadyLiked?: boolean }>({
      execute: async () => {
        const result = await this.articleService.toggleLike(id, req.user.user_id);
        return result;
      },
      actionName: 'likeArticle',
    });
  }
}
