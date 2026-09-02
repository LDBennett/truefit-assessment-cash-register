import { ChangeDistribution } from '../model/ChangeDistribution';
import { Currencies, Currency } from '../model/Currency';
import { RegisterTransaction } from '../model/RegisterTransaction';
import { StrategySelector } from './StrategySelector';

export interface TransactionResult {
  readonly transaction: RegisterTransaction;
  readonly distribution: ChangeDistribution;
  readonly strategyName: string;
}

export class CashRegister {
  private readonly strategySelector: StrategySelector;
  private readonly defaultCurrency: Currency;

  constructor(
    strategySelector: StrategySelector = new StrategySelector(),
    defaultCurrency: Currency = Currencies.USD
  ) {
    this.strategySelector = strategySelector;
    this.defaultCurrency = defaultCurrency;
  }

  process(
    transaction: RegisterTransaction,
    currency: Currency = this.defaultCurrency
  ): TransactionResult {
    const strategy = this.strategySelector.select(transaction);
    const distribution = strategy.calculate(transaction.changeDue, currency);

    return {
      transaction,
      distribution,
      strategyName: strategy.name
    };
  }
}
