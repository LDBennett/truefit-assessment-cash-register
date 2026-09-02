import { isZeroMoney, Money } from '../../currency';
import { InvariantViolationError } from '../../errors';
import { ChangeDistribution, DenominationCount } from '../types';

export function createChangeDistribution(
  entries: readonly DenominationCount[],
  changeDue: Money
): ChangeDistribution {
  if (isZeroMoney(changeDue)) {
    if (entries.length > 0) {
      throw new InvariantViolationError(
        'ChangeDistribution for zero changeDue must contain an empty entries list.'
      );
    }
    return Object.freeze({
      entries: Object.freeze([]),
      changeDue,
      totalValue: changeDue
    });
  }

  const seenCodes = new Set<string>();
  let computedMinorUnits = 0;

  for (const entry of entries) {
    if (!Number.isInteger(entry.count) || entry.count <= 0) {
      throw new InvariantViolationError(
        `Denomination count must be a positive integer. Received: ${entry.count} for ${entry.denomination.code}.`
      );
    }

    if (seenCodes.has(entry.denomination.code)) {
      throw new InvariantViolationError(
        `Duplicate denomination detected in ChangeDistribution: ${entry.denomination.code}.`
      );
    }
    seenCodes.add(entry.denomination.code);

    computedMinorUnits += entry.count * entry.denomination.value.minorUnits;
  }

  if (computedMinorUnits !== changeDue.minorUnits) {
    throw new InvariantViolationError(
      `ChangeDistribution total value (${computedMinorUnits} minor units) does not equal expected changeDue (${changeDue.minorUnits} minor units).`
    );
  }

  const sortedEntries = Object.freeze(
    [...entries].sort(
      (a, b) => b.denomination.value.minorUnits - a.denomination.value.minorUnits
    )
  );

  return Object.freeze({
    entries: sortedEntries,
    changeDue,
    totalValue: changeDue
  });
}
