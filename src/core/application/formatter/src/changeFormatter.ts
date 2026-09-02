import { formatDenomination, isZeroMoney } from '../../../domain/currency';
import { ChangeDistribution } from '../../../domain/transaction';
import { FormatOptions } from '../types';

export function formatDistribution(
  distribution: ChangeDistribution,
  options: FormatOptions = {}
): string {
  const { zeroChangeRepresentation = '0' } = options;

  if (isZeroMoney(distribution.changeDue)) {
    return zeroChangeRepresentation;
  }

  return distribution.entries
    .map((entry) => formatDenomination(entry.denomination, entry.count))
    .join(',');
}

export function formatDistributions(
  distributions: readonly ChangeDistribution[],
  options: FormatOptions = {}
): string {
  return distributions
    .map((distribution) => formatDistribution(distribution, options))
    .join('\n');
}
