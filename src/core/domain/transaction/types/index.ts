import { Denomination, Money } from '../../currency';

export interface RegisterTransaction {
  readonly owed: Money;
  readonly paid: Money;
  readonly changeDue: Money;
}

export interface DenominationCount {
  readonly denomination: Denomination;
  readonly count: number;
}

export interface ChangeDistribution {
  readonly entries: readonly DenominationCount[];
  readonly changeDue: Money;
  readonly totalValue: Money;
}
