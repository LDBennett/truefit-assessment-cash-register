import { InvariantViolationError } from '@core/domain/errors/DomainErrors';
import { ChangeDistribution } from '@core/domain/model/ChangeDistribution';
import { Currencies } from '@core/domain/model/Currency';
import { Money } from '@core/domain/model/Money';
import { describe, expect, it } from 'vitest';

describe('ChangeDistribution Value Object', () => {
  const [dollar, quarter, dime, nickel, penny] = Currencies.USD.denominations;

  it('creates valid distribution when entries sum exactly matches changeDue', () => {
    // 3 quarters (75¢) + 1 dime (10¢) + 3 pennies (3¢) = 88¢
    const entries = [
      { denomination: quarter!, count: 3 },
      { denomination: dime!, count: 1 },
      { denomination: penny!, count: 3 }
    ];
    const dist = new ChangeDistribution(entries, new Money(88));

    expect(dist.changeDue.minorUnits).toBe(88);
    expect(dist.totalValue.minorUnits).toBe(88);
    expect(dist.entries).toHaveLength(3);
    expect(dist.entries[0]!.denomination.code).toBe('USD_QUARTER');
  });

  it('creates valid empty distribution when changeDue is zero', () => {
    const dist = new ChangeDistribution([], Money.ZERO);
    expect(dist.entries).toHaveLength(0);
    expect(dist.changeDue.isZero()).toBe(true);
    expect(dist.totalValue.isZero()).toBe(true);
  });

  it('throws InvariantViolationError if zero changeDue has non-empty entries', () => {
    expect(
      () =>
        new ChangeDistribution(
          [{ denomination: penny!, count: 1 }],
          Money.ZERO
        )
    ).toThrow(InvariantViolationError);
  });

  it('throws InvariantViolationError when entry count is zero or negative', () => {
    expect(
      () =>
        new ChangeDistribution(
          [{ denomination: quarter!, count: 0 }],
          Money.ZERO
        )
    ).toThrow(InvariantViolationError);

    expect(
      () =>
        new ChangeDistribution(
          [{ denomination: quarter!, count: -1 }],
          new Money(25)
        )
    ).toThrow(InvariantViolationError);
  });

  it('throws InvariantViolationError when duplicate denominations are provided', () => {
    expect(
      () =>
        new ChangeDistribution(
          [
            { denomination: quarter!, count: 1 },
            { denomination: quarter!, count: 1 }
          ],
          new Money(50)
        )
    ).toThrow(InvariantViolationError);
  });

  it('throws InvariantViolationError when entries sum differs from changeDue (under or over)', () => {
    // Expected 100, provided 75
    expect(
      () =>
        new ChangeDistribution(
          [{ denomination: quarter!, count: 3 }],
          new Money(100)
        )
    ).toThrow(InvariantViolationError);

    // Expected 50, provided 75
    expect(
      () =>
        new ChangeDistribution(
          [{ denomination: quarter!, count: 3 }],
          new Money(50)
        )
    ).toThrow(InvariantViolationError);
  });

  it('ensures entries are sorted descending by denomination value', () => {
    const unsortedEntries = [
      { denomination: penny!, count: 1 },
      { denomination: dollar!, count: 1 },
      { denomination: nickel!, count: 1 }
    ];
    const dist = new ChangeDistribution(unsortedEntries, new Money(106));

    expect(dist.entries[0]!.denomination.code).toBe('USD_DOLLAR');
    expect(dist.entries[1]!.denomination.code).toBe('USD_NICKEL');
    expect(dist.entries[2]!.denomination.code).toBe('USD_PENNY');
  });
});
