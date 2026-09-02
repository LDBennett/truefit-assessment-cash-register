import {
  calculateGreedyChange,
  createMoney,
  CURRENCIES,
  formatDistribution,
  formatDistributions,
  MONEY_ZERO
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('ChangeFormatter (Application Service)', () => {
  const usd = CURRENCIES.USD;
  const eur = CURRENCIES.EUR;

  describe('Single Distribution Formatting', () => {
    it('formats zero change as "0"', () => {
      const dist = calculateGreedyChange(MONEY_ZERO, usd);
      expect(formatDistribution(dist)).toBe('0');
    });

    it('supports custom zero-change representation', () => {
      const dist = calculateGreedyChange(MONEY_ZERO, usd);
      expect(formatDistribution(dist, { zeroChangeRepresentation: 'NO_CHANGE' })).toBe(
        'NO_CHANGE'
      );
    });

    it('formats USD singular and plural denominations with comma separation', () => {
      // 88 cents: 3 quarters, 1 dime, 3 pennies
      const dist = calculateGreedyChange(createMoney(88), usd);
      expect(formatDistribution(dist)).toBe('3 quarters,1 dime,3 pennies');
    });

    it('formats 3 cents as 3 pennies', () => {
      const dist = calculateGreedyChange(createMoney(3), usd);
      expect(formatDistribution(dist)).toBe('3 pennies');
    });

    it('formats all 5 USD denominations without trailing comma and without "and"', () => {
      // 141 cents: 1 dollar, 1 quarter, 1 dime, 1 nickel, 1 penny
      const dist = calculateGreedyChange(createMoney(141), usd);
      expect(formatDistribution(dist)).toBe(
        '1 dollar,1 quarter,1 dime,1 nickel,1 penny'
      );
      expect(formatDistribution(dist)).not.toContain('and');
      expect(formatDistribution(dist).endsWith(',')).toBe(false);
    });

    it('formats EUR physical coins correctly', () => {
      // 67 cents EUR: 1 50-cent coin, 1 10-cent coin, 1 5-cent coin, 1 2-cent coin
      const dist = calculateGreedyChange(createMoney(67), eur);
      expect(formatDistribution(dist)).toBe(
        '1 50-cent coin,1 10-cent coin,1 5-cent coin,1 2-cent coin'
      );
    });
  });

  describe('Multi-Line Output Joining', () => {
    it('joins multiple distributions with newlines', () => {
      const d1 = calculateGreedyChange(createMoney(88), usd);
      const d2 = calculateGreedyChange(createMoney(3), usd);
      const d3 = calculateGreedyChange(MONEY_ZERO, usd);

      const output = formatDistributions([d1, d2, d3]);
      expect(output).toBe('3 quarters,1 dime,3 pennies\n3 pennies\n0');
    });
  });
});
