# Phase 3 Plan — Application Layer & Node.js CLI Runner (Functional, DDD & SRP)

This document specifies the implementation plan for **Phase 3: Application Layer & Node.js CLI Runner**, designed with pure functional TypeScript, modular sub-domain directories (`index.ts`, `types/`, `src/`), rich positional parser diagnostics, and a production Node.js CLI runner.

---

## 1. Goal Description

Implement application-level functional services and the CLI executable:
1. **`parser` Sub-Domain (`src/core/application/parser/`):** Pure functional tokenizer and validator parsing flat-file lines (`owed,paid`) into `RegisterTransaction` instances with 1-indexed line and column diagnostic coordinates on raw untrimmed text, cross-platform CRLF line ending support, and explicit negative amount detection.
2. **`formatter` Sub-Domain (`src/core/application/formatter/`):** Pure functional formatter transforming `ChangeDistribution` instances into newline-delimited output strings using domain `formatDenomination` helpers, with `"0"` for zero-change lines.
3. **`cli` Runner (`src/cli/`):** Pure, testable Node.js CLI runner (`runCli`) with mandatory dependency-injected `CliIo` (no disk leak risk), returning an exit code (`0` success, `1` input data validation failure, `2` CLI argument/usage error), supporting `<inputFile> [outputFile]`, `--currency USD|EUR`, and `--divisor N`.
4. **100% Verification:** Comprehensive Vitest test suites covering CRLF fixtures, whitespace shifts, column coordinates, error policies, CLI argument parsing, and end-to-end IO mocking.

---

## 2. Architecture & Design Principles (FP & SRP)

### 2.1 Pure Functions & Separation of Concerns
- **Parser (`inputParser.ts`):** Only parses text into domain types and produces structured diagnostics. Zero DOM or Node dependencies.
- **Formatter (`changeFormatter.ts`):** Only formats domain distribution objects into display strings. Uses domain `formatDenomination` directly.
- **CLI Runner (`cliRunner.ts`):** Pure orchestration function `runCli(args, io): Promise<number>` accepting a mandatory `CliIo` interface for complete test isolation without filesystem side-effects.

### 2.2 Modular Directory Layout (Option 2)
```
src/core/application/
├── index.ts                          # Public application barrel export
├── parser/
│   ├── index.ts                      # Barrel export for parser
│   ├── types/
│   │   └── index.ts                  # ParseDiagnostic, LineParseResult, ParseResult, ParseOptions, DiagnosticCode
│   └── src/
│       └── inputParser.ts            # parseInputText, parseInputLine
└── formatter/
    ├── index.ts                      # Barrel export for formatter
    ├── types/
    │   └── index.ts                  # FormatOptions
    └── src/
        └── changeFormatter.ts        # formatDistribution, formatDistributions

src/cli/
├── index.ts                          # Production executable entry point (process.argv, fs/promises)
└── src/
    ├── types/
    │   └── index.ts                  # CliIo, CliArgs, CliExitCode
    └── cliRunner.ts                  # parseCliArgs, runCli
```

---

## 3. Detailed Specifications

### 3.1 Parser Sub-Domain (`src/core/application/parser/`)

#### Diagnostic Codes
```ts
export type DiagnosticCode =
  | 'EMPTY_LINE'
  | 'INVALID_FORMAT'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_AMOUNT'
  | 'UNDERPAID';
```

#### Diagnostic Coordinates & Raw Offsets
Diagnostics use 1-indexed `line`, `startColumn`, and `endColumn` (inclusive, matching standard CodeMirror / Monaco editor selection ranges) computed on the **raw untrimmed line** so the web editor (Phase 4) can place squigglies directly under the offending characters:
- **Worked Example:**
  Raw line: `  abc , 3.00  `
  - Raw line length = 14 chars.
  - First token is `"abc"` located between raw 0-index 2 and 4.
  - `startColumn = 3`, `endColumn = 5` (inclusive).
  - Diagnostic: `code: 'INVALID_NUMBER'`, `message: 'Invalid owed amount "abc"'`.
- **Parsing Delegation & Negative Detection (Single Source of Truth):**
  If a token starts with `-` (e.g. `-2.12`), it is classified as `NEGATIVE_AMOUNT` (`message: 'Amount cannot be negative'`). Otherwise, parsing delegates directly to domain `parseCurrencyAmount(currency, token)`, catching `InvalidAmountError` and mapping to `INVALID_NUMBER` (`message: 'Invalid owed amount "..."'`). This ensures domain parsing rules and leniency (e.g. `"2.1"` -> 210) remain unified in one place.
- **Underpaid Detection:**
  Parsed amounts are compared numerically (`paid.minorUnits < owed.minorUnits`). If underpaid, the diagnostic spans both tokens (`startColumn` of owed to `endColumn` of paid) with `code: 'UNDERPAID'`. The domain's `createTransaction` is not called, preventing unhandled exceptions.

#### CRLF & Empty Line Policy
- `parseInputText` splits lines via `/\r?\n/` to correctly strip Windows carriage returns (`\r`).
- Default `ignoreEmptyLines: true`. Empty lines (or a standard trailing newline at end of file) are ignored and do not produce errors.
- If `ignoreEmptyLines: false` is explicitly specified, blank lines emit `code: 'EMPTY_LINE'`.

#### Parser Contracts
```ts
export interface ParseOptions {
  readonly currency?: Currency;
  readonly ignoreEmptyLines?: boolean; // defaults to true
}

export interface ParseDiagnostic {
  readonly line: number;        // 1-indexed
  readonly startColumn: number; // 1-indexed
  readonly endColumn: number;   // 1-indexed
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
```

---

### 3.2 Formatter Sub-Domain (`src/core/application/formatter/`)

- Formats a single `ChangeDistribution` using `formatDenomination(entry.denomination, entry.count)`.
- If `isZeroMoney(distribution.changeDue)`, returns `"0"`.
- Entries are joined with commas: `"1 dollar,2 quarters,1 nickel"`.
- No trailing comma, no conjunction word ("and").
- `formatDistributions(distributions, options)` joins multiple formatted lines with `\n`.

```ts
export interface FormatOptions {
  readonly zeroChangeRepresentation?: string; // defaults to "0"
}

export function formatDistribution(
  distribution: ChangeDistribution,
  options?: FormatOptions
): string;

export function formatDistributions(
  distributions: readonly ChangeDistribution[],
  options?: FormatOptions
): string;
```

---

### 3.3 Node.js CLI Runner (`src/cli/`)

#### Exit Codes
- `0`: Success (all lines processed and written).
- `1`: Input data validation error (one or more input lines failed parsing; diagnostics written to `stderr`).
- `2`: CLI usage / argument error (missing input file, invalid flag, unrecognized currency, invalid divisor).

#### CliIo Interface (Pure Dependency Injection)
```ts
export interface CliIo {
  readonly readFile: (path: string) => Promise<string>;
  readonly writeFile: (path: string, content: string) => Promise<void>;
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
}
```
*Note: `exit` is excluded from `CliIo`. `runCli` returns `Promise<number>`, and the outer `index.ts` sets `process.exitCode = await runCli(...)`.*

#### CLI Execution Flow (`runCli` Composition Sketch)
1. **Parse Arguments:** `parseCliArgs(argv)` parses flags and positional arguments:
   - `<inputFile>` (required positional 1).
   - `[outputFile]` (optional positional 2).
   - `--currency <USD|EUR>` (defaults to `USD`). If invalid currency code provided, throws usage error.
   - `--divisor <N>` (defaults to `3`). Validated integer $\ge 2$; if invalid, throws usage error.
2. **Handle Usage Errors:** If argument parsing fails, prints usage message to `io.stderr` and returns code `2`.
3. **Read File:** Reads `<inputFile>` via `io.readFile`. If file read rejects (e.g. `ENOENT`), prints error to `io.stderr` and returns code `2`.
4. **Empty File Check:** If file is empty or contains only whitespace/newlines, writes `""` to output and returns code `0`.
5. **Parse Content:** Runs `parseInputText(content, { currency, ignoreEmptyLines: true })`.
6. **Partial Failure Policy (Atomic / Fail-Fast):**
   - If `!parseResult.isValid`: Writes all formatted diagnostics to `io.stderr` (e.g. `Line 3, Col 5: Invalid number "abc"`), does **NOT** write any output file, and returns code `1`.
7. **Process Transactions:**
   - Constructs closure `register = createCashRegister({ currency, selector: createStrategySelector({ divisor }) })`.
   - Maps each valid transaction through `register(tx)`.
8. **Format Output:**
   - Runs `formatDistributions(results.map(r => r.distribution))`.
9. **Write Output (Uniform Newline Handling):**
   - If output is non-empty, standardizes trailing newline (`output + '\n'`).
   - If `outputFile` was provided: calls `io.writeFile(outputFile, formattedOutput + '\n')`.
   - If `outputFile` was omitted: calls `io.stdout(formattedOutput + '\n')`.
10. **Return Success:** Returns code `0`.

---

## 4. Verification Plan

### Test Matrix

1. **`tests/core/application/InputParser.test.ts`:**
   - Sample lines: `2.12,3.00`, `1.97,2.00`, `3.33,5.00`.
   - Cross-platform CRLF fixtures (`\r\n`).
   - Trailing empty line and intermediate blank line handling.
   - Column offset accuracy on raw lines with leading/trailing and around-comma whitespace.
   - Positional error codes:
     - `INVALID_FORMAT`: Missing comma (`2.13`), extra commas (`2.13,3.00,4.00`).
     - `INVALID_NUMBER`: Malformed decimals (`abc,3.00`, `2.13,xyz`, `2.,3.00`).
     - `NEGATIVE_AMOUNT`: Explicit negative number (`-2.12,3.00`).
     - `UNDERPAID`: Paid less than owed (`3.00,2.12`).
     - `EMPTY_LINE`: When `ignoreEmptyLines: false`.
2. **`tests/core/application/ChangeFormatter.test.ts`:**
   - Zero change returns `"0"`.
   - USD singular and plural outputs (`1 dollar,2 quarters,1 nickel,3 pennies`).
   - EUR physical coins (`1 2-euro coin,2 50-cent coins`).
   - Comma separation without trailing comma or conjunction words.
   - Multi-line formatting joined by `\n`.
3. **`tests/cli/CliRunner.test.ts`:**
   - End-to-end run with mock `CliIo`:
     - Reads sample file, outputs expected text to `stdout`, exit code `0`.
     - Positional `<outputFile>` writes formatted output to file, exit code `0`.
     - `--currency EUR` flag processes with EUR denominations.
     - `--divisor 5` flag triggers random change on owed divisible by 5.
     - Random path asserts total value invariant ($1.67 for line 3).
     - Missing file returns exit code `2` with error on `stderr`.
     - Invalid CLI flag / bad divisor returns exit code `2` with usage message on `stderr`.
     - Invalid input file data fails atomically (writes nothing to output, prints line/col diagnostics to `stderr`, exit code `1`).
     - Empty file writes empty string and exits `0`.

### Automated Verification Commands
```powershell
pnpm.cmd run typecheck
pnpm.cmd run lint
pnpm.cmd test
pnpm.cmd run test:coverage
pnpm.cmd run build
```

Verification Gate:
- 100% test pass rate across all suites.
- 100% test coverage across application and CLI modules.
- Verification against README sample lines.
