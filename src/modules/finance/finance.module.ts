import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PropertyModule } from './property/property.module';

@Module({
  imports: [AccountModule, TransactionModule, DashboardModule, PropertyModule],
  exports: [AccountModule, TransactionModule, DashboardModule, PropertyModule],
})
export class FinanceModule {}
