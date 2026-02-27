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
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RestrictedGuard } from '../../../auth/restricted.guard';
import { PropertyService } from './property.service';
import { ZodValidationPipe } from '../../../validation.pipe';
import { handleRequest } from '../../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../../global/GlobalResponseData';
import { JwtUserPayload } from '../../user/user.interface';
import {
  Property_Type,
  Property_WithCalculations_Type,
  Property_Create_Type,
  Property_Update_Type,
  Property_Query_Type,
  Property_Create_Schema,
  Property_Update_Schema,
  Property_Query_Schema,
} from './property.interface';

@Controller('api/v1/finance/properties')
@UseGuards(JwtAuthGuard, RestrictedGuard)
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  /**
   * Create a new property
   */
  @Post()
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Property_Create_Schema, action: 'createProperty' }))
    createData: Property_Create_Type,
  ): Promise<ResponseDataOutput<Property_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Property_Type>({
      execute: () => this.propertyService.create(req.user.user_id, createData),
      actionName: 'createProperty',
    });
  }

  /**
   * Get all properties for the current user
   */
  @Get()
  async findAll(
    @Request() req: { user: JwtUserPayload },
    @Query(new ZodValidationPipe({ schema: Property_Query_Schema, action: 'queryProperties' }))
    query?: Property_Query_Type,
  ): Promise<ResponseDataOutput<Property_WithCalculations_Type[] | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Property_WithCalculations_Type[]>({
      execute: () => this.propertyService.findByUserId(req.user.user_id, query),
      actionName: 'getProperties',
    });
  }

  /**
   * Get property by ID
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<Property_WithCalculations_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Property_WithCalculations_Type>({
      execute: async () => {
        const property = await this.propertyService.findByIdWithCalculations(id, req.user.user_id);
        if (!property) {
          throw new Error('Property not found');
        }
        return property;
      },
      actionName: 'getProperty',
    });
  }

  /**
   * Update property
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Property_Update_Schema, action: 'updateProperty' }))
    updateData: Property_Update_Type,
  ): Promise<ResponseDataOutput<Property_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<Property_Type>({
      execute: () => this.propertyService.update(id, req.user.user_id, updateData),
      actionName: 'updateProperty',
    });
  }

  /**
   * Delete property
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: JwtUserPayload },
  ): Promise<ResponseDataOutput<{ success: boolean; message: string } | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }

    return handleRequest<{ success: boolean; message: string }>({
      execute: async () => {
        await this.propertyService.delete(id, req.user.user_id);
        return { success: true, message: 'Property deleted successfully' };
      },
      actionName: 'deleteProperty',
    });
  }

  /**
   * Get metal prices (gold and silver)
   */
  @Get('metals/prices')
  async getMetalPrices(): Promise<ResponseDataOutput<{ gold: number; silver: number; timestamp?: Date } | ResponseDataWhenError>> {
    return handleRequest<{ gold: number; silver: number; timestamp?: Date }>({
      execute: async () => {
        return await this.propertyService.getMetalPrices();
      },
      actionName: 'getMetalPrices',
    });
  }
}
