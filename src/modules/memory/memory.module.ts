import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Memory, MemorySchema } from './memory.schema';
import { MemoryService } from './memory.service';
import { MemoryMongoService } from './services/memory-mongo.service';
import { MemoryController } from './memory.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Memory.name, schema: MemorySchema },
    ]),
    UserModule, // Import UserModule for RestrictedGuard
  ],
  providers: [MemoryService, MemoryMongoService],
  controllers: [MemoryController],
  exports: [MemoryService, MemoryMongoService, MongooseModule],
})
export class MemoryModule {}
