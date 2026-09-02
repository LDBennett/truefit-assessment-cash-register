export type Money = {
  readonly minorUnits: number;
  readonly __brand: 'Money';
};

export interface Denomination {
  readonly code: string;
  readonly value: Money;
  readonly singularName: string;
  readonly pluralName: string;
}

export interface CreateDenominationOptions {
  readonly code: string;
  readonly value: Money;
  readonly singularName: string;
  readonly pluralName: string;
}

export type Currency = {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnitDigits: number;
  readonly denominations: readonly Denomination[];
  readonly __brand: 'Currency';
};

export interface CreateCurrencyOptions {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnitDigits: number;
  readonly denominations: readonly Denomination[];
}
