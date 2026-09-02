# Technical Blueprint — Truefit Cash Register

This document provides the detailed technical specification and structural design for all domain entities, calculation strategies, parsers, and delivery mechanisms.

---

## 1. Domain Models (`src/core/domain/model/`)

### 1.1 `Money` (Value Object)
- **State:**
  - `readonly minorUnits: number` (integer >= 0)
- **Invariants:**
  - `Number.isInteger(minorUnits) && minorUnits >= 0`. Non-negative integer minor units only.
  - Rejects `NaN`, infinite, negative, or fractional numbers with `InvalidAmountError`.
- **Behavior:**
  - `add(other: Money): Money`: Returns new `Money(this.minorUnits + other.minorUnits)`.
  - `subtract(other: Money): Money`: Returns new `Money(this.minorUnits - other.minorUnits)`. Throws `InvalidAmountError` if result < 0.
  - `equals(other: Money): boolean`
  - `isGreaterThan(other: Money): boolean`
  - `isLessThan(other: Money): boolean`
  - `isZero(): boolean`
  - `isDivisibleBy(divisor: number): boolean`: Validates `divisor >= 1` and returns `this.minorUnits % divisor === 0`.

### 1.2 `Denomination` (Value Object)
- **State:**
  - `readonly code: string` (e.g. `'USD_DOLLAR'`, `'EUR_50_CENT'`)
  - `readonly value: Money`
  - `readonly singularName: string`
  - `readonly pluralName: string`
- **Behavior:**
  - `equals(other: Denomination): boolean`: Compares `this.code === other.code && this.value.equals(other.value)`.
  - `format(count: number): string`: Returns `${count} ${count === 1 ? singularName : pluralName}`.

### 1.3 `Currency` (Value Object & Static Registry `Currencies`)
- **State:**
  - `readonly code: string` (e.g. `'USD'`, `'EUR'`)
  - `readonly name: string`
  - `readonly symbol: string`
  - `readonly minorUnitDigits: number` (2 for USD and EUR)
  - `readonly denominations: readonly Denomination[]` (sorted descending by value)
- **Invariants:**
  - Must include an atomic unit denomination of value 1 minor unit (guaranteeing termination and completeness for any integer change amount).
- **Behavior:**
  - `parse(decimalStr: string): Money`: Parses a decimal string (e.g. `"2.13"`) into integer minor units according to `minorUnitDigits` (padding short fractions like `"2.1"` to `210`). Rejects invalid formats, negative amounts, or excessive decimal places with `InvalidAmountError`.
- **Static Registry (`Currencies`):**
  - **USD (`Currencies.USD`):**
    - Dollar: 100 cents (`dollar` / `dollars`)
    - Quarter: 25 cents (`quarter` / `quarters`)
    - Dime: 10 cents (`dime` / `dimes`)
    - Nickel: 5 cents (`nickel` / `nickels`)
    - Penny: 1 cent (`penny` / `pennies`)
  - **EUR (`Currencies.EUR`):**
    - 2 Euros: 200 cents (`2-euro coin` / `2-euro coins`)
    - 1 Euro: 100 cents (`1-euro coin` / `1-euro coins`)
    - 50 Cents: 50 cents (`50-cent coin` / `50-cent coins`)
    - 20 Cents: 20 cents (`20-cent coin` / `20-cent coins`)
    - 10 Cents: 10 cents (`10-cent coin` / `10-cent coins`)
    - 5 Cents: 5 cents (`5-cent coin` / `5-cent coins`)
    - 2 Cents: 2 cents (`2-cent coin` / `2-cent coins`)
    - 1 Cent: 1 cent (`1-cent coin` / `1-cent coins`)

### 1.4 `RegisterTransaction` (Value Object)
- **State:**
  - `readonly owed: Money`
  - `readonly paid: Money`
  - `readonly changeDue: Money`
- **Invariant:** `paid.isGreaterThan(owed) || paid.equals(owed)`. Evaluated *before* calculating `changeDue = paid.subtract(owed)`. Throws `UnderpaidError` if `paid < owed`.

### 1.5 `ChangeDistribution` (Value Object)
- **State:**
  - `readonly entries: readonly { denomination: Denomination; count: number }[]` (sorted descending by denomination value)
  - `readonly changeDue: Money`
  - `readonly totalValue: Money` (equals `changeDue`)
- **Invariants:**
  - Rejects `count <= 0` entries and duplicate denominations.
  - Zero change (`changeDue.isZero()`) requires empty entries `[]`.
  - `totalValue.equals(changeDue)`. Any attempt to construct a distribution where the sum does not match `changeDue` throws `InvariantViolationError`.

---

## 2. Strategies (`src/core/domain/strategies/`)

### 2.1 `IChangeCalculationStrategy` Interface
```ts
export interface IChangeCalculationStrategy {
  readonly name: string;
  calculate(changeDue: Money, currency: Currency): ChangeDistribution;
}
```

### 2.2 `GreedyMinimumChangeStrategy`
- **Algorithm:**
  1. Initialize `remaining = changeDue.minorUnits`.
  2. For each `denomination` in `currency.denominations` (descending):
     - `count = Math.floor(remaining / denomination.value.minorUnits)`
     - If `count > 0`:
       - Record `(denomination, count)`
       - `remaining -= count * denomination.value.minorUnits`
  3. Construct and return `ChangeDistribution`.
- **Properties:** Deterministic, guarantees the minimum number of physical units for standard canonical currency denomination systems.

### 2.3 `RandomChangeStrategy`
- **Algorithm:**
  1. Initialize `remaining = changeDue.minorUnits`.
  2. While `remaining > 0`:
     - Filter `validDenoms = currency.denominations.filter(d => d.value.minorUnits <= remaining)`.
     - Pick a random denomination `d` from `validDenoms`.
     - Determine max units: `maxUnits = Math.floor(remaining / d.value.minorUnits)`.
     - Pick a random quantity `count` between `1` and `maxUnits`.
     - Record `(d, count)`.
     - `remaining -= count * d.value.minorUnits`.
  3. Aggregate counts per denomination and construct `ChangeDistribution`.
- **Termination Guarantee:** Because `currency.denominations` always includes the atomic 1-cent denomination, `validDenoms` is never empty when `remaining > 0`. Each iteration subtracts at least 1 minor unit. Thus the loop terminates in at most `changeDue.minorUnits` steps.
- **RNG Dependency Injection:** Supports passing an optional PRNG function `() => number` for deterministic unit testing.

---

## 3. Services (`src/core/domain/services/`)

### 3.1 `StrategySelector`
- **Responsibility:** Maps a transaction to its calculation strategy.
- **Implementation:** Iterates an extensible ordered registry array of predicates:
  ```ts
  export interface StrategyRule {
    name: string;
    predicate: (tx: RegisterTransaction) => boolean;
    strategy: IChangeCalculationStrategy;
  }
  ```
  The selector sequentially evaluates the registered rules and applies the first matching strategy. If no custom predicate matches, it falls back to `GreedyMinimumChangeStrategy`.
- **Default Special Case:** Rule configured with `tx => tx.owed.isDivisibleBy(divisor)` routing to `RandomChangeStrategy` (with configurable divisor, default 3).
- **Validation:** Validates that `divisor` is an integer `>= 2` upon construction (throwing `InvalidDivisorError`).

### 3.2 `CashRegister`
- **Responsibility:** Orchestrates processing for a transaction or batch of transactions.
- Invokes `StrategySelector` for each transaction, computes the `ChangeDistribution`, and returns a structured `TransactionResult`.
- **Result Type:**
  ```ts
  export interface TransactionResult {
    readonly transaction: RegisterTransaction;
    readonly distribution: ChangeDistribution;
    readonly strategyName: string;
  }
  ```

---

## 4. Application Layer (`src/core/application/`)

### 4.1 `InputParser`
- **Responsibility:** Lexical parsing of flat files with line and column diagnostics.
- **Diagnostic Output Structure:**
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
- **Parsing Flow:**
  - Tokenizes each line by comma `,`.
  - Validates exactly two tokens (`owed`, `paid`).
  - Validates numeric decimal format (e.g. `^\d+(\.\d{1,2})?$`).
  - Checks for negative amounts.
  - Instantiates `RegisterTransaction(owedMoney, paidMoney)`. If `RegisterTransaction` throws `UnderpaidError`, the parser catches it and translates it into an `UNDERPAID` `ParseDiagnostic` with the exact column span of the `paid` token.
  - Collects all diagnostics without halting prematurely, enabling comprehensive UI error display.

### 4.2 `ChangeFormatter`
- **Responsibility:** Formats a `ChangeDistribution` into the required comma-separated output string.
- **Rules:**
  - If `changeDue.isZero()`: returns `"0"`.
  - Formats each denomination with count > 0 in descending denomination order.
  - Uses singular when count is 1, plural when count > 1.
  - Delimited by commas without trailing comma or "and" (e.g. `1 dollar,2 quarters,1 nickel`).

---

## 5. Infrastructure & Delivery

### 5.1 CLI Runner (`src/cli/index.ts`)
- Usage: `npx tsx src/cli/index.ts <inputFile> [outputFile]`
- Reads input file asynchronously.
- Feeds text into `InputParser`.
- If diagnostics contain blocking errors: outputs formatted error messages with line/column coordinates to `stderr` and exits with code 1.
- If valid: executes `CashRegister`, formats with `ChangeFormatter`, writes lines to `outputFile` (or prints to `stdout`).

### 5.2 Web Frontend (`src/web/`)
- Interactive workbench built with React, Vite, Tailwind CSS, and Base UI.
- Real-time line/column error marking in the input editor.
- Currency switcher (USD / EUR).
- Divisor configuration controls (allowing live verification of the "Things to Consider" requirement).
- Instant transaction results table and visual denomination breakdowns.
