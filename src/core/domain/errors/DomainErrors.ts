export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidAmountError extends DomainError {
  constructor(message: string = 'Invalid monetary amount. Must be a non-negative integer.') {
    super(message);
  }
}

export class UnderpaidError extends DomainError {
  constructor(message: string = 'Amount paid is less than amount owed.') {
    super(message);
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCurrencyError extends DomainError {
  constructor(message: string = 'Currency must include a 1-minor-unit denomination.') {
    super(message);
  }
}

export class InvalidDivisorError extends DomainError {
  constructor(message: string = 'Divisor must be an integer greater than or equal to 2.') {
    super(message);
  }
}
