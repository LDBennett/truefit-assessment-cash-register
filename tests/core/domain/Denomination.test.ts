import { Denomination } from '@core/domain/model/Denomination';
import { Money } from '@core/domain/model/Money';
import { describe, expect, it } from 'vitest';

describe('Denomination Value Object', () => {
  const dollar = new Denomination('USD_DOLLAR', new Money(100), 'dollar', 'dollars');
  const quarter = new Denomination('USD_QUARTER', new Money(25), 'quarter', 'quarters');
  const euro2 = new Denomination('EUR_2_EURO', new Money(200), '2-euro coin', '2-euro coins');
  const cent50 = new Denomination('EUR_50_CENT', new Money(50), '50-cent coin', '50-cent coins');

  describe('Formatting', () => {
    it('formats singular counts for USD', () => {
      expect(dollar.format(1)).toBe('1 dollar');
      expect(quarter.format(1)).toBe('1 quarter');
    });

    it('formats plural counts for USD', () => {
      expect(dollar.format(2)).toBe('2 dollars');
      expect(quarter.format(3)).toBe('3 quarters');
    });

    it('formats singular counts for EUR physical coins', () => {
      expect(euro2.format(1)).toBe('1 2-euro coin');
      expect(cent50.format(1)).toBe('1 50-cent coin');
    });

    it('formats plural counts for EUR physical coins', () => {
      expect(euro2.format(2)).toBe('2 2-euro coins');
      expect(cent50.format(3)).toBe('3 50-cent coins');
    });
  });

  describe('Structural Equality', () => {
    it('returns true for denominations with matching code and value', () => {
      const q1 = new Denomination('USD_QUARTER', new Money(25), 'quarter', 'quarters');
      const q2 = new Denomination('USD_QUARTER', new Money(25), 'quarter', 'quarters');
      expect(q1.equals(q2)).toBe(true);
    });

    it('returns false for denominations with different codes or values', () => {
      expect(dollar.equals(quarter)).toBe(false);

      const fakeDollar = new Denomination('USD_DOLLAR', new Money(150), 'dollar', 'dollars');
      expect(dollar.equals(fakeDollar)).toBe(false);
    });
  });
});
