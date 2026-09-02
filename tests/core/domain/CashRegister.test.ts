import { Currencies } from '@core/domain/model/Currency';
import { Money } from '@core/domain/model/Money';
import { RegisterTransaction } from '@core/domain/model/RegisterTransaction';
import { CashRegister } from '@core/domain/services/CashRegister';
import { describe, expect, it } from 'vitest';

describe('CashRegister Domain Service', () => {
  const register = new CashRegister();

  describe('USD Transactions', () => {
    it('processes Sample 1: 2.12 owed, 3.00 paid -> greedy strategy, 88 cents', () => {
      const tx = new RegisterTransaction(new Money(212), new Money(300));
      const result = register.process(tx, Currencies.USD);

      expect(result.strategyName).toBe('GreedyMinimumChange');
      expect(result.distribution.changeDue.minorUnits).toBe(88);
      expect(result.distribution.totalValue.minorUnits).toBe(88);
      expect(result.distribution.entries).toHaveLength(3);
    });

    it('processes Sample 2: 1.97 owed, 2.00 paid -> greedy strategy, 3 cents', () => {
      const tx = new RegisterTransaction(new Money(197), new Money(200));
      const result = register.process(tx, Currencies.USD);

      expect(result.strategyName).toBe('GreedyMinimumChange');
      expect(result.distribution.changeDue.minorUnits).toBe(3);
      expect(result.distribution.entries[0]!.denomination.code).toBe('USD_PENNY');
      expect(result.distribution.entries[0]!.count).toBe(3);
    });

    it('processes Sample 3: 3.33 owed, 5.00 paid -> random strategy, 167 cents', () => {
      const tx = new RegisterTransaction(new Money(333), new Money(500));
      const result = register.process(tx, Currencies.USD);

      expect(result.strategyName).toBe('RandomChange');
      expect(result.distribution.changeDue.minorUnits).toBe(167);
      expect(result.distribution.totalValue.minorUnits).toBe(167);
    });

    it('processes exact payment on random path (3.00 owed, 3.00 paid -> 300 % 3 == 0 -> 0 change)', () => {
      const tx = new RegisterTransaction(new Money(300), new Money(300));
      const result = register.process(tx, Currencies.USD);

      expect(result.strategyName).toBe('RandomChange');
      expect(result.distribution.changeDue.isZero()).toBe(true);
      expect(result.distribution.entries).toHaveLength(0);
    });
  });

  describe('EUR Transactions', () => {
    it('processes EUR transaction: 1.33 owed, 2.00 paid -> greedy strategy, 67 cents EUR', () => {
      const tx = new RegisterTransaction(new Money(133), new Money(200));
      const result = register.process(tx, Currencies.EUR);

      expect(result.strategyName).toBe('GreedyMinimumChange');
      expect(result.distribution.changeDue.minorUnits).toBe(67);
      expect(result.distribution.entries.map((e) => e.denomination.format(e.count))).toEqual([
        '1 50-cent coin',
        '1 10-cent coin',
        '1 5-cent coin',
        '1 2-cent coin'
      ]);
    });

    it('processes EUR transaction on random path (3.33 owed, 5.00 paid -> 167 cents EUR)', () => {
      const tx = new RegisterTransaction(new Money(333), new Money(500));
      const result = register.process(tx, Currencies.EUR);

      expect(result.strategyName).toBe('RandomChange');
      expect(result.distribution.changeDue.minorUnits).toBe(167);
      expect(result.distribution.totalValue.minorUnits).toBe(167);
    });
  });
});
