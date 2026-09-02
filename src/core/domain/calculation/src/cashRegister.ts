import { CURRENCIES, Currency } from '../../currency';
import { RegisterTransaction } from '../../transaction';
import {
  CashRegisterFn,
  CashRegisterOptions,
  TransactionResult
} from '../types';
import { createStrategySelector } from './strategySelector';

export function createCashRegister(
  options: CashRegisterOptions = {}
): CashRegisterFn {
  const {
    currency: defaultCurrency = CURRENCIES.USD,
    selector = createStrategySelector()
  } = options;

  return (
    transaction: RegisterTransaction,
    currency: Currency = defaultCurrency
  ): TransactionResult => {
    const strategy = selector(transaction);
    const distribution = strategy.calculate(transaction.changeDue, currency);

    return Object.freeze({
      transaction,
      distribution,
      strategyName: strategy.name
    });
  };
}
