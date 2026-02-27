import { Injectable } from '@nestjs/common';
import { AccountMongoService } from '../account/services/account-mongo.service';
import { TransactionMongoService } from '../transaction/services/transaction-mongo.service';
import { AccountType } from '../account/account.schema';

@Injectable()
export class DashboardService {
  constructor(
    private readonly accountMongoService: AccountMongoService,
    private readonly transactionMongoService: TransactionMongoService,
  ) {}

  /**
   * Get dashboard data for a user
   */
  async getDashboardData(userId: string, startDate?: Date, endDate?: Date) {
    // Get all accounts
    const accounts = await this.accountMongoService.findByUserId(userId);

    const BASE_CURRENCY = 'AUD';
    
    // For now, only include accounts whose native currency matches the base currency (AUD)
    // to avoid mixing AUD and non-AUD balances.
    const totalBalance = accounts.reduce((sum, acc) => {
      return acc.currency === BASE_CURRENCY ? sum + acc.balance : sum;
    }, 0);

    // Get account breakdown by type
    const accountBreakdown = {
      cash: accounts
        .filter(a => a.type === AccountType.CASH && a.currency === BASE_CURRENCY)
        .reduce((sum, a) => sum + a.balance, 0),
      bankAccount: accounts
        .filter(a => a.type === AccountType.BANK_ACCOUNT && a.currency === BASE_CURRENCY)
        .reduce((sum, a) => sum + a.balance, 0),
      cryptoWallet: accounts
        .filter(a => a.type === AccountType.CRYPTO_WALLET && a.currency === BASE_CURRENCY)
        .reduce((sum, a) => sum + a.balance, 0),
    };

    // Get transaction summary
    const summary = await this.transactionMongoService.getSummary(userId, startDate, endDate);

    // Calculate percentages for income categories
    const incomeByCategory = summary.incomeByCategory.map(item => ({
      ...item,
      percentage: summary.totalIncome > 0 ? (item.amount / summary.totalIncome) * 100 : 0,
    }));

    // Calculate percentages for expense categories
    const expenseByCategory = summary.expenseByCategory.map(item => ({
      ...item,
      percentage: summary.totalExpense > 0 ? (item.amount / summary.totalExpense) * 100 : 0,
    }));

    return {
      // Summary Cards
      totalBalance,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netSavings: summary.netSavings,

      // Account Breakdown
      accounts: accountBreakdown,

      // Category Breakdown (for charts)
      incomeByCategory,
      expenseByCategory,

      // Account list
      accountList: accounts,
    };
  }
}
