import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from '../article.schema';
import { User, UserDocument } from '../../user/user.schema';
import {
  Article_Type,
  Article_Create_Type,
  Article_Update_Type,
  Article_Query_Type,
  Article_ListResponse_Type,
  AuthorInfo_Type,
} from '../article.interface';
import { ArticleStatus } from '../article.schema';

@Injectable()
export class ArticleMongoService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new article
   */
  async create(authorId: string, createData: Article_Create_Type): Promise<Article_Type> {
    const newArticle = new this.articleModel({
      ...createData,
      authorId,
      status: createData.status || ArticleStatus.DRAFT,
      publishedAt: createData.status === ArticleStatus.PUBLISHED ? new Date() : undefined,
    });

    const savedArticle = await newArticle.save();
    return this.toArticleType(savedArticle);
  }

  /**
   * Find article by ID with author info
   */
  async findById(articleId: string): Promise<Article_Type | null> {
    const article = await this.articleModel.findById(articleId).lean();
    if (!article) return null;
    return this.toArticleTypeWithAuthor(article);
  }

  /**
   * Find articles with pagination and filters
   */
  async findMany(query: Article_Query_Type): Promise<Article_ListResponse_Type> {
    const {
      page = 1,
      limit = 10,
      status,
      authorId,
      tags,
      categories,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = { isActive: true };
    
    // If no authorId specified, only show public published articles
    // If authorId is specified, show all articles by that author (for "My Articles" page)
    if (!authorId) {
      filter.isPublic = true;
      filter.status = ArticleStatus.PUBLISHED; // Only show published articles to public
    }

    if (status) filter.status = status;
    if (authorId) filter.authorId = authorId;
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }
    if (categories) {
      const categoryArray = categories.split(',').map((c) => c.trim());
      filter.categories = { $in: categoryArray };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      this.articleModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.articleModel.countDocuments(filter),
    ]);

    return {
      articles: await Promise.all(articles.map((article) => this.toArticleTypeWithAuthor(article))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update article
   */
  async update(
    articleId: string,
    authorId: string,
    updateData: Article_Update_Type,
  ): Promise<Article_Type> {
    const article = await this.articleModel.findById(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if user is the author (unless admin/manager)
    const user = await this.userModel.findById(authorId).lean();
    const userRole = user?.role;
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    
    if (article.authorId.toString() !== authorId && !isAdminOrManager) {
      throw new ForbiddenException('You can only update your own articles');
    }

    // If status is being changed to published, set publishedAt
    if (updateData.status === ArticleStatus.PUBLISHED && article.status !== ArticleStatus.PUBLISHED) {
      (updateData as any).publishedAt = new Date();
    }

    // Update article
    Object.assign(article, updateData);
    const updatedArticle = await article.save();

    return this.toArticleType(updatedArticle);
  }

  /**
   * Delete article (soft delete by setting isActive to false)
   */
  async delete(articleId: string, authorId: string): Promise<boolean> {
    const article = await this.articleModel.findById(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if user is the author (unless admin/manager)
    const user = await this.userModel.findById(authorId).lean();
    const userRole = user?.role;
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    
    if (article.authorId.toString() !== authorId && !isAdminOrManager) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    article.isActive = false;
    await article.save();
    return true;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(articleId: string): Promise<void> {
    await this.articleModel.findByIdAndUpdate(articleId, { $inc: { viewCount: 1 } });
  }

  /**
   * Increment like count
   */
  async incrementLikeCount(articleId: string): Promise<void> {
    await this.articleModel.findByIdAndUpdate(articleId, { $inc: { likeCount: 1 } });
  }

  /**
   * Convert MongoDB document to Article_Type with author info
   */
  private async toArticleTypeWithAuthor(article: any): Promise<Article_Type> {
    let author: AuthorInfo_Type | undefined;

    if (article.authorId) {
      const user = await this.userModel.findById(article.authorId).lean();
      if (user) {
        author = {
          _id: user._id?.toString() || article.authorId,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          email: user.email,
        };
      }
    }

    // Normalize coverImage URL - convert localhost URLs to relative paths
    let coverImage = article.coverImage;
    if (coverImage && typeof coverImage === 'string') {
      const localhostPattern = /^https?:\/\/localhost:\d+\/(uploads\/.+)$/;
      const match = coverImage.match(localhostPattern);
      if (match) {
        coverImage = `/${match[1]}`;
      }
      const absoluteUrlPattern = /^https?:\/\/[^\/]+\/(uploads\/.+)$/;
      const absoluteMatch = coverImage.match(absoluteUrlPattern);
      if (absoluteMatch && !coverImage.startsWith('/')) {
        coverImage = `/${absoluteMatch[1]}`;
      }
    }

    return {
      _id: article._id?.toString(),
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      authorId: article.authorId?.toString() || article.authorId,
      author,
      status: article.status,
      tags: article.tags,
      categories: article.categories,
      coverImage: coverImage,
      images: article.images,
      viewCount: article.viewCount,
      likeCount: article.likeCount,
      isFeatured: article.isFeatured,
      publishedAt: article.publishedAt,
      metadata: article.metadata,
      isActive: article.isActive,
      isPublic: article.isPublic,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }

  /**
   * Convert MongoDB document to Article_Type (without author - for create/update)
   */
  private toArticleType(article: any): Article_Type {
    // Normalize coverImage URL
    let coverImage = article.coverImage;
    if (coverImage && typeof coverImage === 'string') {
      const localhostPattern = /^https?:\/\/localhost:\d+\/(uploads\/.+)$/;
      const match = coverImage.match(localhostPattern);
      if (match) {
        coverImage = `/${match[1]}`;
      }
      const absoluteUrlPattern = /^https?:\/\/[^\/]+\/(uploads\/.+)$/;
      const absoluteMatch = coverImage.match(absoluteUrlPattern);
      if (absoluteMatch && !coverImage.startsWith('/')) {
        coverImage = `/${absoluteMatch[1]}`;
      }
    }

    return {
      _id: article._id?.toString(),
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      authorId: article.authorId?.toString() || article.authorId,
      status: article.status,
      tags: article.tags,
      categories: article.categories,
      coverImage: coverImage,
      images: article.images,
      viewCount: article.viewCount,
      likeCount: article.likeCount,
      isFeatured: article.isFeatured,
      publishedAt: article.publishedAt,
      metadata: article.metadata,
      isActive: article.isActive,
      isPublic: article.isPublic,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
