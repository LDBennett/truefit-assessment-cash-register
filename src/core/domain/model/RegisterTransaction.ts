import { UnderpaidError } from '../errors/DomainErrors';
import { Money } from './Money';

export class RegisterTransaction {
  readonly owed: Money;
  readonly paid: Money;
  readonly changeDue: Money;

  constructor(owed: Money, paid: Money) {
    if (paid.isLessThan(owed)) {
      throw new UnderpaidError(
        `Amount paid (${paid.minorUnits} cents) is less than amount owed (${owed.minorUnits} cents).`
      );
    }

    this.owed = owed;
    this.paid = paid;
    this.changeDue = paid.subtract(owed);
  }
}
