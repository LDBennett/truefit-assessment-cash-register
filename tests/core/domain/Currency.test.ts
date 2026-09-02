import { InvalidAmountError, InvalidCurrencyError } from '@core/domain/errors/DomainErrors';
import { Currencies, Currency } from '@core/domain/model/Currency';
import { Denomination } from '@core/domain/model/Denomination';
import { Money } from '@core/domain/model/Money';
import { describe, expect, it } from 'vitest';

describe('Currency Value Object & Static Registry', () => {
  describe('Structural Invariants', () => {
    it('creates Currency when an atomic 1-minor-unit denomination is present', () => {
      const custom = new Currency('TEST', 'Test Currency', 'T', 2, [
        new Denomination('TEST_10', new Money(10), 'ten', 'tens'),
        new Denomination('TEST_1', new Money(1), 'one', 'ones')
      ]);
      expect(custom.code).toBe('TEST');
      expect(custom.denominations).toHaveLength(2);
    });

    it('throws InvalidCurrencyError if no atomic 1-minor-unit denomination exists', () => {
      expect(
        () =>
          new Currency('INVALID', 'No Penny', 'N', 2, [
            new Denomination('INV_10', new Money(10), 'ten', 'tens'),
            new Denomination('INV_5', new Money(5), 'five', 'fives')
          ])
      ).toThrow(InvalidCurrencyError);
    });

    it('automatically sorts denominations descending by value upon construction', () => {
      const unsorted = new Currency('SORTED', 'Sorted', 'S', 2, [
        new Denomination('S_1', new Money(1), 'one', 'ones'),
        new Denomination('S_25', new Money(25), 'quarter', 'quarters'),
        new Denomination('S_10', new Money(10), 'dime', 'dimes')
      ]);

      expect(unsorted.denominations[0]!.value.minorUnits).toBe(25);
      expect(unsorted.denominations[1]!.value.minorUnits).toBe(10);
      expect(unsorted.denominations[2]!.value.minorUnits).toBe(1);
    });
  });

  describe('Static Currencies Registry', () => {
    it('Currencies.USD contains the canonical 5 denominations in descending order', () => {
      const usd = Currencies.USD;
      expect(usd.code).toBe('USD');
      expect(usd.symbol).toBe('$');
      expect(usd.minorUnitDigits).toBe(2);
      expect(usd.denominations).toHaveLength(5);
      expect(usd.denominations.map((d) => d.value.minorUnits)).toEqual([100, 25, 10, 5, 1]);
    });

    it('Currencies.EUR contains the canonical 8 denominations in descending order', () => {
      const eur = Currencies.EUR;
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
    const usd = Currencies.USD;

    it('parses valid 2-decimal strings to integer minor units without float bugs', () => {
      expect(usd.parse('2.13').minorUnits).toBe(213);
      expect(usd.parse('3.00').minorUnits).toBe(300);
      expect(usd.parse('0.05').minorUnits).toBe(5);
      expect(usd.parse('0.01').minorUnits).toBe(1);
      expect(usd.parse('0.00').minorUnits).toBe(0);
    });

    it('pads single decimal digit fraction to 2 places (e.g. 2.1 -> 210 cents)', () => {
      expect(usd.parse('2.1').minorUnits).toBe(210);
      expect(usd.parse('0.5').minorUnits).toBe(50);
    });

    it('parses whole integer strings without decimal points (e.g. 2 -> 200 cents)', () => {
      expect(usd.parse('2').minorUnits).toBe(200);
      expect(usd.parse('10').minorUnits).toBe(1000);
    });

    it('trims leading and trailing whitespace', () => {
      expect(usd.parse('  2.13  ').minorUnits).toBe(213);
    });

    it('rejects invalid, negative, or malformed decimal strings with InvalidAmountError', () => {
      expect(() => usd.parse('')).toThrow(InvalidAmountError);
      expect(() => usd.parse('   ')).toThrow(InvalidAmountError);
      expect(() => usd.parse('-1.00')).toThrow(InvalidAmountError);
      expect(() => usd.parse('2.')).toThrow(InvalidAmountError);
      expect(() => usd.parse('.5')).toThrow(InvalidAmountError);
      expect(() => usd.parse('2.134')).toThrow(InvalidAmountError); // exceeds minorUnitDigits
      expect(() => usd.parse('1e3')).toThrow(InvalidAmountError);
      expect(() => usd.parse('abc')).toThrow(InvalidAmountError);
    });

    it('supports currencies with 0 minorUnitDigits (e.g. integer-only units)', () => {
      const jpy = new Currency('JPY', 'Yen', '¥', 0, [
        new Denomination('JPY_1000', new Money(1000), '1000 yen', '1000 yen'),
        new Denomination('JPY_1', new Money(1), '1 yen', '1 yen')
      ]);

      expect(jpy.parse('500').minorUnits).toBe(500);
      expect(() => jpy.parse('500.50')).toThrow(InvalidAmountError);
    });
  });
});
