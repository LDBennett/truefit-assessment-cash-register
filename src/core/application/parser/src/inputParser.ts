import {
  CURRENCIES,
  isLessThanMoney,
  Money,
  parseCurrencyAmount
} from '../../../domain/currency';
import {
  createTransaction,
  RegisterTransaction
} from '../../../domain/transaction';
import {
  LineParseResult,
  ParseDiagnostic,
  ParseOptions,
  ParseResult
} from '../types';

export function parseInputLine(
  rawLine: string,
  lineNumber: number,
  options: ParseOptions = {}
): LineParseResult {
  const { currency = CURRENCIES.USD, ignoreEmptyLines = true } = options;

  if (rawLine.trim() === '') {
    if (ignoreEmptyLines) {
      return Object.freeze({
        lineNumber,
        rawLine,
        transaction: null,
        diagnostic: null
      });
    }

    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: 1,
        endColumn: Math.max(1, rawLine.length),
        rawLine,
        code: 'EMPTY_LINE',
        message: 'Line is empty.'
      })
    });
  }

  const parts = rawLine.split(',');

  if (parts.length === 1) {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: 1,
        endColumn: rawLine.length,
        rawLine,
        code: 'INVALID_FORMAT',
        message: 'Expected "owed,paid" format with exactly one comma.'
      })
    });
  }

  if (parts.length > 2) {
    const secondCommaIndex = rawLine.indexOf(',', rawLine.indexOf(',') + 1);
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: secondCommaIndex + 1,
        endColumn: rawLine.length,
        rawLine,
        code: 'INVALID_FORMAT',
        message: 'Expected "owed,paid" format with exactly one comma. Found multiple commas.'
      })
    });
  }

  const rawOwedPart = parts[0]!;
  const rawPaidPart = parts[1]!;

  const commaIndex = rawLine.indexOf(',');

  const owedTrimmed = rawOwedPart.trim();
  const paidTrimmed = rawPaidPart.trim();

  // Missing tokens check
  if (owedTrimmed === '') {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: 1,
        endColumn: Math.max(1, commaIndex),
        rawLine,
        code: 'INVALID_FORMAT',
        message: 'Missing owed amount before comma.'
      })
    });
  }

  if (paidTrimmed === '') {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: commaIndex + 1,
        endColumn: rawLine.length,
        rawLine,
        code: 'INVALID_FORMAT',
        message: 'Missing paid amount after comma.'
      })
    });
  }

  // Calculate raw column spans (1-indexed inclusive)
  const owedLeadSpaces = rawOwedPart.indexOf(owedTrimmed);
  const owedStartCol = owedLeadSpaces + 1;
  const owedEndCol = owedStartCol + owedTrimmed.length - 1;

  const paidLeadSpaces = rawPaidPart.indexOf(paidTrimmed);
  const paidStartCol = commaIndex + 1 + paidLeadSpaces + 1;
  const paidEndCol = paidStartCol + paidTrimmed.length - 1;

  // Negative amount detection
  if (owedTrimmed.startsWith('-')) {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: owedStartCol,
        endColumn: owedEndCol,
        rawLine,
        code: 'NEGATIVE_AMOUNT',
        message: `Owed amount cannot be negative "${owedTrimmed}".`
      })
    });
  }

  if (paidTrimmed.startsWith('-')) {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: paidStartCol,
        endColumn: paidEndCol,
        rawLine,
        code: 'NEGATIVE_AMOUNT',
        message: `Paid amount cannot be negative "${paidTrimmed}".`
      })
    });
  }

  // Parse amounts via domain currency parser
  let owedMoney: Money;
  try {
    owedMoney = parseCurrencyAmount(currency, owedTrimmed);
  } catch {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: owedStartCol,
        endColumn: owedEndCol,
        rawLine,
        code: 'INVALID_NUMBER',
        message: `Invalid owed amount "${owedTrimmed}".`
      })
    });
  }

  let paidMoney: Money;
  try {
    paidMoney = parseCurrencyAmount(currency, paidTrimmed);
  } catch {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: paidStartCol,
        endColumn: paidEndCol,
        rawLine,
        code: 'INVALID_NUMBER',
        message: `Invalid paid amount "${paidTrimmed}".`
      })
    });
  }

  // Underpaid check
  if (isLessThanMoney(paidMoney, owedMoney)) {
    return Object.freeze({
      lineNumber,
      rawLine,
      transaction: null,
      diagnostic: Object.freeze({
        line: lineNumber,
        startColumn: owedStartCol,
        endColumn: paidEndCol,
        rawLine,
        code: 'UNDERPAID',
        message: `Amount paid (${paidTrimmed}) is less than amount owed (${owedTrimmed}).`
      })
    });
  }

  const transaction = createTransaction(owedMoney, paidMoney);

  return Object.freeze({
    lineNumber,
    rawLine,
    transaction,
    diagnostic: null
  });
}

export function parseInputText(
  text: string,
  options: ParseOptions = {}
): ParseResult {
  const rawLines = text.split(/\r?\n/);
  const lines: LineParseResult[] = [];
  const transactions: RegisterTransaction[] = [];
  const diagnostics: ParseDiagnostic[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]!;
    const lineNumber = i + 1;
    const lineResult = parseInputLine(rawLine, lineNumber, options);

    lines.push(lineResult);

    if (lineResult.transaction) {
      transactions.push(lineResult.transaction);
    }

    if (lineResult.diagnostic) {
      diagnostics.push(lineResult.diagnostic);
    }
  }

  return Object.freeze({
    lines: Object.freeze(lines),
    transactions: Object.freeze(transactions),
    diagnostics: Object.freeze(diagnostics),
    isValid: diagnostics.length === 0
  });
}
