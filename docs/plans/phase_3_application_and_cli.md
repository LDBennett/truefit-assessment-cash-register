# Phase 3 Plan — Application Layer & Node.js CLI Runner (Functional, DDD & SRP)

This document specifies the implementation plan for **Phase 3: Application Layer & Node.js CLI Runner**, designed with pure functional TypeScript, modular sub-domain directories (`index.ts`, `types/`, `src/`), rich positional parser diagnostics, and a production Node.js CLI runner.

---

## 1. Goal Description

Implement application-level functional services and the CLI executable:
1. **`parser` Sub-Domain (`src/core/application/parser/`):** Pure functional tokenizer and validator parsing flat-file lines (`owed,paid`) into `RegisterTransaction` instances with 1-indexed line and column diagnostic coordinates.
2. **`formatter` Sub-Domain (`src/core/application/formatter/`):** Pure functional formatter transforming `ChangeDistribution` instances into comma-separated strings (e.g. `3 quarters,1 dime,3 pennies` or `"0"` for zero change).
3. **`cli` Runner (`src/cli/`):** Pure, testable Node.js CLI runner (`runCli`) supporting `<inputFile> [outputFile]` (defaulting to `stdout`), optional flags (`--currency USD|EUR`, `--divisor N`), and structured diagnostic reporting on `stderr`.
4. **100% Verification:** Vitest test suites across parser, formatter, and CLI integration.

---

## 2. Architecture & Design Principles (FP & SRP)

### 2.1 Pure Functions Over Classes
- No `class InputParser` or `class ChangeFormatter`.
- `parseInputText` and `parseInputLine` are pure, deterministic functions returning immutable records.
- `formatDistribution` is a pure function mapping a `ChangeDistribution` to a formatted string.
- `runCli` is a decoupled, dependency-injected async function taking an IO contract (`CliIo`) enabling deterministic unit testing without spawning OS processes.

### 2.2 Modular Directory Layout (`index.ts`, `types/`, `src/`)
Following the project standard (Option 2):
```
src/core/application/
├── index.ts                          # Public application barrel export
├── parser/
│   ├── index.ts                      # Barrel export for parser
│   ├── types/
│   │   └── index.ts                  # ParseDiagnostic, LineParseResult, ParseResult, ParseOptions
│   └── src/
│       └── inputParser.ts            # parseInputText, parseInputLine
└── formatter/
    ├── index.ts                      # Barrel export for formatter
    ├── types/
    │   └── index.ts                  # FormatOptions
    └── src/
        └── changeFormatter.ts        # formatDistribution, formatDenominationEntry
```

---

## 3. Data Contracts & Pure Function Signatures

### 3.1 Parser Types (`src/core/application/parser/types/index.ts`)
```ts
import { Currency } from '../../../domain/currency';
import { RegisterTransaction } from '../../../domain/transaction';

export type DiagnosticCode =
  | 'EMPTY_LINE'
  | 'INVALID_FORMAT'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_AMOUNT'
  | 'UNDERPAID';

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

export interface ParseOptions {
  readonly currency?: Currency;
  readonly ignoreEmptyLines?: boolean;
}
```

### 3.2 Parser Operations (`src/core/application/parser/src/inputParser.ts`)
```ts
export function parseInputLine(
  rawLine: string,
  lineNumber: number,
  options?: ParseOptions
): LineParseResult;

export function parseInputText(
  text: string,
  options?: ParseOptions
): ParseResult;
```

**Diagnostic Coordinates & Precision:**
- `2.13,3.00`: Valid -> returns `RegisterTransaction(owed=213, paid=300)`.
- `2.13`: Missing comma -> `INVALID_FORMAT` (startCol: 1, endCol: 4, "Expected 'owed,paid' format with exactly one comma").
- `2.13,3.00,4.00`: Extra comma -> `INVALID_FORMAT` (startCol: 10, endCol: 14).
- `abc,3.00`: Malformed owed number -> `INVALID_NUMBER` (startCol: 1, endCol: 3).
- `2.13,xyz`: Malformed paid number -> `INVALID_NUMBER` (startCol: 6, endCol: 8).
- `3.00,2.13`: Paid < owed -> `UNDERPAID` (startCol: 1, endCol: 9, "Amount paid is less than owed").
- Empty line: `EMPTY_LINE` (ignored if `ignoreEmptyLines: true`, otherwise reported).

---

### 3.3 Formatter Types & Operations (`src/core/application/formatter/`)
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

**Formatting Rules:**
1. Zero change (`isZeroMoney(distribution.changeDue)`) -> outputs `"0"`.
2. Omit denominations with count 0 (already guaranteed by `ChangeDistribution`).
3. Each entry formatted via `formatDenomination(entry.denomination, entry.count)`.
4. Output comma-separated, no trailing comma, no "and":
   - E.g.: `1 dollar,2 quarters,1 nickel`
   - EUR: `1 2-euro coin,2 50-cent coins`

---

### 3.4 CLI Architecture (`src/cli/`)
```
src/cli/
├── index.ts                          # Production executable entry point (process.argv)
└── src/
    ├── cliRunner.ts                  # Pure runCli function with dependency-injected IO
    └── types/
        └── index.ts                  # CliIo, CliArgs, CliResult
```

#### Contracts:
```ts
export interface CliIo {
  readonly readFile: (path: string) => Promise<string>;
  readonly writeFile: (path: string, content: string) => Promise<void>;
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
  readonly exit: (code: number) => void;
}

export interface CliArgs {
  readonly inputFile: string;
  readonly outputFile?: string;
  readonly currencyCode: 'USD' | 'EUR';
  readonly divisor: number;
}

export function parseCliArgs(argv: readonly string[]): CliArgs;

export function runCli(
  argv: readonly string[],
  io?: Partial<CliIo>
): Promise<number>;
```

**CLI Invocations Supported:**
- `npx tsx src/cli/index.ts input.txt` -> prints to `stdout`
- `npx tsx src/cli/index.ts input.txt output.txt` -> writes to `output.txt`
- `npx tsx src/cli/index.ts input.txt --currency EUR` -> uses EUR
- `npx tsx src/cli/index.ts input.txt --divisor 5` -> triggers random on `owed % 5 === 0`
- Invalid file / parsing errors: formatted diagnostic report printed to `stderr`, exits with code `1`.

---

## 4. Verification Plan

### Test Suites:
1. `tests/core/application/InputParser.test.ts`:
   - Valid lines (Sample 1, 2, 3).
   - Positional column diagnostics (missing comma, extra comma, malformed numbers, negative numbers, underpaid).
   - Multi-line text with mixed valid and invalid rows.
   - Whitespace trimming and empty line handling.
2. `tests/core/application/ChangeFormatter.test.ts`:
   - Zero change returns `"0"`.
   - Singular and plural denominations for USD and EUR.
   - Comma separation without trailing comma or "and".
3. `tests/cli/CliRunner.test.ts`:
   - End-to-end CLI execution with mock `CliIo`.
   - File read -> transaction parse -> cash register computation -> formatted file write / stdout.
   - Error handling: file not found, parser diagnostics written to stderr with non-zero exit code.
   - Divisor and currency flag overrides.

### Automated Verification Commands:
```powershell
pnpm.cmd run typecheck
pnpm.cmd run lint
pnpm.cmd test
pnpm.cmd run test:coverage
pnpm.cmd run build
```

Verification Gate:
- 100% tests passing.
- 100% test coverage maintained across application and CLI modules.
- Verification of sample input file against README sample output.
