# Phase 3 Plan — Application Layer & Node.js CLI Runner (DDD & SRP)

This document specifies the implementation plan for **Phase 3: Application Layer & Node.js CLI Runner**.

---

## 1. Goal Description

Implement the application-level services that parse flat-file text into domain entities with rich positional diagnostics, format domain distributions into output strings, and provide the production-ready Node.js CLI executable.

---

## 2. Architecture & Design Principles (SRP)

- **`InputParser` (Application Service):** Single responsibility of tokenizing text, locating errors by line and character column, and creating validated `RegisterTransaction` instances.
- **`ChangeFormatter` (Application Service):** Single responsibility of rendering `ChangeDistribution` value objects into clean, comma-separated strings (e.g. `1 dollar,2 quarters,1 nickel` or `"0"`).
- **`CliRunner` (Infrastructure / Presentation):** Single responsibility of reading command-line arguments, accessing the filesystem, invoking application services, and writing to `stdout` or files.

---

## 3. Proposed File Changes

### [NEW] `src/core/application/diagnostics/ParseDiagnostic.ts`
- Data contract for line and column diagnostics:
  ```ts
  export interface ParseDiagnostic {
    line: number;        // 1-indexed
    startColumn: number; // 1-indexed
    endColumn: number;   // 1-indexed
    rawLine: string;
    code: 'EMPTY_LINE' | 'INVALID_FORMAT' | 'INVALID_NUMBER' | 'UNDERPAID' | 'NEGATIVE_AMOUNT';
    message: string;
  }
  ```

### [NEW] `src/core/application/parser/InputParser.ts`
- Parses multi-line strings into transactions.
- Does not crash on error; collects all diagnostics across the entire file so users and UI see all issues at once.
- Returns `{ transactions: (RegisterTransaction | null)[], diagnostics: ParseDiagnostic[] }`.

### [NEW] `src/core/application/formatter/ChangeFormatter.ts`
- Formats `ChangeDistribution` into strings.
- Handles zero change (`changeDue.isZero()`) by outputting `"0"`.
- Omits 0-count denominations.
- Formats non-zero counts with singular/plural names in descending order, comma-separated.

### [NEW] `src/cli/index.ts`
- Executable script using Node `fs/promises` and `process.argv`.
- Syntax: `npx tsx src/cli/index.ts <inputFile> [outputFile]`.
- Reads file, parses with `InputParser`, prints diagnostics to `stderr` if invalid, runs `CashRegister`, formats with `ChangeFormatter`, and writes to `outputFile` (or prints to `stdout`).

### [NEW] Tests in `tests/core/application/` & `tests/cli/`:
- `InputParser.test.ts`: Valid pairs, extra commas, invalid characters, negative numbers, underpayment coordinates.
- `ChangeFormatter.test.ts`: Singular, plural, zero change `"0"`, comma separation without trailing comma.
- `cli.test.ts`: End-to-end execution of CLI script against sample files, assert stdout and exit codes.

---

## 4. Verification Plan

### Automated Verification
```powershell
npm.cmd test tests/core/application/
npm.cmd test tests/cli/
```

### Manual CLI Execution
```powershell
npx.cmd tsx src/cli/index.ts sample_input.txt
```
Verify terminal output matches README sample output:
```text
3 quarters,1 dime,3 pennies
3 pennies
1 dollar,1 quarter,6 nickels,12 pennies
```
*(with line 3 randomly distributed totaling $1.67)*.
