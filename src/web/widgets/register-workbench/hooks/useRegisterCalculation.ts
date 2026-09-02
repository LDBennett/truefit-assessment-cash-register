import {
  createCashRegister,
  createStrategySelector,
  CURRENCIES,
  Currency,
  formatDistributions,
  parseInputText,
  ParseResult,
  RegisterTransaction,
  TransactionResult
} from '@core/index';
import { useMemo, useRef } from 'react';

import { TransactionLineItem } from '@/entities';

export interface UseRegisterCalculationOptions {
  readonly inputText: string;
  readonly currencyCode: 'USD' | 'EUR';
  readonly divisor: number;
  readonly rerollKey: number;
}

export interface UseRegisterCalculationResult {
  readonly currency: Currency;
  readonly safeDivisor: number;
  readonly isDivisorValid: boolean;
  readonly parseResult: ParseResult;
  readonly lineItems: readonly TransactionLineItem[];
  readonly formattedOutput: string;
}

export function useRegisterCalculation(
  options: UseRegisterCalculationOptions
): UseRegisterCalculationResult {
  const { inputText, currencyCode, divisor, rerollKey } = options;

  const isDivisorValid = Number.isInteger(divisor) && divisor >= 2;
  const safeDivisor = isDivisorValid ? divisor : 3;

  const currency = CURRENCIES[currencyCode];

  const register = useMemo(() => {
    return createCashRegister({
      currency,
      selector: createStrategySelector({ divisor: safeDivisor })
    });
  }, [currency, safeDivisor]);

  const parseResult = useMemo(() => {
    return parseInputText(inputText, { currency, ignoreEmptyLines: true });
  }, [inputText, currency]);

  // Per-line result cache: preserves random breakdowns of unchanged lines across keystrokes
  const resultCacheRef = useRef<Map<string, TransactionResult>>(new Map());
  const prevConfigRef = useRef<{
    rerollKey: number;
    currencyCode: string;
    safeDivisor: number;
  }>({
    rerollKey,
    currencyCode,
    safeDivisor
  });

  // Synchronously invalidate cache only when explicit re-roll is requested or configuration changes
  if (
    prevConfigRef.current.rerollKey !== rerollKey ||
    prevConfigRef.current.currencyCode !== currencyCode ||
    prevConfigRef.current.safeDivisor !== safeDivisor
  ) {
    resultCacheRef.current.clear();
    prevConfigRef.current = { rerollKey, currencyCode, safeDivisor };
  }

  const lineItems: readonly TransactionLineItem[] = useMemo(() => {
    const cache = resultCacheRef.current;

    return parseResult.lines
      .filter(
        (line): line is typeof line & { transaction: RegisterTransaction } =>
          line.transaction !== null
      )
      .map((line) => {
        const cacheKey = `${rerollKey}:${currencyCode}:${safeDivisor}:${line.rawLine}`;
        let res = cache.get(cacheKey);

        if (!res) {
          res = register(line.transaction);
          cache.set(cacheKey, res);
        }

        return {
          lineNumber: line.lineNumber,
          rawLine: line.rawLine,
          result: res
        };
      });
  }, [parseResult.lines, register, rerollKey, currencyCode, safeDivisor]);

  const formattedOutput = useMemo(() => {
    return formatDistributions(
      lineItems.map((item) => item.result.distribution)
    );
  }, [lineItems]);

  return {
    currency,
    safeDivisor,
    isDivisorValid,
    parseResult,
    lineItems,
    formattedOutput
  };
}
