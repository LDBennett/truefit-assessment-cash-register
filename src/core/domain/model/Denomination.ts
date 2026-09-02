import { Money } from './Money';

export class Denomination {
  readonly code: string;
  readonly value: Money;
  readonly singularName: string;
  readonly pluralName: string;

  constructor(code: string, value: Money, singularName: string, pluralName: string) {
    this.code = code;
    this.value = value;
    this.singularName = singularName;
    this.pluralName = pluralName;
  }

  format(count: number): string {
    return `${count} ${count === 1 ? this.singularName : this.pluralName}`;
  }

  equals(other: Denomination): boolean {
    return this.code === other.code && this.value.equals(other.value);
  }
}
