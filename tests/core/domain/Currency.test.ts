import {
  createCurrency,
  createDenomination,
  createMoney,
  CURRENCIES,
  InvalidAmountError,
  InvalidCurrencyError,
  parseCurrencyAmount
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('Currency (Functional Value Object & Registry)', () => {
  describe('Structural Invariants', () => {
    it('creates Currency when an atomic 1-minor-unit denomination is present', () => {
      const custom = createCurrency({
        code: 'TEST',
        name: 'Test Currency',
        symbol: 'T',
        minorUnitDigits: 2,
        denominations: [
          createDenomination({ code: 'TEST_10', value: createMoney(10), singularName: 'ten', pluralName: 'tens' }),
          createDenomination({ code: 'TEST_1', value: createMoney(1), singularName: 'one', pluralName: 'ones' })
        ]
      });
      expect(custom.code).toBe('TEST');
      expect(custom.denominations).toHaveLength(2);
    });

    it('throws InvalidCurrencyError if no atomic 1-minor-unit denomination exists', () => {
      expect(() =>
        createCurrency({
          code: 'INVALID',
          name: 'No Penny',
          symbol: 'N',
          minorUnitDigits: 2,
          denominations: [
            createDenomination({ code: 'INV_10', value: createMoney(10), singularName: 'ten', pluralName: 'tens' }),
            createDenomination({ code: 'INV_5', value: createMoney(5), singularName: 'five', pluralName: 'fives' })
          ]
        })
      ).toThrow(InvalidCurrencyError);
    });

    it('automatically sorts denominations descending by value upon construction', () => {
      const unsorted = createCurrency({
        code: 'SORTED',
        name: 'Sorted',
        symbol: 'S',
        minorUnitDigits: 2,
        denominations: [
          createDenomination({ code: 'S_1', value: createMoney(1), singularName: 'one', pluralName: 'ones' }),
          createDenomination({ code: 'S_25', value: createMoney(25), singularName: 'quarter', pluralName: 'quarters' }),
          createDenomination({ code: 'S_10', value: createMoney(10), singularName: 'dime', pluralName: 'dimes' })
        ]
      });

      expect(unsorted.denominations[0]!.value.minorUnits).toBe(25);
      expect(unsorted.denominations[1]!.value.minorUnits).toBe(10);
      expect(unsorted.denominations[2]!.value.minorUnits).toBe(1);
    });
  });

  describe('Static CURRENCIES Registry', () => {
    it('CURRENCIES.USD contains the canonical 5 denominations in descending order', () => {
      const usd = CURRENCIES.USD;
      expect(usd.code).toBe('USD');
      expect(usd.symbol).toBe('$');
      expect(usd.minorUnitDigits).toBe(2);
      expect(usd.denominations).toHaveLength(5);
      expect(usd.denominations.map((d) => d.value.minorUnits)).toEqual([100, 25, 10, 5, 1]);
    });

    it('CURRENCIES.EUR contains the canonical 8 denominations in descending order', () => {
      const eur = CURRENCIES.EUR;
      expect(eur.code).toBe('EUR');
      expect(eur.symbol).toBe('€');
      expect(eur.minorUnitDigits).toBe(2);
      expect(eur.denominations).toHaveLength(8);
      expect(eur.denominations.map((d) => d.value.minorUnits)).toEqual([
        200, 100, 50, 20, 10, 5, 2, 1
      ]);
    });
  });

  describe('Currency-Aware Decimal Parsing', () => {
    const usd = CURRENCIES.USD;

    it('parses valid 2-decimal strings to integer minor units without float bugs', () => {
      expect(parseCurrencyAmount(usd, '2.13').minorUnits).toBe(213);
      expect(parseCurrencyAmount(usd, '3.00').minorUnits).toBe(300);
      expect(parseCurrencyAmount(usd, '0.05').minorUnits).toBe(5);
      expect(parseCurrencyAmount(usd, '0.01').minorUnits).toBe(1);
      expect(parseCurrencyAmount(usd, '0.00').minorUnits).toBe(0);
    });

    it('pads single decimal digit fraction to 2 places (e.g. 2.1 -> 210 cents)', () => {
      expect(parseCurrencyAmount(usd, '2.1').minorUnits).toBe(210);
      expect(parseCurrencyAmount(usd, '0.5').minorUnits).toBe(50);
    });

    it('parses whole integer strings without decimal points (e.g. 2 -> 200 cents)', () => {
      expect(parseCurrencyAmount(usd, '2').minorUnits).toBe(200);
      expect(parseCurrencyAmount(usd, '10').minorUnits).toBe(1000);
    });

    it('trims leading and trailing whitespace', () => {
      expect(parseCurrencyAmount(usd, '  2.13  ').minorUnits).toBe(213);
    });

    it('rejects invalid, negative, or malformed decimal strings with InvalidAmountError', () => {
      expect(() => parseCurrencyAmount(usd, '')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, '   ')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, '-1.00')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, '2.')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, '.5')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, '2.134')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, '1e3')).toThrow(InvalidAmountError);
      expect(() => parseCurrencyAmount(usd, 'abc')).toThrow(InvalidAmountError);
    });

    it('supports currencies with 0 minorUnitDigits (e.g. integer-only units)', () => {
      const jpy = createCurrency({
        code: 'JPY',
        name: 'Yen',
        symbol: '¥',
        minorUnitDigits: 0,
        denominations: [
          createDenomination({ code: 'JPY_1000', value: createMoney(1000), singularName: '1000 yen', pluralName: '1000 yen' }),
          createDenomination({ code: 'JPY_1', value: createMoney(1), singularName: '1 yen', pluralName: '1 yen' })
        ]
      });

      expect(parseCurrencyAmount(jpy, '500').minorUnits).toBe(500);
      expect(() => parseCurrencyAmount(jpy, '500.50')).toThrow(InvalidAmountError);
    });
  });
});
