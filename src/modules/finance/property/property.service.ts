import { Injectable } from '@nestjs/common';
import { PropertyMongoService } from './services/property-mongo.service';
import { MetalPriceService } from './services/metal-price.service';
import {
  Property_Type,
  Property_Create_Type,
  Property_Update_Type,
  Property_Query_Type,
  Property_WithCalculations_Type,
} from './property.interface';
import { PropertyType } from './property.schema';

@Injectable()
export class PropertyService {
  constructor(
    private readonly propertyMongoService: PropertyMongoService,
    private readonly metalPriceService: MetalPriceService,
  ) {}

  /**
   * Create a new property
   */
  async create(userId: string, createData: Property_Create_Type): Promise<Property_Type> {
    return this.propertyMongoService.create(userId, createData);
  }

  /**
   * Find property by ID
   */
  async findById(propertyId: string, userId: string): Promise<Property_Type | null> {
    return this.propertyMongoService.findById(propertyId, userId);
  }

  /**
   * Find all properties for a user with calculated values
   */
  async findByUserId(
    userId: string,
    query?: Property_Query_Type,
  ): Promise<Property_WithCalculations_Type[]> {
    const properties = await this.propertyMongoService.findByUserId(userId, query);
    
    // Calculate estimated values and profit/loss for each property
    const propertiesWithCalculations = await Promise.all(
      properties.map(async (property) => {
        return this.calculatePropertyMetrics(property);
      }),
    );

    return propertiesWithCalculations;
  }

  /**
   * Update property
   */
  async update(
    propertyId: string,
    userId: string,
    updateData: Property_Update_Type,
  ): Promise<Property_Type> {
    return this.propertyMongoService.update(propertyId, userId, updateData);
  }

  /**
   * Delete property
   */
  async delete(propertyId: string, userId: string): Promise<boolean> {
    return this.propertyMongoService.delete(propertyId, userId);
  }

  /**
   * Calculate estimated value and profit/loss for a property
   */
  private async calculatePropertyMetrics(
    property: Property_Type,
  ): Promise<Property_WithCalculations_Type> {
    let estimatedValue: number | undefined;

    // For gold and silver, we'll let frontend calculate the value
    // Backend just returns the property data, frontend will fetch prices and calculate
    // This avoids backend API blocking issues
    if (property.type === PropertyType.GOLD || property.type === PropertyType.SILVER) {
      // Don't calculate here - frontend will handle it
      // Just return undefined so frontend knows to calculate
      estimatedValue = undefined;
    } else {
      // For other types (car, house, etc.), use manual currentValue
      estimatedValue = property.currentValue;
    }

    // Calculate profit/loss
    // Note: estimatedValue is in USD for gold/silver, purchasePrice is in property.currency
    // We'll let frontend handle the currency conversion for proper comparison
    const profitLoss = estimatedValue !== undefined 
      ? estimatedValue - property.purchasePrice 
      : undefined;

    const profitLossPercentage = 
      estimatedValue !== undefined && property.purchasePrice > 0
        ? ((profitLoss || 0) / property.purchasePrice) * 100
        : undefined;

    return {
      ...property,
      estimatedValue,
      profitLoss,
      profitLossPercentage,
    };
  }

  /**
   * Get property by ID with calculations
   */
  async findByIdWithCalculations(
    propertyId: string,
    userId: string,
  ): Promise<Property_WithCalculations_Type | null> {
    const property = await this.propertyMongoService.findById(propertyId, userId);
    if (!property) return null;

    return this.calculatePropertyMetrics(property);
  }

  /**
   * Get metal prices (exposed for API)
   */
  async getMetalPrices(): Promise<{ gold: number; silver: number; timestamp?: Date }> {
    return await this.metalPriceService.getMetalPrices();
  }
}
