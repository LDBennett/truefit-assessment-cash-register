import { Currencies } from '@core/domain/model/Currency';
import { Money } from '@core/domain/model/Money';
import { GreedyMinimumChangeStrategy } from '@core/domain/strategies/GreedyMinimumChangeStrategy';
import { describe, expect, it } from 'vitest';

describe('GreedyMinimumChangeStrategy', () => {
  const strategy = new GreedyMinimumChangeStrategy();

  describe('USD Calculations', () => {
    const usd = Currencies.USD;

    it('calculates minimum coins for 88 cents (Sample 1: 2.12 owed, 3.00 paid)', () => {
      const dist = strategy.calculate(new Money(88), usd);

      expect(dist.entries).toHaveLength(3);
      expect(dist.entries[0]!.denomination.code).toBe('USD_QUARTER');
      expect(dist.entries[0]!.count).toBe(3);
      expect(dist.entries[1]!.denomination.code).toBe('USD_DIME');
      expect(dist.entries[1]!.count).toBe(1);
      expect(dist.entries[2]!.denomination.code).toBe('USD_PENNY');
      expect(dist.entries[2]!.count).toBe(3);
    });

    it('calculates minimum coins for 3 cents (Sample 2: 1.97 owed, 2.00 paid)', () => {
      const dist = strategy.calculate(new Money(3), usd);

      expect(dist.entries).toHaveLength(1);
      expect(dist.entries[0]!.denomination.code).toBe('USD_PENNY');
      expect(dist.entries[0]!.count).toBe(3);
    });

    it('returns empty distribution for 0 cents (exact payment)', () => {
      const dist = strategy.calculate(Money.ZERO, usd);
      expect(dist.entries).toHaveLength(0);
      expect(dist.totalValue.isZero()).toBe(true);
    });

    it('exercises all denominations at once ($1.41 = 1 dollar, 1 quarter, 1 dime, 1 nickel, 1 penny)', () => {
      const dist = strategy.calculate(new Money(141), usd);

      expect(dist.entries).toHaveLength(5);
      expect(dist.entries.map((e) => `${e.count} ${e.denomination.singularName}`)).toEqual([
        '1 dollar',
        '1 quarter',
        '1 dime',
        '1 nickel',
        '1 penny'
      ]);
    });
  });

  describe('EUR Calculations', () => {
    const eur = Currencies.EUR;

    it('calculates minimum coins for 67 cents EUR (1.33 owed, 2.00 paid)', () => {
      const dist = strategy.calculate(new Money(67), eur);

      // 67 cents = 50 + 10 + 5 + 2
      expect(dist.entries).toHaveLength(4);
      expect(dist.entries[0]!.denomination.code).toBe('EUR_50_CENT');
      expect(dist.entries[0]!.count).toBe(1);
      expect(dist.entries[1]!.denomination.code).toBe('EUR_10_CENT');
      expect(dist.entries[1]!.count).toBe(1);
      expect(dist.entries[2]!.denomination.code).toBe('EUR_5_CENT');
      expect(dist.entries[2]!.count).toBe(1);
      expect(dist.entries[3]!.denomination.code).toBe('EUR_2_CENT');
      expect(dist.entries[3]!.count).toBe(1);
    });

    it('exercises all EUR denominations at once (388 cents = 200+100+50+20+10+5+2+1)', () => {
      const dist = strategy.calculate(new Money(388), eur);

      expect(dist.entries).toHaveLength(8);
      expect(dist.entries.map((e) => e.count)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
      expect(dist.entries.map((e) => e.denomination.code)).toEqual([
        'EUR_2_EURO',
        'EUR_1_EURO',
        'EUR_50_CENT',
        'EUR_20_CENT',
        'EUR_10_CENT',
        'EUR_5_CENT',
        'EUR_2_CENT',
        'EUR_1_CENT'
      ]);
    });
  });
});
