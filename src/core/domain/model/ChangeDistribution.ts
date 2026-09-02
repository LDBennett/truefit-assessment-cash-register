import { InvariantViolationError } from '../errors/DomainErrors';
import { Denomination } from './Denomination';
import { Money } from './Money';

export interface DenominationCount {
  readonly denomination: Denomination;
  readonly count: number;
}

export class ChangeDistribution {
  readonly entries: readonly DenominationCount[];
  readonly changeDue: Money;
  readonly totalValue: Money;

  constructor(entries: readonly DenominationCount[], changeDue: Money) {
    if (changeDue.isZero()) {
      if (entries.length > 0) {
        throw new InvariantViolationError(
          'ChangeDistribution for zero changeDue must contain an empty entries list.'
        );
      }
      this.entries = [];
      this.changeDue = changeDue;
      this.totalValue = changeDue;
      return;
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

    // Sort descending by denomination value
    this.entries = [...entries].sort(
      (a, b) => b.denomination.value.minorUnits - a.denomination.value.minorUnits
    );
    this.changeDue = changeDue;
    this.totalValue = changeDue;
  }
}
