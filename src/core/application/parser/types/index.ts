import { Currency } from '../../../domain/currency';
import { RegisterTransaction } from '../../../domain/transaction';

export type DiagnosticCode =
  | 'EMPTY_LINE'
  | 'INVALID_FORMAT'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_AMOUNT'
  | 'UNDERPAID';

export interface ParseDiagnostic {
  readonly line: number;
  readonly startColumn: number;
  readonly endColumn: number;
  readonly rawLine: string;
  readonly code: DiagnosticCode;
  readonly message: string;
}

export interface LineParseResult {
  readonly lineNumber: number;
  readonly rawLine: string;
  readonly transaction: RegisterTransaction | null;
  readonly diagnostic: ParseDiagnostic | null;
}

export interface ParseResult {
  readonly lines: readonly LineParseResult[];
  readonly transactions: readonly RegisterTransaction[];
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly isValid: boolean;
}

export interface ParseOptions {
  readonly currency?: Currency;
  readonly ignoreEmptyLines?: boolean;
}
