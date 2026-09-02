import {
  calculateRandomChange,
  createDenomination,
  createMoney,
  createRandomChangeStrategy,
  CURRENCIES,
  Currency,
  InvalidCurrencyError,
  isZeroMoney,
  MONEY_ZERO
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('RandomChangeStrategy (Functional)', () => {
  describe('Zero Change', () => {
    it('returns empty distribution for 0 cents changeDue', () => {
      const dist = calculateRandomChange(MONEY_ZERO, CURRENCIES.USD);
      expect(dist.entries).toHaveLength(0);
      expect(isZeroMoney(dist.totalValue)).toBe(true);
    });
  });

  describe('Mathematical Invariant Testing across 1,000 Runs', () => {
    it('always produces exact change matching changeDue (Sample 3: 3.33 owed, 5.00 paid -> 167 cents)', () => {
      const changeDue = createMoney(167);
      const usd = CURRENCIES.USD;

      for (let i = 0; i < 1000; i++) {
        const dist = calculateRandomChange(changeDue, usd);
        expect(dist.totalValue.minorUnits).toBe(167);
        expect(dist.entries.length).toBeGreaterThan(0);
      }
    });

    it('always produces exact change for EUR (167 cents EUR)', () => {
      const changeDue = createMoney(167);
      const eur = CURRENCIES.EUR;

      for (let i = 0; i < 200; i++) {
        const dist = calculateRandomChange(changeDue, eur);
        expect(dist.totalValue.minorUnits).toBe(167);
      }
    });
  });

  describe('PRNG Boundary Conditions & Clamping', () => {
    it('handles PRNG returning 0 without errors or index out of bounds', () => {
      const zeroRng = () => 0;
      const dist = calculateRandomChange(createMoney(15), CURRENCIES.USD, zeroRng);

      expect(dist.totalValue.minorUnits).toBe(15);
    });

    it('handles PRNG returning near-1 (0.9999999) without overshoot or out-of-bounds', () => {
      const nearOneRng = () => 0.9999999999999999;
      const dist = calculateRandomChange(createMoney(55), CURRENCIES.USD, nearOneRng);

      expect(dist.totalValue.minorUnits).toBe(55);
    });

    it('handles PRNG that returns exactly 1.0 safely without exceeding bounds', () => {
      const oneRng = () => 1.0;
      const dist = calculateRandomChange(createMoney(25), CURRENCIES.USD, oneRng);

      expect(dist.totalValue.minorUnits).toBe(25);
    });

    it('deterministic sequence produces repeatable distribution via createRandomChangeStrategy', () => {
      const sequence = [0.1, 0.4, 0.7, 0.2, 0.9, 0.3];
      let seqIdx1 = 0;
      let seqIdx2 = 0;

      const rng1 = () => sequence[seqIdx1++ % sequence.length]!;
      const rng2 = () => sequence[seqIdx2++ % sequence.length]!;

      const s1 = createRandomChangeStrategy(rng1);
      const s2 = createRandomChangeStrategy(rng2);

      const d1 = s1.calculate(createMoney(88), CURRENCIES.USD);
      const d2 = s2.calculate(createMoney(88), CURRENCIES.USD);

      expect(d1.entries.map((e) => `${e.count}x${e.denomination.code}`)).toEqual(
        d2.entries.map((e) => `${e.count}x${e.denomination.code}`)
      );
    });

    it('throws InvalidCurrencyError defensively if valid denominations are empty', () => {
      const brokenCurrency = {
        code: 'BROKEN',
        denominations: [
          createDenomination({
            code: 'B_10',
            value: createMoney(10),
            singularName: 'ten',
            pluralName: 'tens'
          })
        ],
        __brand: 'Currency'
      } as unknown as Currency;
      expect(() => calculateRandomChange(createMoney(5), brokenCurrency)).toThrow(
        InvalidCurrencyError
      );
    });
  });
});
