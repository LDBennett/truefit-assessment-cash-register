import { InvalidAmountError, InvalidCurrencyError } from '../errors/DomainErrors';
import { Denomination } from './Denomination';
import { Money } from './Money';

export class Currency {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnitDigits: number;
  readonly denominations: readonly Denomination[];

  constructor(
    code: string,
    name: string,
    symbol: string,
    minorUnitDigits: number,
    denominations: readonly Denomination[]
  ) {
    this.code = code;
    this.name = name;
    this.symbol = symbol;
    this.minorUnitDigits = minorUnitDigits;

    // Structural Termination Invariant: must contain an atomic 1-minor-unit denomination
    const hasUnitOne = denominations.some((d) => d.value.minorUnits === 1);
    if (!hasUnitOne) {
      throw new InvalidCurrencyError(
        `Currency ${code} must include an atomic 1-minor-unit denomination to guarantee change completeness and algorithm termination.`
      );
    }

    // Always sort descending by denomination value
    this.denominations = [...denominations].sort(
      (a, b) => b.value.minorUnits - a.value.minorUnits
    );
  }

  parse(decimalStr: string): Money {
    const trimmed = decimalStr.trim();
    if (trimmed === '') {
      throw new InvalidAmountError('Monetary amount string cannot be empty.');
    }

    // Dynamic regex according to minorUnitDigits
    const pattern =
      this.minorUnitDigits === 0
        ? /^\d+$/
        : new RegExp(`^\\d+(\\.\\d{1,${this.minorUnitDigits}})?$`);

    if (!pattern.test(trimmed)) {
      throw new InvalidAmountError(
        `Invalid monetary decimal format "${decimalStr}" for currency ${this.code}. Expected format: ${
          this.minorUnitDigits === 0 ? 'integer' : `up to ${this.minorUnitDigits} decimal places`
        }.`
      );
    }

    const [wholePart, fracPart = ''] = trimmed.split('.');
    const paddedFrac = fracPart.padEnd(this.minorUnitDigits, '0');
    const minorUnits = parseInt(wholePart, 10) * Math.pow(10, this.minorUnitDigits) + (parseInt(paddedFrac, 10) || 0);

    return new Money(minorUnits);
  }
}

export const Currencies = {
  USD: new Currency('USD', 'US Dollar', '$', 2, [
    new Denomination('USD_DOLLAR', new Money(100), 'dollar', 'dollars'),
    new Denomination('USD_QUARTER', new Money(25), 'quarter', 'quarters'),
    new Denomination('USD_DIME', new Money(10), 'dime', 'dimes'),
    new Denomination('USD_NICKEL', new Money(5), 'nickel', 'nickels'),
    new Denomination('USD_PENNY', new Money(1), 'penny', 'pennies')
  ]),

  EUR: new Currency('EUR', 'Euro', '€', 2, [
    new Denomination('EUR_2_EURO', new Money(200), '2-euro coin', '2-euro coins'),
    new Denomination('EUR_1_EURO', new Money(100), '1-euro coin', '1-euro coins'),
    new Denomination('EUR_50_CENT', new Money(50), '50-cent coin', '50-cent coins'),
    new Denomination('EUR_20_CENT', new Money(20), '20-cent coin', '20-cent coins'),
    new Denomination('EUR_10_CENT', new Money(10), '10-cent coin', '10-cent coins'),
    new Denomination('EUR_5_CENT', new Money(5), '5-cent coin', '5-cent coins'),
    new Denomination('EUR_2_CENT', new Money(2), '2-cent coin', '2-cent coins'),
    new Denomination('EUR_1_CENT', new Money(1), '1-cent coin', '1-cent coins')
  ])
} as const;
