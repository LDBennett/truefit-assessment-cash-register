import {
  ChangeStrategy,
  createChangeDistribution,
  createMoney,
  createStrategySelector,
  createTransaction,
  InvalidDivisorError,
  StrategyRule
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('StrategySelector (Functional Closure Service)', () => {
  describe('Constructor Validation', () => {
    it('accepts valid integer divisors >= 2', () => {
      const s2 = createStrategySelector({ divisor: 2 });
      const s3 = createStrategySelector({ divisor: 3 });
      const s10 = createStrategySelector({ divisor: 10 });

      expect(typeof s2).toBe('function');
      expect(typeof s3).toBe('function');
      expect(typeof s10).toBe('function');
    });

    it('throws InvalidDivisorError for divisor < 2 or non-integer', () => {
      expect(() => createStrategySelector({ divisor: 0 })).toThrow(InvalidDivisorError);
      expect(() => createStrategySelector({ divisor: 1 })).toThrow(InvalidDivisorError);
      expect(() => createStrategySelector({ divisor: -3 })).toThrow(InvalidDivisorError);
      expect(() => createStrategySelector({ divisor: 3.5 })).toThrow(InvalidDivisorError);
    });
  });

  describe('Default Selection Logic (Divisible by 3)', () => {
    const selector = createStrategySelector({ divisor: 3 });

    it('selects RandomChangeStrategy when owed amount is divisible by 3 (Sample 3: 3.33 owed -> 333 cents)', () => {
      const tx = createTransaction(createMoney(333), createMoney(500));
      const strategy = selector(tx);

      expect(strategy.name).toBe('RandomChange');
    });

    it('selects GreedyMinimumChangeStrategy when owed amount is NOT divisible by 3 (Sample 1: 2.12 owed)', () => {
      const tx = createTransaction(createMoney(212), createMoney(300));
      const strategy = selector(tx);

      expect(strategy.name).toBe('GreedyMinimumChange');
    });

    it('selects GreedyMinimumChangeStrategy for Sample 2 (1.97 owed -> 197 is not divisible by 3)', () => {
      const tx = createTransaction(createMoney(197), createMoney(200));
      const strategy = selector(tx);

      expect(strategy.name).toBe('GreedyMinimumChange');
    });

    it('selects RandomChangeStrategy when owed is 300 cents (3.00 owed, 3.00 paid -> 300 % 3 == 0)', () => {
      const tx = createTransaction(createMoney(300), createMoney(300));
      const strategy = selector(tx);

      expect(strategy.name).toBe('RandomChange');
    });
  });

  describe('Configurable Divisor & Custom Rules', () => {
    it('supports custom divisor (e.g. 5)', () => {
      const selector5 = createStrategySelector({ divisor: 5 });
      const divBy5Tx = createTransaction(createMoney(250), createMoney(300));
      const notDivBy5Tx = createTransaction(createMoney(212), createMoney(300));

      expect(selector5(divBy5Tx).name).toBe('RandomChange');
      expect(selector5(notDivBy5Tx).name).toBe('GreedyMinimumChange');
    });

    it('evaluates custom rules first in registered order', () => {
      const vipStrategy: ChangeStrategy = {
        name: 'SpecialVIPStrategy',
        calculate: (changeDue) => createChangeDistribution([], changeDue)
      };

      const vipRule: StrategyRule = {
        name: 'VIPRule',
        predicate: (tx) => tx.owed.minorUnits === 999,
        strategy: vipStrategy
      };

      const selector = createStrategySelector({ divisor: 3, customRules: [vipRule] });
      const vipTx = createTransaction(createMoney(999), createMoney(1000));
      // Even though 999 % 3 === 0, VIPRule is evaluated first!
      expect(selector(vipTx).name).toBe('SpecialVIPStrategy');
    });
  });
});
