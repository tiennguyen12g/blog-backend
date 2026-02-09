import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';
import { UserMongoService } from './services/user-mongo.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserService, UserMongoService],
  controllers: [UserController],
  exports: [UserService, UserMongoService, MongooseModule],
})
export class UserModule {}

