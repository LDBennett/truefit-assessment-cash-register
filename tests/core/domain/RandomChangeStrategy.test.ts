import { Currencies } from '@core/domain/model/Currency';
import { Money } from '@core/domain/model/Money';
import { RandomChangeStrategy } from '@core/domain/strategies/RandomChangeStrategy';
import { describe, expect, it } from 'vitest';

describe('RandomChangeStrategy', () => {
  describe('Zero Change', () => {
    it('returns empty distribution for 0 cents changeDue', () => {
      const strategy = new RandomChangeStrategy();
      const dist = strategy.calculate(Money.ZERO, Currencies.USD);
      expect(dist.entries).toHaveLength(0);
      expect(dist.totalValue.isZero()).toBe(true);
    });
  });

  describe('Mathematical Invariant Testing across 1,000 Runs', () => {
    it('always produces exact change matching changeDue (Sample 3: 3.33 owed, 5.00 paid -> 167 cents)', () => {
      const strategy = new RandomChangeStrategy();
      const changeDue = new Money(167);
      const usd = Currencies.USD;

      for (let i = 0; i < 1000; i++) {
        const dist = strategy.calculate(changeDue, usd);
        expect(dist.totalValue.minorUnits).toBe(167);
        expect(dist.entries.length).toBeGreaterThan(0);
      }
    });

    it('always produces exact change for EUR (167 cents EUR)', () => {
      const strategy = new RandomChangeStrategy();
      const changeDue = new Money(167);
      const eur = Currencies.EUR;

      for (let i = 0; i < 200; i++) {
        const dist = strategy.calculate(changeDue, eur);
        expect(dist.totalValue.minorUnits).toBe(167);
      }
    });
  });

  describe('PRNG Boundary Conditions & Clamping', () => {
    it('handles PRNG returning 0 without errors or index out of bounds', () => {
      const zeroRng = () => 0;
      const strategy = new RandomChangeStrategy(zeroRng);
      const dist = strategy.calculate(new Money(15), Currencies.USD);

      expect(dist.totalValue.minorUnits).toBe(15);
    });

    it('handles PRNG returning near-1 (0.9999999) without overshoot or out-of-bounds', () => {
      const nearOneRng = () => 0.9999999999999999;
      const strategy = new RandomChangeStrategy(nearOneRng);
      const dist = strategy.calculate(new Money(55), Currencies.USD);

      expect(dist.totalValue.minorUnits).toBe(55);
    });

    it('handles PRNG that returns exactly 1.0 safely without exceeding bounds', () => {
      const oneRng = () => 1.0;
      const strategy = new RandomChangeStrategy(oneRng);
      const dist = strategy.calculate(new Money(25), Currencies.USD);

      expect(dist.totalValue.minorUnits).toBe(25);
    });

    it('deterministic sequence produces repeatable distribution', () => {
      const sequence = [0.1, 0.4, 0.7, 0.2, 0.9, 0.3];
      let seqIdx1 = 0;
      let seqIdx2 = 0;

      const rng1 = () => sequence[seqIdx1++ % sequence.length]!;
      const rng2 = () => sequence[seqIdx2++ % sequence.length]!;

      const s1 = new RandomChangeStrategy(rng1);
      const s2 = new RandomChangeStrategy(rng2);

      const d1 = s1.calculate(new Money(88), Currencies.USD);
      const d2 = s2.calculate(new Money(88), Currencies.USD);

      expect(d1.entries.map((e) => `${e.count}x${e.denomination.code}`)).toEqual(
        d2.entries.map((e) => `${e.count}x${e.denomination.code}`)
      );
    });
  });
});
