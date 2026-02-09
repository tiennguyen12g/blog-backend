import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { handleRequest } from '../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../global/GlobalResponseData';
import { JwtUserPayload } from '../user/user.interface';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { memoryStorage } from 'multer';

@Controller('api/v1/articles')
export class ArticleUploadController {
  /**
   * Upload cover image
   * POST /api/v1/articles/upload-image
   * Requires authentication
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(), // Store in memory
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
      }
    },
  }))
  async uploadImage(
    @Request() req: { user: JwtUserPayload },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDataOutput<{ url: string; filename: string } | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<{ url: string; filename: string }>({
      execute: async () => {
        if (!file) {
          throw new Error('No file uploaded');
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'articles');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const filename = `${uuidv4()}${fileExt}`;
        const filepath = path.join(uploadsDir, filename);

        // Save file
        // file.buffer is a Buffer from Multer, ensure proper typing for fs.writeFileSync
        fs.writeFileSync(filepath, file.buffer as Buffer);

        // Return relative URL - browser will automatically resolve using current origin
        // Works in both development and production without hardcoding domain
        // Development: https://localhost:443/blog/uploads/articles/filename
        // Production: https://yourdomain.com/blog/uploads/articles/filename
        // Note: For blog project, images are served at /blog/uploads/articles/ (Nginx routes this)
        const url = `/blog/uploads/articles/${filename}`;

        return {
          url,
          filename,
        };
      },
      actionName: 'uploadImage',
    });
  }
}
