import { Currency, Money } from '../../currency';
import { ChangeDistribution, RegisterTransaction } from '../../transaction';

export type ChangeCalculationFn = (
  changeDue: Money,
  currency: Currency
) => ChangeDistribution;

export interface ChangeStrategy {
  readonly name: string;
  readonly calculate: ChangeCalculationFn;
}

export interface StrategyRule {
  readonly name: string;
  readonly predicate: (tx: RegisterTransaction) => boolean;
  readonly strategy: ChangeStrategy;
}

export interface StrategySelectorOptions {
  readonly divisor?: number;
  readonly customRules?: readonly StrategyRule[];
  readonly randomStrategy?: ChangeStrategy;
  readonly defaultStrategy?: ChangeStrategy;
}

export type StrategySelectorFn = (tx: RegisterTransaction) => ChangeStrategy;

export interface TransactionResult {
  readonly transaction: RegisterTransaction;
  readonly distribution: ChangeDistribution;
  readonly strategyName: string;
}

export interface CashRegisterOptions {
  readonly currency?: Currency;
  readonly selector?: StrategySelectorFn;
}

export type CashRegisterFn = (
  transaction: RegisterTransaction,
  currency?: Currency
) => TransactionResult;
