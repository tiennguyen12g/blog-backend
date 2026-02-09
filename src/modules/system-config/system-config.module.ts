import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfig, SystemConfigSchema } from './system-config.schema';
import { SystemConfigService } from './system-config.service';
import { SystemConfigMongoService } from './services/system-config-mongo.service';
import { SystemConfigController } from './system-config.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  providers: [SystemConfigService, SystemConfigMongoService],
  controllers: [SystemConfigController],
  exports: [SystemConfigService, SystemConfigMongoService, MongooseModule],
})
export class SystemConfigModule {}
