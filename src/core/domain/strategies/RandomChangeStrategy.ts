import { ChangeDistribution, DenominationCount } from '../model/ChangeDistribution';
import { Currency } from '../model/Currency';
import { Denomination } from '../model/Denomination';
import { Money } from '../model/Money';
import { IChangeCalculationStrategy } from './IChangeCalculationStrategy';

export class RandomChangeStrategy implements IChangeCalculationStrategy {
  readonly name: string = 'RandomChange';
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  calculate(changeDue: Money, currency: Currency): ChangeDistribution {
    if (changeDue.isZero()) {
      return new ChangeDistribution([], changeDue);
    }

    const counts = new Map<string, { denomination: Denomination; count: number }>();
    let remaining = changeDue.minorUnits;

    while (remaining > 0) {
      // Find all denominations that do not exceed the remaining balance
      const validDenoms = currency.denominations.filter(
        (d) => d.value.minorUnits <= remaining
      );

      // Invariant: since Currency enforces a 1-minor-unit denomination, validDenoms is never empty
      const denomIndex = this.randomInt(0, validDenoms.length - 1);
      const chosenDenom = validDenoms[denomIndex]!;

      // Choose a random count between 1 and the maximum units that fit
      const maxUnits = Math.floor(remaining / chosenDenom.value.minorUnits);
      const count = this.randomInt(1, maxUnits);

      // Aggregate counts per denomination
      const existing = counts.get(chosenDenom.code);
      if (existing) {
        existing.count += count;
      } else {
        counts.set(chosenDenom.code, { denomination: chosenDenom, count });
      }

      remaining -= count * chosenDenom.value.minorUnits;
    }

    const entries: DenominationCount[] = Array.from(counts.values());
    return new ChangeDistribution(entries, changeDue);
  }

  /**
   * Generates a clamped pseudo-random integer in the closed interval [min, max].
   * Assumes this.rng() returns a float in [0, 1).
   */
  private randomInt(min: number, max: number): number {
    if (min >= max) return min;
    const raw = this.rng();
    // Clamp to [0, 1) to guard against non-standard test doubles returning >= 1.0
    const clampedRaw = Math.max(0, Math.min(raw, 0.9999999999999999));
    const val = Math.floor(clampedRaw * (max - min + 1)) + min;
    return Math.max(min, Math.min(val, max));
  }
}
