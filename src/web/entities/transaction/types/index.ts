import { TransactionResult } from '@core/index';

export interface TransactionLineItem {
  readonly lineNumber: number;
  readonly rawLine: string;
  readonly result: TransactionResult;
}

export interface TransactionResultRowProps {
  readonly item: TransactionLineItem;
  readonly className?: string;
}
