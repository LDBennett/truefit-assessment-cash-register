import { isLessThanMoney, Money, subtractMoney } from '../../currency';
import { UnderpaidError } from '../../errors';
import { RegisterTransaction } from '../types';

export function createTransaction(owed: Money, paid: Money): RegisterTransaction {
  if (isLessThanMoney(paid, owed)) {
    throw new UnderpaidError(
      `Amount paid (${paid.minorUnits} cents) is less than amount owed (${owed.minorUnits} cents).`
    );
  }

  const changeDue = subtractMoney(paid, owed);

  return Object.freeze({
    owed,
    paid,
    changeDue
  });
}
