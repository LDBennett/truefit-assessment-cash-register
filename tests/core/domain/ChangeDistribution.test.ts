import {
  createChangeDistribution,
  createMoney,
  CURRENCIES,
  InvariantViolationError,
  isZeroMoney,
  MONEY_ZERO
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('ChangeDistribution (Functional Value Object)', () => {
  const [dollar, quarter, dime, nickel, penny] = CURRENCIES.USD.denominations;

  it('creates valid distribution when entries sum exactly matches changeDue', () => {
    // 3 quarters (75¢) + 1 dime (10¢) + 3 pennies (3¢) = 88¢
    const entries = [
      { denomination: quarter!, count: 3 },
      { denomination: dime!, count: 1 },
      { denomination: penny!, count: 3 }
    ];
    const dist = createChangeDistribution(entries, createMoney(88));

    expect(dist.changeDue.minorUnits).toBe(88);
    expect(dist.totalValue.minorUnits).toBe(88);
    expect(dist.entries).toHaveLength(3);
    expect(dist.entries[0]!.denomination.code).toBe('USD_QUARTER');
  });

  it('creates valid empty distribution when changeDue is zero', () => {
    const dist = createChangeDistribution([], MONEY_ZERO);
    expect(dist.entries).toHaveLength(0);
    expect(isZeroMoney(dist.changeDue)).toBe(true);
    expect(isZeroMoney(dist.totalValue)).toBe(true);
  });

  it('throws InvariantViolationError if zero changeDue has non-empty entries', () => {
    expect(
      () =>
        createChangeDistribution(
          [{ denomination: penny!, count: 1 }],
          MONEY_ZERO
        )
    ).toThrow(InvariantViolationError);
  });

  it('throws InvariantViolationError when entry count is zero or negative', () => {
    expect(
      () =>
        createChangeDistribution(
          [{ denomination: quarter!, count: 0 }],
          MONEY_ZERO
        )
    ).toThrow(InvariantViolationError);

    expect(
      () =>
        createChangeDistribution(
          [{ denomination: quarter!, count: -1 }],
          createMoney(25)
        )
    ).toThrow(InvariantViolationError);
  });

  it('throws InvariantViolationError when duplicate denominations are provided', () => {
    expect(
      () =>
        createChangeDistribution(
          [
            { denomination: quarter!, count: 1 },
            { denomination: quarter!, count: 1 }
          ],
          createMoney(50)
        )
    ).toThrow(InvariantViolationError);
  });

  it('throws InvariantViolationError when entries sum differs from changeDue (under or over)', () => {
    // Expected 100, provided 75
    expect(
      () =>
        createChangeDistribution(
          [{ denomination: quarter!, count: 3 }],
          createMoney(100)
        )
    ).toThrow(InvariantViolationError);

    // Expected 50, provided 75
    expect(
      () =>
        createChangeDistribution(
          [{ denomination: quarter!, count: 3 }],
          createMoney(50)
        )
    ).toThrow(InvariantViolationError);
  });

  it('ensures entries are sorted descending by denomination value', () => {
    const unsortedEntries = [
      { denomination: penny!, count: 1 },
      { denomination: dollar!, count: 1 },
      { denomination: nickel!, count: 1 }
    ];
    const dist = createChangeDistribution(unsortedEntries, createMoney(106));

    expect(dist.entries[0]!.denomination.code).toBe('USD_DOLLAR');
    expect(dist.entries[1]!.denomination.code).toBe('USD_NICKEL');
    expect(dist.entries[2]!.denomination.code).toBe('USD_PENNY');
  });
});
