import { InvalidAmountError, InvalidDivisorError } from '../errors/DomainErrors';

export class Money {
  readonly minorUnits: number;

  constructor(minorUnits: number) {
    if (!Number.isInteger(minorUnits) || minorUnits < 0) {
      throw new InvalidAmountError(
        `Monetary amounts must be non-negative integers. Received: ${minorUnits}`
      );
    }
    this.minorUnits = minorUnits;
  }

  static fromMinorUnits(units: number): Money {
    return new Money(units);
  }

  static readonly ZERO: Money = new Money(0);

  add(other: Money): Money {
    return new Money(this.minorUnits + other.minorUnits);
  }

  subtract(other: Money): Money {
    const difference = this.minorUnits - other.minorUnits;
    if (difference < 0) {
      throw new InvalidAmountError(
        `Cannot subtract ${other.minorUnits} from ${this.minorUnits}: negative result.`
      );
    }
    return new Money(difference);
  }

  equals(other: Money): boolean {
    return this.minorUnits === other.minorUnits;
  }

  isGreaterThan(other: Money): boolean {
    return this.minorUnits > other.minorUnits;
  }

  isLessThan(other: Money): boolean {
    return this.minorUnits < other.minorUnits;
  }

  isZero(): boolean {
    return this.minorUnits === 0;
  }

  isDivisibleBy(divisor: number): boolean {
    if (!Number.isInteger(divisor) || divisor < 1) {
      throw new InvalidDivisorError(
        `Divisor must be an integer greater than or equal to 1. Received: ${divisor}`
      );
    }
    return this.minorUnits % divisor === 0;
  }

  toString(): string {
    return `${this.minorUnits} minor units`;
  }
}
