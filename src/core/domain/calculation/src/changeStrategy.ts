import { Currency, Denomination, isZeroMoney, Money } from '../../currency';
import { InvalidCurrencyError } from '../../errors';
import {
  ChangeDistribution,
  createChangeDistribution,
  DenominationCount
} from '../../transaction';
import { ChangeStrategy } from '../types';

export function calculateGreedyChange(
  changeDue: Money,
  currency: Currency
): ChangeDistribution {
  if (isZeroMoney(changeDue)) {
    return createChangeDistribution([], changeDue);
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

  return createChangeDistribution(entries, changeDue);
}

export const greedyMinimumChangeStrategy: ChangeStrategy = Object.freeze({
  name: 'GreedyMinimumChange',
  calculate: calculateGreedyChange
});

export function calculateRandomChange(
  changeDue: Money,
  currency: Currency,
  rng: () => number = Math.random
): ChangeDistribution {
  if (isZeroMoney(changeDue)) {
    return createChangeDistribution([], changeDue);
  }

  const counts = new Map<string, { denomination: Denomination; count: number }>();
  let remaining = changeDue.minorUnits;

  while (remaining > 0) {
    const validDenoms = currency.denominations.filter(
      (d) => d.value.minorUnits <= remaining
    );

    if (validDenoms.length === 0) {
      throw new InvalidCurrencyError(
        `Currency ${currency.code} cannot partition remaining change of ${remaining} minor units.`
      );
    }

    const denomIndex = clampedRandomInt(0, validDenoms.length - 1, rng);
    const chosenDenom = validDenoms[denomIndex]!;

    const maxUnits = Math.floor(remaining / chosenDenom.value.minorUnits);
    const count = clampedRandomInt(1, maxUnits, rng);

    const existing = counts.get(chosenDenom.code);
    if (existing) {
      existing.count += count;
    } else {
      counts.set(chosenDenom.code, { denomination: chosenDenom, count });
    }

    remaining -= count * chosenDenom.value.minorUnits;
  }

  const entries: DenominationCount[] = Array.from(counts.values());
  return createChangeDistribution(entries, changeDue);
}

export function createRandomChangeStrategy(rng?: () => number): ChangeStrategy {
  return Object.freeze({
    name: 'RandomChange',
    calculate: (changeDue: Money, currency: Currency) =>
      calculateRandomChange(changeDue, currency, rng)
  });
}

function clampedRandomInt(min: number, max: number, rng: () => number): number {
  if (min >= max) return min;
  const raw = rng();
  const clampedRaw = Math.max(0, Math.min(raw, 0.9999999999999999));
  const val = Math.floor(clampedRaw * (max - min + 1)) + min;
  return Math.max(min, Math.min(val, max));
}
