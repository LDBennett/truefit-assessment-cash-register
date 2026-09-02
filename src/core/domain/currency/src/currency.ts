import { InvalidAmountError, InvalidCurrencyError } from '../../errors';
import { CreateCurrencyOptions, Currency } from '../types';
import { createDenomination } from './denomination';
import { createMoney } from './money';

export function createCurrency(options: CreateCurrencyOptions): Currency {
  const hasUnitOne = options.denominations.some((d) => d.value.minorUnits === 1);
  if (!hasUnitOne) {
    throw new InvalidCurrencyError(
      `Currency ${options.code} must include an atomic 1-minor-unit denomination to guarantee change completeness and algorithm termination.`
    );
  }

  const sortedDenominations = Object.freeze(
    [...options.denominations].sort(
      (a, b) => b.value.minorUnits - a.value.minorUnits
    )
  );

  return Object.freeze({
    code: options.code,
    name: options.name,
    symbol: options.symbol,
    minorUnitDigits: options.minorUnitDigits,
    denominations: sortedDenominations,
    __brand: 'Currency' as const
  });
}

export function parseCurrencyAmount(currency: Currency, decimalStr: string) {
  const trimmed = decimalStr.trim();
  if (trimmed === '') {
    throw new InvalidAmountError('Monetary amount string cannot be empty.');
  }

  const pattern =
    currency.minorUnitDigits === 0
      ? /^\d+$/
      : new RegExp(`^\\d+(\\.\\d{1,${currency.minorUnitDigits}})?$`);

  if (!pattern.test(trimmed)) {
    throw new InvalidAmountError(
      `Invalid monetary decimal format "${decimalStr}" for currency ${currency.code}. Expected format: ${
        currency.minorUnitDigits === 0
          ? 'integer'
          : `up to ${currency.minorUnitDigits} decimal places`
      }.`
    );
  }

  const [wholePart, fracPart = ''] = trimmed.split('.');
  const paddedFrac = fracPart.padEnd(currency.minorUnitDigits, '0');
  const minorUnits =
    parseInt(wholePart!, 10) * Math.pow(10, currency.minorUnitDigits) +
    (parseInt(paddedFrac, 10) || 0);

  return createMoney(minorUnits);
}

export const CURRENCIES = {
  USD: createCurrency({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnitDigits: 2,
    denominations: [
      createDenomination({ code: 'USD_DOLLAR', value: createMoney(100), singularName: 'dollar', pluralName: 'dollars' }),
      createDenomination({ code: 'USD_QUARTER', value: createMoney(25), singularName: 'quarter', pluralName: 'quarters' }),
      createDenomination({ code: 'USD_DIME', value: createMoney(10), singularName: 'dime', pluralName: 'dimes' }),
      createDenomination({ code: 'USD_NICKEL', value: createMoney(5), singularName: 'nickel', pluralName: 'nickels' }),
      createDenomination({ code: 'USD_PENNY', value: createMoney(1), singularName: 'penny', pluralName: 'pennies' })
    ]
  }),

  EUR: createCurrency({
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnitDigits: 2,
    denominations: [
      createDenomination({ code: 'EUR_2_EURO', value: createMoney(200), singularName: '2-euro coin', pluralName: '2-euro coins' }),
      createDenomination({ code: 'EUR_1_EURO', value: createMoney(100), singularName: '1-euro coin', pluralName: '1-euro coins' }),
      createDenomination({ code: 'EUR_50_CENT', value: createMoney(50), singularName: '50-cent coin', pluralName: '50-cent coins' }),
      createDenomination({ code: 'EUR_20_CENT', value: createMoney(20), singularName: '20-cent coin', pluralName: '20-cent coins' }),
      createDenomination({ code: 'EUR_10_CENT', value: createMoney(10), singularName: '10-cent coin', pluralName: '10-cent coins' }),
      createDenomination({ code: 'EUR_5_CENT', value: createMoney(5), singularName: '5-cent coin', pluralName: '5-cent coins' }),
      createDenomination({ code: 'EUR_2_CENT', value: createMoney(2), singularName: '2-cent coin', pluralName: '2-cent coins' }),
      createDenomination({ code: 'EUR_1_CENT', value: createMoney(1), singularName: '1-cent coin', pluralName: '1-cent coins' })
    ]
  })
} as const;
