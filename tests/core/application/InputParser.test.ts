import { CURRENCIES, parseInputLine, parseInputText } from '@core/index';
import { describe, expect, it } from 'vitest';

describe('InputParser (Application Service)', () => {
  describe('Valid Lines & Sample Cases', () => {
    it('parses Sample 1: 2.12,3.00 correctly', () => {
      const res = parseInputLine('2.12,3.00', 1);
      expect(res.diagnostic).toBeNull();
      expect(res.transaction).not.toBeNull();
      expect(res.transaction!.owed.minorUnits).toBe(212);
      expect(res.transaction!.paid.minorUnits).toBe(300);
      expect(res.transaction!.changeDue.minorUnits).toBe(88);
    });

    it('parses Sample 2: 1.97,2.00 correctly', () => {
      const res = parseInputLine('1.97,2.00', 2);
      expect(res.diagnostic).toBeNull();
      expect(res.transaction!.owed.minorUnits).toBe(197);
      expect(res.transaction!.paid.minorUnits).toBe(200);
      expect(res.transaction!.changeDue.minorUnits).toBe(3);
    });

    it('parses Sample 3: 3.33,5.00 correctly', () => {
      const res = parseInputLine('3.33,5.00', 3);
      expect(res.diagnostic).toBeNull();
      expect(res.transaction!.owed.minorUnits).toBe(333);
      expect(res.transaction!.paid.minorUnits).toBe(500);
      expect(res.transaction!.changeDue.minorUnits).toBe(167);
    });

    it('parses exact payment (0 change): 3.00,3.00', () => {
      const res = parseInputLine('3.00,3.00', 1);
      expect(res.diagnostic).toBeNull();
      expect(res.transaction!.changeDue.minorUnits).toBe(0);
    });

    it('supports EUR currency parsing', () => {
      const res = parseInputLine('1.33,2.00', 1, { currency: CURRENCIES.EUR });
      expect(res.diagnostic).toBeNull();
      expect(res.transaction!.owed.minorUnits).toBe(133);
      expect(res.transaction!.paid.minorUnits).toBe(200);
      expect(res.transaction!.changeDue.minorUnits).toBe(67);
    });

    it('parses single-decimal inputs leniently (2.1 -> 210 minor units)', () => {
      const res = parseInputLine('2.1,3.0', 1);
      expect(res.diagnostic).toBeNull();
      expect(res.transaction!.owed.minorUnits).toBe(210);
      expect(res.transaction!.paid.minorUnits).toBe(300);
    });
  });

  describe('Cross-Platform CRLF & Whitespace', () => {
    it('correctly splits Windows CRLF (\\r\\n) fixtures without trailing \\r errors', () => {
      const crlfText = '2.12,3.00\r\n1.97,2.00\r\n3.33,5.00';
      const parsed = parseInputText(crlfText);

      expect(parsed.isValid).toBe(true);
      expect(parsed.transactions).toHaveLength(3);
      expect(parsed.diagnostics).toHaveLength(0);
      expect(parsed.transactions[0]!.owed.minorUnits).toBe(212);
      expect(parsed.transactions[1]!.owed.minorUnits).toBe(197);
      expect(parsed.transactions[2]!.owed.minorUnits).toBe(333);
    });

    it('ignores empty lines and trailing newline by default', () => {
      const textWithEmptyLines = '2.12,3.00\n\n1.97,2.00\n';
      const parsed = parseInputText(textWithEmptyLines);

      expect(parsed.isValid).toBe(true);
      expect(parsed.transactions).toHaveLength(2);
      expect(parsed.diagnostics).toHaveLength(0);
    });

    it('flags empty lines when ignoreEmptyLines is set to false', () => {
      const res = parseInputLine('   ', 4, { ignoreEmptyLines: false });
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('EMPTY_LINE');
      expect(res.diagnostic!.line).toBe(4);
      expect(res.diagnostic!.startColumn).toBe(1);
    });
  });

  describe('Positional Column Diagnostics & Raw Offsets', () => {
    it('reports INVALID_FORMAT on missing comma', () => {
      const res = parseInputLine('2.12', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('INVALID_FORMAT');
      expect(res.diagnostic!.line).toBe(1);
      expect(res.diagnostic!.startColumn).toBe(1);
      expect(res.diagnostic!.endColumn).toBe(4);
    });

    it('reports INVALID_FORMAT on multiple commas with exact column range', () => {
      const res = parseInputLine('2.12,3.00,4.00', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('INVALID_FORMAT');
      expect(res.diagnostic!.startColumn).toBe(10); // index of second comma + 1
      expect(res.diagnostic!.endColumn).toBe(14);
    });

    it('reports INVALID_FORMAT when owed is missing before comma', () => {
      const res = parseInputLine(',3.00', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('INVALID_FORMAT');
      expect(res.diagnostic!.message).toContain('Missing owed amount');
    });

    it('reports INVALID_FORMAT when paid is missing after comma', () => {
      const res = parseInputLine('2.12,', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('INVALID_FORMAT');
      expect(res.diagnostic!.message).toContain('Missing paid amount');
    });

    it('computes exact column range for invalid owed number with whitespace padding', () => {
      // "  abc , 3.00  " (len 14).
      // "abc" is at 0-index 2..4 -> 1-indexed cols 3..5
      const res = parseInputLine('  abc , 3.00  ', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('INVALID_NUMBER');
      expect(res.diagnostic!.startColumn).toBe(3);
      expect(res.diagnostic!.endColumn).toBe(5);
    });

    it('computes exact column range for invalid paid number with whitespace padding', () => {
      // "2.12 ,  xyz  "
      // comma at index 5. After comma: "  xyz  "
      // "xyz" relative start is 2, so absolute 0-index is 5 + 1 + 2 = 8 -> 1-indexed cols 9..11
      const res = parseInputLine('2.12 ,  xyz  ', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('INVALID_NUMBER');
      expect(res.diagnostic!.startColumn).toBe(9);
      expect(res.diagnostic!.endColumn).toBe(11);
    });

    it('reports NEGATIVE_AMOUNT for negative owed amount', () => {
      const res = parseInputLine('-2.12,3.00', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('NEGATIVE_AMOUNT');
      expect(res.diagnostic!.message).toContain('cannot be negative');
    });

    it('reports NEGATIVE_AMOUNT for negative paid amount', () => {
      const res = parseInputLine('2.12,-3.00', 1);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('NEGATIVE_AMOUNT');
      expect(res.diagnostic!.message).toContain('cannot be negative');
    });

    it('reports UNDERPAID when paid is less than owed', () => {
      const res = parseInputLine('3.00,2.12', 2);
      expect(res.diagnostic).not.toBeNull();
      expect(res.diagnostic!.code).toBe('UNDERPAID');
      expect(res.diagnostic!.message).toContain('Amount paid (2.12) is less than amount owed (3.00)');
      expect(res.diagnostic!.startColumn).toBe(1);
      expect(res.diagnostic!.endColumn).toBe(9);
    });
  });

  describe('Multi-Line Error Accumulation', () => {
    it('collects all diagnostics across the entire text without aborting early', () => {
      const multiline = [
        '2.12,3.00', // valid
        'invalid',   // line 2: missing comma
        '3.00,1.00', // line 3: underpaid
        '1.97,2.00', // valid
        'abc,5.00'   // line 5: invalid number
      ].join('\n');

      const parsed = parseInputText(multiline);

      expect(parsed.isValid).toBe(false);
      expect(parsed.transactions).toHaveLength(2);
      expect(parsed.diagnostics).toHaveLength(3);
      expect(parsed.diagnostics[0]!.line).toBe(2);
      expect(parsed.diagnostics[0]!.code).toBe('INVALID_FORMAT');
      expect(parsed.diagnostics[1]!.line).toBe(3);
      expect(parsed.diagnostics[1]!.code).toBe('UNDERPAID');
      expect(parsed.diagnostics[2]!.line).toBe(5);
      expect(parsed.diagnostics[2]!.code).toBe('INVALID_NUMBER');
    });
  });
});
