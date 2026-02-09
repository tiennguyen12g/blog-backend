import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [AccountModule, TransactionModule, DashboardModule],
  exports: [AccountModule, TransactionModule, DashboardModule],
})
export class FinanceModule {}
