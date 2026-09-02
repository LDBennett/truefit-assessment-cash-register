import { InvalidDivisorError } from '@core/domain/errors/DomainErrors';
import { Money } from '@core/domain/model/Money';
import { RegisterTransaction } from '@core/domain/model/RegisterTransaction';
import {
  StrategyRule,
  StrategySelector
} from '@core/domain/services/StrategySelector';
import { GreedyMinimumChangeStrategy } from '@core/domain/strategies/GreedyMinimumChangeStrategy';
import { RandomChangeStrategy } from '@core/domain/strategies/RandomChangeStrategy';
import { describe, expect, it } from 'vitest';

describe('StrategySelector Domain Service', () => {
  describe('Constructor Validation', () => {
    it('accepts valid integer divisors >= 2', () => {
      const s2 = new StrategySelector(2);
      const s3 = new StrategySelector(3);
      const s10 = new StrategySelector(10);

      expect(s2.divisor).toBe(2);
      expect(s3.divisor).toBe(3);
      expect(s10.divisor).toBe(10);
    });

    it('throws InvalidDivisorError for divisor < 2 or non-integer', () => {
      expect(() => new StrategySelector(0)).toThrow(InvalidDivisorError);
      expect(() => new StrategySelector(1)).toThrow(InvalidDivisorError);
      expect(() => new StrategySelector(-3)).toThrow(InvalidDivisorError);
      expect(() => new StrategySelector(3.5)).toThrow(InvalidDivisorError);
    });
  });

  describe('Default Selection Logic (Divisible by 3)', () => {
    const selector = new StrategySelector(3);

    it('selects RandomChangeStrategy when owed amount is divisible by 3 (Sample 3: 3.33 owed -> 333 cents)', () => {
      const tx = new RegisterTransaction(new Money(333), new Money(500));
      const strategy = selector.select(tx);

      expect(strategy).toBeInstanceOf(RandomChangeStrategy);
      expect(strategy.name).toBe('RandomChange');
    });

    it('selects GreedyMinimumChangeStrategy when owed amount is NOT divisible by 3 (Sample 1: 2.12 owed)', () => {
      const tx = new RegisterTransaction(new Money(212), new Money(300));
      const strategy = selector.select(tx);

      expect(strategy).toBeInstanceOf(GreedyMinimumChangeStrategy);
      expect(strategy.name).toBe('GreedyMinimumChange');
    });

    it('selects GreedyMinimumChangeStrategy for Sample 2 (1.97 owed -> 197 is not divisible by 3)', () => {
      const tx = new RegisterTransaction(new Money(197), new Money(200));
      const strategy = selector.select(tx);

      expect(strategy).toBeInstanceOf(GreedyMinimumChangeStrategy);
    });

    it('selects RandomChangeStrategy when owed is 300 cents (3.00 owed, 3.00 paid -> 300 % 3 == 0)', () => {
      const tx = new RegisterTransaction(new Money(300), new Money(300));
      const strategy = selector.select(tx);

      expect(strategy).toBeInstanceOf(RandomChangeStrategy);
    });
  });

  describe('Configurable Divisor & Custom Rules', () => {
    it('supports custom divisor (e.g. 5)', () => {
      const selector5 = new StrategySelector(5);
      const divBy5Tx = new RegisterTransaction(new Money(250), new Money(300));
      const notDivBy5Tx = new RegisterTransaction(new Money(212), new Money(300));

      expect(selector5.select(divBy5Tx)).toBeInstanceOf(RandomChangeStrategy);
      expect(selector5.select(notDivBy5Tx)).toBeInstanceOf(GreedyMinimumChangeStrategy);
    });

    it('evaluates custom rules first in registered order', () => {
      class SpecialVIPStrategy extends GreedyMinimumChangeStrategy {
        override readonly name = 'SpecialVIPStrategy';
      }

      const vipRule: StrategyRule = {
        name: 'VIPRule',
        predicate: (tx) => tx.owed.minorUnits === 999,
        strategy: new SpecialVIPStrategy()
      };

      const selector = new StrategySelector(3, [vipRule]);
      const vipTx = new RegisterTransaction(new Money(999), new Money(1000));
      // Even though 999 % 3 === 0, VIPRule is evaluated first!
      expect(selector.select(vipTx).name).toBe('SpecialVIPStrategy');
    });
  });
});
