import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ArticleModule } from './modules/article/article.module';
import { FinanceModule } from './modules/finance/finance.module';
import { MemoryModule } from './modules/memory/memory.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-db', {
      connectionFactory: async (connection) => {
        const logger = new Logger('MongoDB');
        const dbName = connection.db?.databaseName || 'unknown';
        logger.log(`Connecting to database: ${dbName}`);
        connection.on('connected', () => {
          logger.log(`MongoDB connected successfully to database: ${dbName}`);
        });
        connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });
        connection.on('error', (error: any) => {
          logger.error('MongoDB connection error: ', error);
        });
        return connection;
      },
    }),
    UserModule,
    AuthModule,
    ArticleModule,
    FinanceModule,
    MemoryModule,
    SystemConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
