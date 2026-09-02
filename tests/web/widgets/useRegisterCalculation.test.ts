// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRegisterCalculation } from '@/widgets/register-workbench/hooks/useRegisterCalculation';

describe('useRegisterCalculation (widgets/register-workbench/hooks)', () => {
  const sampleInput = '2.12,3.00\n1.97,2.00\n3.33,5.00';

  it('calculates sample transactions and preserves line linkage', () => {
    const { result } = renderHook(() =>
      useRegisterCalculation({
        inputText: sampleInput,
        currencyCode: 'USD',
        divisor: 3,
        rerollKey: 0
      })
    );

    expect(result.current.isDivisorValid).toBe(true);
    expect(result.current.safeDivisor).toBe(3);
    expect(result.current.currency.code).toBe('USD');
    expect(result.current.parseResult.isValid).toBe(true);
    expect(result.current.lineItems).toHaveLength(3);

    // Line linkage checks
    expect(result.current.lineItems[0]!.lineNumber).toBe(1);
    expect(result.current.lineItems[0]!.rawLine).toBe('2.12,3.00');
    expect(result.current.lineItems[0]!.result.strategyName).toBe('GreedyMinimumChange');
    expect(result.current.lineItems[0]!.result.transaction.changeDue.minorUnits).toBe(88);

    expect(result.current.lineItems[1]!.lineNumber).toBe(2);
    expect(result.current.lineItems[1]!.rawLine).toBe('1.97,2.00');
    expect(result.current.lineItems[1]!.result.strategyName).toBe('GreedyMinimumChange');
    expect(result.current.lineItems[1]!.result.transaction.changeDue.minorUnits).toBe(3);

    expect(result.current.lineItems[2]!.lineNumber).toBe(3);
    expect(result.current.lineItems[2]!.rawLine).toBe('3.33,5.00');
    expect(result.current.lineItems[2]!.result.strategyName).toBe('RandomChange');
    expect(result.current.lineItems[2]!.result.transaction.changeDue.minorUnits).toBe(167);

    // Formatted multi-line preview
    expect(result.current.formattedOutput).toContain('3 quarters,1 dime,3 pennies');
    expect(result.current.formattedOutput).toContain('3 pennies');
  });

  it('safely guards against invalid or empty divisor inputs without throwing', () => {
    const { result: res1 } = renderHook(() =>
      useRegisterCalculation({
        inputText: '2.12,3.00',
        currencyCode: 'USD',
        divisor: 1, // invalid: < 2
        rerollKey: 0
      })
    );
    expect(res1.current.isDivisorValid).toBe(false);
    expect(res1.current.safeDivisor).toBe(3); // fallback to 3

    const { result: res2 } = renderHook(() =>
      useRegisterCalculation({
        inputText: '2.12,3.00',
        currencyCode: 'USD',
        divisor: NaN, // invalid: NaN
        rerollKey: 0
      })
    );
    expect(res2.current.isDivisorValid).toBe(false);
    expect(res2.current.safeDivisor).toBe(3);
  });

  it('re-evaluates transactions when currencyCode is changed to EUR', () => {
    const { result } = renderHook(() =>
      useRegisterCalculation({
        inputText: '1.33,2.00',
        currencyCode: 'EUR',
        divisor: 3,
        rerollKey: 0
      })
    );

    expect(result.current.currency.code).toBe('EUR');
    expect(result.current.lineItems[0]!.result.distribution.entries[0]!.denomination.code).toBe(
      'EUR_50_CENT'
    );
  });

  it('preserves random breakdown of unchanged lines when modifying an unrelated line (per-line twist caching)', () => {
    let currentInput = '3.33,5.00\n1.00,2.00';
    let rerollKey = 0;

    const { result, rerender } = renderHook(() =>
      useRegisterCalculation({
        inputText: currentInput,
        currencyCode: 'USD',
        divisor: 3,
        rerollKey
      })
    );

    const initialRandomEntries = result.current.lineItems[0]!.result.distribution.entries;

    // Simulate editing line 2 while line 1 remains unchanged
    currentInput = '3.33,5.00\n1.00,3.00';
    rerender();

    const cachedRandomEntries = result.current.lineItems[0]!.result.distribution.entries;
    // Must be referentially identical or equal distribution because it hit the per-line cache
    expect(cachedRandomEntries).toEqual(initialRandomEntries);

    // Now trigger an explicit re-roll
    rerollKey = 1;
    rerender();
    // Cache was cleared on rerollKey change
    expect(result.current.lineItems[0]!.result.transaction.changeDue.minorUnits).toBe(167);
  });

  it('captures parse diagnostics for invalid lines', () => {
    const { result } = renderHook(() =>
      useRegisterCalculation({
        inputText: '2.12,3.00\n3.00,1.00\nabc',
        currencyCode: 'USD',
        divisor: 3,
        rerollKey: 0
      })
    );

    expect(result.current.parseResult.isValid).toBe(false);
    expect(result.current.parseResult.diagnostics.length).toBeGreaterThanOrEqual(2);
    expect(result.current.lineItems).toHaveLength(1); // Only line 1 is valid
  });
});
