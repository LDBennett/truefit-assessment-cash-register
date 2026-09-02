import { ChangeDistribution, DenominationCount } from '../model/ChangeDistribution';
import { Currency } from '../model/Currency';
import { Money } from '../model/Money';
import { IChangeCalculationStrategy } from './IChangeCalculationStrategy';

export class GreedyMinimumChangeStrategy implements IChangeCalculationStrategy {
  readonly name: string = 'GreedyMinimumChange';

  calculate(changeDue: Money, currency: Currency): ChangeDistribution {
    if (changeDue.isZero()) {
      return new ChangeDistribution([], changeDue);
    }

    const entries: DenominationCount[] = [];
    let remaining = changeDue.minorUnits;

    for (const denomination of currency.denominations) {
      if (remaining === 0) break;

      const denomValue = denomination.value.minorUnits;
      if (remaining >= denomValue) {
        const count = Math.floor(remaining / denomValue);
        entries.push({ denomination, count });
        remaining -= count * denomValue;
      }
    }

    return new ChangeDistribution(entries, changeDue);
  }
}
