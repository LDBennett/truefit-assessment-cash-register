import { ChangeDistribution } from '../model/ChangeDistribution';
import { Currency } from '../model/Currency';
import { Money } from '../model/Money';

export interface IChangeCalculationStrategy {
  readonly name: string;
  calculate(changeDue: Money, currency: Currency): ChangeDistribution;
}
