import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from '../property.schema';
import {
  Property_Type,
  Property_Create_Type,
  Property_Update_Type,
  Property_Query_Type,
} from '../property.interface';

@Injectable()
export class PropertyMongoService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
  ) {}

  /**
   * Create a new property
   */
  async create(userId: string, createData: Property_Create_Type): Promise<Property_Type> {
    const newProperty = new this.propertyModel({
      ...createData,
      userId,
      purchaseDate: createData.purchaseDate || new Date(),
    });

    const savedProperty = await newProperty.save();
    return this.toPropertyType(savedProperty);
  }

  /**
   * Find property by ID
   */
  async findById(propertyId: string, userId: string): Promise<Property_Type | null> {
    const property = await this.propertyModel.findOne({ _id: propertyId, userId }).lean();
    if (!property) return null;
    return this.toPropertyType(property);
  }

  /**
   * Find all properties for a user
   */
  async findByUserId(userId: string, query?: Property_Query_Type): Promise<Property_Type[]> {
    const filter: any = { userId };
    
    if (query?.type) {
      filter.type = query.type;
    }
    
    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    } else {
      // Default to only active properties
      filter.isActive = true;
    }

    const properties = await this.propertyModel.find(filter).sort({ createdAt: -1 }).lean();
    return properties.map(p => this.toPropertyType(p));
  }

  /**
   * Update property
   */
  async update(
    propertyId: string,
    userId: string,
    updateData: Property_Update_Type,
  ): Promise<Property_Type> {
    const property = await this.propertyModel.findOne({ _id: propertyId, userId });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Filter out undefined, null, and empty string values
    const cleanUpdateData: any = {};
    if (updateData.name !== undefined && updateData.name !== null && updateData.name !== '') {
      cleanUpdateData.name = updateData.name;
    }
    if (updateData.purchasePrice !== undefined && updateData.purchasePrice !== null && updateData.purchasePrice > 0) {
      cleanUpdateData.purchasePrice = updateData.purchasePrice;
    }
    if (updateData.quantity !== undefined && updateData.quantity !== null && updateData.quantity >= 0) {
      cleanUpdateData.quantity = updateData.quantity;
    }
    if (updateData.currentValue !== undefined && updateData.currentValue !== null) {
      cleanUpdateData.currentValue = updateData.currentValue;
    }
    if (updateData.description !== undefined && updateData.description !== null && updateData.description !== '') {
      cleanUpdateData.description = updateData.description;
    }
    if (updateData.location !== undefined && updateData.location !== null && updateData.location !== '') {
      cleanUpdateData.location = updateData.location;
    }
    if (updateData.isActive !== undefined) {
      cleanUpdateData.isActive = updateData.isActive;
    }

    // Only update if there's at least one field
    if (Object.keys(cleanUpdateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    Object.assign(property, cleanUpdateData);
    const updatedProperty = await property.save();
    return this.toPropertyType(updatedProperty);
  }

  /**
   * Delete property (soft delete)
   */
  async delete(propertyId: string, userId: string): Promise<boolean> {
    const property = await this.propertyModel.findOne({ _id: propertyId, userId });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    property.isActive = false;
    await property.save();
    return true;
  }

  /**
   * Update last price update timestamp (for gold/silver)
   */
  async updateLastPriceUpdate(propertyId: string): Promise<void> {
    await this.propertyModel.findByIdAndUpdate(propertyId, {
      $set: { lastPriceUpdate: new Date() },
    });
  }

  /**
   * Convert MongoDB document to Property_Type
   */
  private toPropertyType(property: any): Property_Type {
    return {
      _id: property._id?.toString(),
      userId: property.userId?.toString() || property.userId,
      name: property.name,
      type: property.type,
      purchasePrice: property.purchasePrice,
      currency: property.currency,
      purchaseDate: property.purchaseDate,
      quantity: property.quantity,
      unit: property.unit,
      currentValue: property.currentValue,
      description: property.description,
      location: property.location,
      isActive: property.isActive,
      lastPriceUpdate: property.lastPriceUpdate,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }
}
