import { InvalidAmountError, InvalidDivisorError } from '../../errors';
import { Money } from '../types';

export const MONEY_ZERO: Money = Object.freeze({
  minorUnits: 0,
  __brand: 'Money' as const
});

export function createMoney(minorUnits: number): Money {
  if (!Number.isInteger(minorUnits) || minorUnits < 0) {
    throw new InvalidAmountError(
      `Monetary amounts must be non-negative integers. Received: ${minorUnits}`
    );
  }
  return Object.freeze({
    minorUnits,
    __brand: 'Money' as const
  });
}

export function addMoney(a: Money, b: Money): Money {
  return createMoney(a.minorUnits + b.minorUnits);
}

export function subtractMoney(minuend: Money, subtrahend: Money): Money {
  const difference = minuend.minorUnits - subtrahend.minorUnits;
  if (difference < 0) {
    throw new InvalidAmountError(
      `Cannot subtract ${subtrahend.minorUnits} from ${minuend.minorUnits}: negative result.`
    );
  }
  return createMoney(difference);
}

export function equalsMoney(a: Money, b: Money): boolean {
  return a.minorUnits === b.minorUnits;
}

export function isGreaterThanMoney(a: Money, b: Money): boolean {
  return a.minorUnits > b.minorUnits;
}

export function isLessThanMoney(a: Money, b: Money): boolean {
  return a.minorUnits < b.minorUnits;
}

export function isZeroMoney(m: Money): boolean {
  return m.minorUnits === 0;
}

export function isDivisibleMoney(m: Money, divisor: number): boolean {
  if (!Number.isInteger(divisor) || divisor < 1) {
    throw new InvalidDivisorError(
      `Divisor must be an integer greater than or equal to 1. Received: ${divisor}`
    );
  }
  return m.minorUnits % divisor === 0;
}

export function formatMoney(m: Money): string {
  return `${m.minorUnits} minor units`;
}
