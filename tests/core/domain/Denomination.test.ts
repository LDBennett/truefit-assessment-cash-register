import {
  createDenomination,
  createMoney,
  equalsDenomination,
  formatDenomination
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('Denomination (Functional Value Object)', () => {
  const dollar = createDenomination({
    code: 'USD_DOLLAR',
    value: createMoney(100),
    singularName: 'dollar',
    pluralName: 'dollars'
  });
  const quarter = createDenomination({
    code: 'USD_QUARTER',
    value: createMoney(25),
    singularName: 'quarter',
    pluralName: 'quarters'
  });
  const euro2 = createDenomination({
    code: 'EUR_2_EURO',
    value: createMoney(200),
    singularName: '2-euro coin',
    pluralName: '2-euro coins'
  });
  const cent50 = createDenomination({
    code: 'EUR_50_CENT',
    value: createMoney(50),
    singularName: '50-cent coin',
    pluralName: '50-cent coins'
  });

  describe('Formatting', () => {
    it('formats singular counts for USD', () => {
      expect(formatDenomination(dollar, 1)).toBe('1 dollar');
      expect(formatDenomination(quarter, 1)).toBe('1 quarter');
    });

    it('formats plural counts for USD', () => {
      expect(formatDenomination(dollar, 2)).toBe('2 dollars');
      expect(formatDenomination(quarter, 3)).toBe('3 quarters');
    });

    it('formats singular counts for EUR physical coins', () => {
      expect(formatDenomination(euro2, 1)).toBe('1 2-euro coin');
      expect(formatDenomination(cent50, 1)).toBe('1 50-cent coin');
    });

    it('formats plural counts for EUR physical coins', () => {
      expect(formatDenomination(euro2, 2)).toBe('2 2-euro coins');
      expect(formatDenomination(cent50, 3)).toBe('3 50-cent coins');
    });
  });

  describe('Structural Equality', () => {
    it('returns true for denominations with matching code and value', () => {
      const q1 = createDenomination({
        code: 'USD_QUARTER',
        value: createMoney(25),
        singularName: 'quarter',
        pluralName: 'quarters'
      });
      const q2 = createDenomination({
        code: 'USD_QUARTER',
        value: createMoney(25),
        singularName: 'quarter',
        pluralName: 'quarters'
      });
      expect(equalsDenomination(q1, q2)).toBe(true);
    });

    it('returns false for denominations with different codes or values', () => {
      expect(equalsDenomination(dollar, quarter)).toBe(false);

      const fakeDollar = createDenomination({
        code: 'USD_DOLLAR',
        value: createMoney(150),
        singularName: 'dollar',
        pluralName: 'dollars'
      });
      expect(equalsDenomination(dollar, fakeDollar)).toBe(false);
    });
  });
});
