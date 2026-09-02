import { CreateDenominationOptions, Denomination } from '../types';
import { equalsMoney } from './money';

export function createDenomination(options: CreateDenominationOptions): Denomination {
  return Object.freeze({
    code: options.code,
    value: options.value,
    singularName: options.singularName,
    pluralName: options.pluralName
  });
}

export function formatDenomination(denomination: Denomination, count: number): string {
  return `${count} ${count === 1 ? denomination.singularName : denomination.pluralName}`;
}

export function equalsDenomination(a: Denomination, b: Denomination): boolean {
  return a.code === b.code && equalsMoney(a.value, b.value);
}
