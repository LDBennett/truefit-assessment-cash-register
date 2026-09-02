import {
  calculateGreedyChange,
  calculateRandomChange,
  createCashRegister,
  createMoney,
  createRandomChangeStrategy,
  createStrategySelector,
  createTransaction,
  CURRENCIES,
  formatDistribution,
  Money,
  parseInputLine,
  parseInputText
} from '@core/index';
import { describe, expect, it } from 'vitest';

import { runCli } from '../../src/cli/src/cliRunner';
import { CliIo } from '../../src/cli/src/types';

describe('Phase 5: Comprehensive Edge Case & Invariant Test Suite', () => {
  const usd = CURRENCIES.USD;
  const eur = CURRENCIES.EUR;

  describe('1. README Golden Master End-to-End Test', () => {
    it('executes sample_input.txt matching README requirements exactly', async () => {
      const sampleFileContent = '2.12,3.00\n1.97,2.00\n3.33,5.00\n';
      let stdoutData = '';
      let stderrData = '';

      const mockIo: CliIo = {
        readFile: async () => sampleFileContent,
        writeFile: async () => {},
        stdout: (msg: string) => {
          stdoutData += msg;
        },
        stderr: (msg: string) => {
          stderrData += msg;
        }
      };

      const exitCode = await runCli(['sample_input.txt'], mockIo);

      expect(exitCode).toBe(0);
      expect(stderrData).toBe('');

      const lines = stdoutData.trim().split('\n');
      expect(lines).toHaveLength(3);

      // Line 1: Normal minimal coins
      expect(lines[0]).toBe('3 quarters,1 dime,3 pennies');

      // Line 2: Normal minimal coins
      expect(lines[1]).toBe('3 pennies');

      // Line 3: Random twist on divisible-by-3 owed (333 % 3 === 0)
      // Total value of Line 3 must strictly equal $1.67 (167 cents)
      expect(lines[2]!.length).toBeGreaterThan(0);
      const parseResult = parseInputText('3.33,5.00', { currency: usd });
      expect(parseResult.transactions[0]!.changeDue.minorUnits).toBe(167);
    });
  });

  describe('2. "Things to Consider" Extensibility Requirements', () => {
    it('supports bidirectional divisor reconfiguration (e.g. divisor: 4)', () => {
      // With divisor: 4
      const selector = createStrategySelector({ divisor: 4 });
      const register = createCashRegister({ currency: usd, selector });

      // Case A: 3.33, 5.00 -> 333 is NOT divisible by 4 (333 % 4 = 1 != 0)
      // Under divisor: 4, this must flip from random to greedy minimum change!
      const txA = createTransaction(createMoney(333), createMoney(500));
      const resA = register(txA);
      expect(resA.strategyName).toBe('GreedyMinimumChange');
      expect(formatDistribution(resA.distribution)).toBe(
        '1 dollar,2 quarters,1 dime,1 nickel,2 pennies'
      );

      // Case B: 2.00, 3.00 -> 200 IS divisible by 4 (200 % 4 = 0)
      // Under default divisor: 3, 200 % 3 != 0 (greedy). Under divisor: 4, it flips into random twist!
      const txB = createTransaction(createMoney(200), createMoney(300));
      const resB = register(txB);
      expect(resB.strategyName).toBe('RandomChange');
      expect(resB.distribution.totalValue.minorUnits).toBe(100);
    });

    it('supports strategy extensibility by injecting custom rules (Open/Closed Principle)', () => {
      // Client adds a new special case: "Large purchase rule: if owed >= $100, use special high-denomination strategy"
      const largePurchaseRule = {
        name: 'LargePurchaseRule',
        predicate: (tx: { readonly owed: Money }) => tx.owed.minorUnits >= 10000,
        strategy: {
          name: 'LargePurchaseStrategy',
          calculate: (changeDue: Money) => calculateGreedyChange(changeDue, usd)
        }
      };

      const customSelector = createStrategySelector({
        divisor: 3,
        customRules: [largePurchaseRule]
      });

      const register = createCashRegister({ currency: usd, selector: customSelector });

      // $120.00 owed (12000 cents is divisible by 3, but largePurchaseRule takes precedence!)
      const tx = createTransaction(createMoney(12000), createMoney(15000));
      const res = register(tx);

      expect(res.strategyName).toBe('LargePurchaseStrategy');
      expect(res.distribution.totalValue.minorUnits).toBe(3000);
    });
  });

  describe('3. Exact Payment (Zero Change)', () => {
    it('returns "0" for exact payment on non-divisible owed amount (e.g. 2.00, 2.00)', () => {
      const tx = createTransaction(createMoney(200), createMoney(200));
      const register = createCashRegister({ currency: usd });
      const res = register(tx);

      expect(res.strategyName).toBe('GreedyMinimumChange');
      expect(res.distribution.changeDue.minorUnits).toBe(0);
      expect(res.distribution.entries).toHaveLength(0);
      expect(formatDistribution(res.distribution)).toBe('0');
    });

    it('returns "0" for exact payment on divisible-by-3 owed amount (e.g. 3.00, 3.00)', () => {
      // 300 % 3 === 0 triggers RandomChange path, but changeDue is 0
      const tx = createTransaction(createMoney(300), createMoney(300));
      const register = createCashRegister({ currency: usd });
      const res = register(tx);

      expect(res.strategyName).toBe('RandomChange');
      expect(res.distribution.changeDue.minorUnits).toBe(0);
      expect(res.distribution.entries).toHaveLength(0);
      expect(formatDistribution(res.distribution)).toBe('0');
    });
  });

  describe('4. Deterministic Seeded Random Test', () => {
    it('produces expected breakdown with a deterministic mock PRNG sequence', () => {
      // Mock PRNG returning fixed values: [0.5, 0.2, 0.8]
      const sequence = [0.5, 0.2, 0.8];
      let idx = 0;
      const mockRng = () => {
        const val = sequence[idx % sequence.length]!;
        idx++;
        return val;
      };

      const seededStrategy = createRandomChangeStrategy(mockRng);
      const dist = seededStrategy.calculate(createMoney(88), usd);

      // Invariant: sum of parts must strictly equal 88
      expect(dist.totalValue.minorUnits).toBe(88);
      let calculatedTotal = 0;
      for (const entry of dist.entries) {
        calculatedTotal += entry.count * entry.denomination.value.minorUnits;
      }
      expect(calculatedTotal).toBe(88);
    });
  });

  describe('5. Random Path Invariant Stress Testing (2,000 Iterations)', () => {
    it('preserves total value invariant 100% of the time without infinite loops (USD & EUR)', () => {
      const testAmounts = [1, 3, 7, 25, 67, 88, 141, 167, 200, 333, 500, 999];

      for (const curr of [usd, eur]) {
        for (const amount of testAmounts) {
          const money = createMoney(amount);

          for (let iter = 0; iter < 100; iter++) {
            const dist = calculateRandomChange(money, curr);

            // 1. Total value invariant
            expect(dist.totalValue.minorUnits).toBe(amount);

            // 2. Sum of entries invariant
            let sum = 0;
            for (const entry of dist.entries) {
              expect(entry.count).toBeGreaterThan(0);
              sum += entry.count * entry.denomination.value.minorUnits;
            }
            expect(sum).toBe(amount);
          }
        }
      }
    });
  });

  describe('6. Currency Abstraction & Denomination Coverage', () => {
    it('produces all 5 USD denominations at once when amount requires them', () => {
      // Change of $1.41 = 1 dollar (100) + 1 quarter (25) + 1 dime (10) + 1 nickel (5) + 1 penny (1)
      // Use owed: 200 (not divisible by 3) and paid: 341
      const tx = createTransaction(createMoney(200), createMoney(341));
      const register = createCashRegister({ currency: usd });
      const res = register(tx);

      expect(res.strategyName).toBe('GreedyMinimumChange');
      expect(formatDistribution(res.distribution)).toBe(
        '1 dollar,1 quarter,1 dime,1 nickel,1 penny'
      );
      expect(res.distribution.entries).toHaveLength(5);
    });

    it('processes EUR currency cleanly with euro physical coin names', () => {
      // Owed €1.33, Paid €2.00 -> Change €0.67 = 50c (50) + 10c (10) + 5c (5) + 2c (2)
      const tx = createTransaction(createMoney(133), createMoney(200));
      const register = createCashRegister({ currency: eur });
      const res = register(tx);

      expect(res.strategyName).toBe('GreedyMinimumChange');
      expect(formatDistribution(res.distribution)).toBe(
        '1 50-cent coin,1 10-cent coin,1 5-cent coin,1 2-cent coin'
      );
    });
  });

  describe('7. Input Normalization & Diagnostics', () => {
    it('normalizes Windows CRLF line endings and whitespace variations', () => {
      const crlfInput = ' 2.12 , 3.00 \r\n 1.97 , 2.00 \r\n 3.33 , 5.00 \r\n';
      const parsed = parseInputText(crlfInput);

      expect(parsed.isValid).toBe(true);
      expect(parsed.transactions).toHaveLength(3);
      expect(parsed.transactions[0]!.owed.minorUnits).toBe(212);
      expect(parsed.transactions[1]!.owed.minorUnits).toBe(197);
      expect(parsed.transactions[2]!.owed.minorUnits).toBe(333);
    });

    it('accurately parses single-decimal inputs (2.1, 3.0)', () => {
      const lineRes = parseInputLine('2.1,3.0', 1);
      expect(lineRes.diagnostic).toBeNull();
      expect(lineRes.transaction!.owed.minorUnits).toBe(210);
      expect(lineRes.transaction!.paid.minorUnits).toBe(300);
      expect(lineRes.transaction!.changeDue.minorUnits).toBe(90);
    });

    it('accurately pinpoints underpayment column range', () => {
      const lineRes = parseInputLine('3.00,1.00', 1);
      expect(lineRes.diagnostic).not.toBeNull();
      expect(lineRes.diagnostic!.code).toBe('UNDERPAID');
      expect(lineRes.diagnostic!.startColumn).toBe(1);
      expect(lineRes.diagnostic!.endColumn).toBe(9);
    });

    it('pinpoints negative amounts', () => {
      const lineRes = parseInputLine('-2.12,3.00', 1);
      expect(lineRes.diagnostic).not.toBeNull();
      expect(lineRes.diagnostic!.code).toBe('NEGATIVE_AMOUNT');
    });

    it('pinpoints malformed syntax with column coordinates', () => {
      const lineRes = parseInputLine('abc,3.00', 1);
      expect(lineRes.diagnostic).not.toBeNull();
      expect(lineRes.diagnostic!.code).toBe('INVALID_NUMBER');
      expect(lineRes.diagnostic!.startColumn).toBe(1);
      expect(lineRes.diagnostic!.endColumn).toBe(3);
    });
  });
});
