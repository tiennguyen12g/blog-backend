import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './property.schema';
import { PropertyService } from './property.service';
import { PropertyMongoService } from './services/property-mongo.service';
import { MetalPriceService } from './services/metal-price.service';
import { PropertyController } from './property.controller';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
    ]),
    UserModule, // Import UserModule for RestrictedGuard
  ],
  providers: [PropertyService, PropertyMongoService, MetalPriceService],
  controllers: [PropertyController],
  exports: [PropertyService, PropertyMongoService, MongooseModule],
})
export class PropertyModule {}
