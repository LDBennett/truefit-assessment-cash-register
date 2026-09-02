import { InvalidAmountError, InvalidDivisorError } from '@core/domain/errors/DomainErrors';
import { Money } from '@core/domain/model/Money';
import { describe, expect, it } from 'vitest';

describe('Money Value Object', () => {
  describe('Construction & Invariants', () => {
    it('creates Money with valid non-negative integer minor units', () => {
      const money = new Money(212);
      expect(money.minorUnits).toBe(212);
      expect(money.toString()).toBe('212 minor units');

      const fromFactory = Money.fromMinorUnits(212);
      expect(fromFactory.equals(money)).toBe(true);
    });

    it('provides a static ZERO constant', () => {
      expect(Money.ZERO.minorUnits).toBe(0);
      expect(Money.ZERO.isZero()).toBe(true);
    });

    it('rejects negative numbers', () => {
      expect(() => new Money(-1)).toThrow(InvalidAmountError);
    });

    it('rejects fractional numbers (no floating-point cents allowed)', () => {
      expect(() => new Money(2.12)).toThrow(InvalidAmountError);
    });

    it('rejects NaN and Infinity', () => {
      expect(() => new Money(NaN)).toThrow(InvalidAmountError);
      expect(() => new Money(Infinity)).toThrow(InvalidAmountError);
    });
  });

  describe('Arithmetic Operations (Immutable)', () => {
    it('adds two Money instances returning a new instance without mutating originals', () => {
      const m1 = new Money(150);
      const m2 = new Money(75);
      const result = m1.add(m2);

      expect(result.minorUnits).toBe(225);
      expect(m1.minorUnits).toBe(150);
      expect(m2.minorUnits).toBe(75);
    });

    it('subtracts two Money instances returning a new instance', () => {
      const m1 = new Money(200);
      const m2 = new Money(75);
      const result = m1.subtract(m2);

      expect(result.minorUnits).toBe(125);
      expect(m1.minorUnits).toBe(200);
    });

    it('throws InvalidAmountError when subtraction yields a negative result', () => {
      const m1 = new Money(50);
      const m2 = new Money(100);

      expect(() => m1.subtract(m2)).toThrow(InvalidAmountError);
    });
  });

  describe('Comparisons', () => {
    it('correctly compares equality', () => {
      const m1 = new Money(100);
      const m2 = new Money(100);
      const m3 = new Money(101);

      expect(m1.equals(m2)).toBe(true);
      expect(m1.equals(m3)).toBe(false);
    });

    it('correctly evaluates isGreaterThan and isLessThan', () => {
      const smaller = new Money(50);
      const larger = new Money(100);

      expect(larger.isGreaterThan(smaller)).toBe(true);
      expect(smaller.isGreaterThan(larger)).toBe(false);
      expect(smaller.isLessThan(larger)).toBe(true);
      expect(larger.isLessThan(smaller)).toBe(false);
      expect(smaller.isGreaterThan(smaller)).toBe(false);
    });

    it('correctly checks isZero', () => {
      expect(new Money(0).isZero()).toBe(true);
      expect(new Money(1).isZero()).toBe(false);
    });
  });

  describe('Divisibility', () => {
    it('returns true when minorUnits is divisible by divisor', () => {
      expect(new Money(333).isDivisibleBy(3)).toBe(true);
      expect(new Money(300).isDivisibleBy(3)).toBe(true);
      expect(new Money(0).isDivisibleBy(3)).toBe(true);
    });

    it('returns false when minorUnits is not divisible by divisor', () => {
      expect(new Money(212).isDivisibleBy(3)).toBe(false);
      expect(new Money(197).isDivisibleBy(3)).toBe(false);
    });

    it('throws InvalidDivisorError for divisor < 1 or non-integer', () => {
      const m = new Money(100);
      expect(() => m.isDivisibleBy(0)).toThrow(InvalidDivisorError);
      expect(() => m.isDivisibleBy(-3)).toThrow(InvalidDivisorError);
      expect(() => m.isDivisibleBy(2.5)).toThrow(InvalidDivisorError);
    });
  });
});
