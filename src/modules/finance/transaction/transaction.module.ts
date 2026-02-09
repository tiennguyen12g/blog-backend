import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.schema';
import { TransactionService } from './transaction.service';
import { TransactionMongoService } from './services/transaction-mongo.service';
import { TransactionController } from './transaction.controller';
import { AccountModule } from '../account/account.module';
import { Account, AccountSchema } from '../account/account.schema';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    AccountModule,
    UserModule, // Import UserModule for RestrictedGuard
  ],
  providers: [TransactionService, TransactionMongoService],
  controllers: [TransactionController],
  exports: [TransactionService, TransactionMongoService, MongooseModule],
})
export class TransactionModule {}
