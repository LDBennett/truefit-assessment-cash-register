import {
  addMoney,
  createMoney,
  equalsMoney,
  formatMoney,
  InvalidAmountError,
  InvalidDivisorError,
  isDivisibleMoney,
  isGreaterThanMoney,
  isLessThanMoney,
  isZeroMoney,
  MONEY_ZERO,
  subtractMoney
} from '@core/index';
import { describe, expect, it } from 'vitest';

describe('Money (Functional Value Object)', () => {
  describe('Construction & Invariants', () => {
    it('creates Money with valid non-negative integer minor units', () => {
      const money = createMoney(212);
      expect(money.minorUnits).toBe(212);
      expect(formatMoney(money)).toBe('212 minor units');
    });

    it('provides a static MONEY_ZERO constant', () => {
      expect(MONEY_ZERO.minorUnits).toBe(0);
      expect(isZeroMoney(MONEY_ZERO)).toBe(true);
    });

    it('rejects negative numbers', () => {
      expect(() => createMoney(-1)).toThrow(InvalidAmountError);
    });

    it('rejects fractional numbers (no floating-point cents allowed)', () => {
      expect(() => createMoney(2.12)).toThrow(InvalidAmountError);
    });

    it('rejects NaN and Infinity', () => {
      expect(() => createMoney(NaN)).toThrow(InvalidAmountError);
      expect(() => createMoney(Infinity)).toThrow(InvalidAmountError);
    });

    it('returns a frozen immutable object', () => {
      const money = createMoney(100);
      expect(Object.isFrozen(money)).toBe(true);
    });
  });

  describe('Arithmetic Operations (Pure & Immutable)', () => {
    it('adds two Money instances returning a new instance without mutating originals', () => {
      const m1 = createMoney(150);
      const m2 = createMoney(75);
      const result = addMoney(m1, m2);

      expect(result.minorUnits).toBe(225);
      expect(m1.minorUnits).toBe(150);
      expect(m2.minorUnits).toBe(75);
    });

    it('subtracts two Money instances returning a new instance', () => {
      const m1 = createMoney(200);
      const m2 = createMoney(75);
      const result = subtractMoney(m1, m2);

      expect(result.minorUnits).toBe(125);
      expect(m1.minorUnits).toBe(200);
    });

    it('throws InvalidAmountError when subtraction yields a negative result', () => {
      const m1 = createMoney(50);
      const m2 = createMoney(100);

      expect(() => subtractMoney(m1, m2)).toThrow(InvalidAmountError);
    });
  });

  describe('Comparisons', () => {
    it('correctly compares equality', () => {
      const m1 = createMoney(100);
      const m2 = createMoney(100);
      const m3 = createMoney(101);

      expect(equalsMoney(m1, m2)).toBe(true);
      expect(equalsMoney(m1, m3)).toBe(false);
    });

    it('correctly evaluates isGreaterThanMoney and isLessThanMoney', () => {
      const smaller = createMoney(50);
      const larger = createMoney(100);

      expect(isGreaterThanMoney(larger, smaller)).toBe(true);
      expect(isGreaterThanMoney(smaller, larger)).toBe(false);
      expect(isLessThanMoney(smaller, larger)).toBe(true);
      expect(isLessThanMoney(larger, smaller)).toBe(false);
      expect(isGreaterThanMoney(smaller, smaller)).toBe(false);
    });

    it('correctly checks isZeroMoney', () => {
      expect(isZeroMoney(createMoney(0))).toBe(true);
      expect(isZeroMoney(createMoney(1))).toBe(false);
    });
  });

  describe('Divisibility', () => {
    it('returns true when minorUnits is divisible by divisor', () => {
      expect(isDivisibleMoney(createMoney(333), 3)).toBe(true);
      expect(isDivisibleMoney(createMoney(300), 3)).toBe(true);
      expect(isDivisibleMoney(createMoney(0), 3)).toBe(true);
    });

    it('returns false when minorUnits is not divisible by divisor', () => {
      expect(isDivisibleMoney(createMoney(212), 3)).toBe(false);
      expect(isDivisibleMoney(createMoney(197), 3)).toBe(false);
    });

    it('throws InvalidDivisorError for divisor < 1 or non-integer', () => {
      const m = createMoney(100);
      expect(() => isDivisibleMoney(m, 0)).toThrow(InvalidDivisorError);
      expect(() => isDivisibleMoney(m, -3)).toThrow(InvalidDivisorError);
      expect(() => isDivisibleMoney(m, 2.5)).toThrow(InvalidDivisorError);
    });
  });
});
