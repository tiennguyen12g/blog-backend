import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './account.schema';
import { AccountService } from './account.service';
import { AccountMongoService } from './services/account-mongo.service';
import { AccountController } from './account.controller';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
    ]),
    UserModule, // Import UserModule for RestrictedGuard
  ],
  providers: [AccountService, AccountMongoService],
  controllers: [AccountController],
  exports: [AccountService, AccountMongoService, MongooseModule],
})
export class AccountModule {}
