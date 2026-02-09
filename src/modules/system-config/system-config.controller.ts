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
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { UserRole } from '../user/user.schema';
import { SystemConfigService } from './system-config.service';
import { ZodValidationPipe } from '../../validation.pipe';
import { handleRequest } from '../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../global/GlobalResponseData';
import { JwtUserPayload } from '../user/user.interface';
import {
  SystemConfig_Type,
  SystemConfig_Create_Type,
  SystemConfig_Update_Type,
  SystemConfig_Create_Schema,
  SystemConfig_Update_Schema,
} from './system-config.interface';

@Controller('api/v1/config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  /**
   * Get all configs (public only for non-admin)
   * GET /api/v1/config
   */
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Request() req?: { user?: JwtUserPayload },
  ): Promise<ResponseDataOutput<SystemConfig_Type[] | ResponseDataWhenError>> {
    const isAdmin = req?.user?.role === 'admin';
    const includePrivate = isAdmin;

    return handleRequest<SystemConfig_Type[]>({
      execute: () => this.configService.findAll(category, includePrivate),
      actionName: 'getConfigs',
    });
  }

  /**
   * Get config by key
   * GET /api/v1/config/:key
   */
  @Get(':key')
  async findByKey(
    @Param('key') key: string,
  ): Promise<ResponseDataOutput<SystemConfig_Type | ResponseDataWhenError>> {
    return handleRequest<SystemConfig_Type>({
      execute: async () => {
        const config = await this.configService.findByKey(key);
        if (!config) {
          throw new Error('Config not found');
        }
        // Check if user can access private configs
        if (!config.isPublic) {
          throw new Error('Config not found'); // Don't reveal existence of private configs
        }
        return config;
      },
      actionName: 'getConfig',
    });
  }

  /**
   * Create config (Admin only)
   * POST /api/v1/config
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: SystemConfig_Create_Schema, action: 'createConfig' }))
    createData: SystemConfig_Create_Type,
  ): Promise<ResponseDataOutput<SystemConfig_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<SystemConfig_Type>({
      execute: () => this.configService.create(createData, req.user.user_id),
      actionName: 'createConfig',
    });
  }

  /**
   * Update config (Admin only)
   * PUT /api/v1/config/:key
   */
  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('key') key: string,
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: SystemConfig_Update_Schema, action: 'updateConfig' }))
    updateData: SystemConfig_Update_Type,
  ): Promise<ResponseDataOutput<SystemConfig_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<SystemConfig_Type>({
      execute: () => this.configService.update(key, updateData, req.user.user_id),
      actionName: 'updateConfig',
    });
  }

  /**
   * Delete config (Admin only)
   * DELETE /api/v1/config/:key
   */
  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(
    @Param('key') key: string,
  ): Promise<ResponseDataOutput<{ success: boolean; message: string } | ResponseDataWhenError>> {
    return handleRequest<{ success: boolean; message: string }>({
      execute: async () => {
        await this.configService.delete(key);
        return { success: true, message: 'Config deleted successfully' };
      },
      actionName: 'deleteConfig',
    });
  }
}
