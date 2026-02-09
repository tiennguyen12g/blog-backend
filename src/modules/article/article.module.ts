import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './article.schema';
import { ArticleService } from './article.service';
import { ArticleMongoService } from './services/article-mongo.service';
import { ArticleController } from './article.controller';
import { ArticleUploadController } from './article-upload.controller';
import { UserModule } from '../user/user.module';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: User.name, schema: UserSchema }, // Add User model for population
    ]),
    UserModule, // Import UserModule to access User model
  ],
  providers: [ArticleService, ArticleMongoService],
  controllers: [ArticleController, ArticleUploadController],
  exports: [ArticleService, ArticleMongoService, MongooseModule],
})
export class ArticleModule {}
