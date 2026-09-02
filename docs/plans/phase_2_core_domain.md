# Phase 2 Plan — Core Domain Layer (DDD & SRP)

This document specifies the domain models, design invariants, algorithms, and test suites for **Phase 2: Core Domain Layer**, refined through the Dual-Agent Plan Review cycle.

---

## 1. Goal Description

Implement the pure financial domain model for the cash register following Domain-Driven Design (DDD) and Single Responsibility Principle (SRP).
The domain layer lives in `src/core/domain/` and compiles under `tsconfig.core.json` with pure `lib: ["ES2022"]` and declaration emit enabled. It has zero DOM dependencies, zero Node.js I/O dependencies, and zero UI dependencies.

---

## 2. Ubiquitous Language & Domain Invariants

- **`Money` (Value Object):**
  - Encapsulates integer minor units (`minorUnits: number`, e.g. cents).
  - Absolutely zero IEEE 754 floating-point arithmetic.
  - Rejects negative numbers, `NaN`, infinite, or fractional numbers with `InvalidAmountError`.
  - Operations:
    - `add(other: Money): Money`: Returns new `Money`.
    - `subtract(other: Money): Money`: Returns new `Money`. Throws `InvalidAmountError` if result < 0.
    - `equals(other: Money): boolean`
    - `isGreaterThan(other: Money): boolean`
    - `isLessThan(other: Money): boolean`
    - `isZero(): boolean`
    - `isDivisibleBy(divisor: number): boolean`: Validates `divisor >= 1 && Number.isInteger(divisor)` and returns `this.minorUnits % divisor === 0`.
- **`Denomination` (Value Object):**
  - Represents a physical currency unit (e.g. Dollar = 100 minor units, Quarter = 25 minor units).
  - Encapsulates:
    - `readonly code: string` (e.g. `'USD_QUARTER'`, `'EUR_50_CENT'`)
    - `readonly value: Money`
    - `readonly singularName: string`
    - `readonly pluralName: string`
  - Operations:
    - `equals(other: Denomination): boolean`: Compares `this.code === other.code && this.value.equals(other.value)`.
    - `format(count: number): string`: Returns `${count} ${count === 1 ? singularName : pluralName}`.
- **`Currency` (Value Object & Static Registry `Currencies`):**
  - Encapsulates currency `code: string`, `name: string`, `symbol: string`, `minorUnitDigits: number` (2 for USD and EUR), and `denominations: readonly Denomination[]` (sorted descending by value).
  - **Structural Termination Invariant:** Construction validates that an atomic unit denomination (`value.minorUnits === 1`) is present, guaranteeing that any integer amount can be represented and algorithms will terminate.
  - **Currency-Aware Decimal Parsing:**
    - `parse(decimalStr: string): Money`: Parses a decimal string (e.g. `"2.13"` -> `213` cents) using the currency's `minorUnitDigits`. Enforces strict decimal syntax (`/^\d+(\.\d{1,2})?$/`) and rejects negative amounts, exponential notation, or malformed decimals with `InvalidAmountError`.
  - **Static Registry:**
    - `Currencies.USD`: Dollar (100¢), Quarter (25¢), Dime (10¢), Nickel (5¢), Penny (1¢).
    - `Currencies.EUR`: 2 Euros (`2-euro coin` / `2-euro coins`, 200¢), 1 Euro (`1-euro coin` / `1-euro coins`, 100¢), 50 Cents (`50-cent coin` / `50-cent coins`, 50¢), 20 Cents (`20-cent coin` / `20-cent coins`, 20¢), 10 Cents (`10-cent coin` / `10-cent coins`, 10¢), 5 Cents (`5-cent coin` / `5-cent coins`, 5¢), 2 Cents (`2-cent coin` / `2-cent coins`, 2¢), 1 Cent (`1-cent coin` / `1-cent coins`, 1¢).
- **`RegisterTransaction` (Value Object):**
  - Encapsulates `owed: Money`, `paid: Money`, and `changeDue: Money`.
  - **Underpayment Invariant:** Sole home for the underpayment check. Validates `paid.isGreaterThan(owed) || paid.equals(owed)` *before* computing `changeDue = paid.subtract(owed)`. Throws `UnderpaidError` if `paid < owed`.
- **`ChangeDistribution` (Value Object):**
  - Encapsulates `entries: readonly { denomination: Denomination; count: number }[]` (sorted descending by denomination value) and `changeDue: Money`.
  - **Distribution Balance Invariants:**
    - Rejects `count <= 0` entries with `InvariantViolationError`.
    - Rejects duplicate denominations with `InvariantViolationError`.
    - Zero change (`changeDue.isZero()`) strictly requires empty entries `[]`.
    - Validates `sum(count * denomination.value).equals(changeDue)`, throwing `InvariantViolationError` if unequal.
- **`IChangeCalculationStrategy` (Domain Strategy Interface):**
  ```ts
  export interface IChangeCalculationStrategy {
    readonly name: string;
    calculate(changeDue: Money, currency: Currency): ChangeDistribution;
  }
  ```
  - `GreedyMinimumChangeStrategy`: Descending greedy selection minimizing coin count (assumes canonical denomination systems like USD and EUR).
  - `RandomChangeStrategy`: Valid randomized distribution. Contract for injected PRNG `rng: () => number` is `[0, 1)`. Clamps random indices and unit counts via `randomInt(min, max)` to prevent negative remainder overshoot. Guarantees termination because `min(denominations) === 1`.
- **`StrategySelector` (Domain Service):**
  - Encapsulates an ordered rule array:
    ```ts
    export interface StrategyRule {
      name: string;
      predicate: (tx: RegisterTransaction) => boolean;
      strategy: IChangeCalculationStrategy;
    }
    ```
  - Validates upon construction that `divisor` is an integer `>= 2` (throws `InvalidDivisorError`).
  - Evaluates rules sequentially; first matching rule wins; falls back to `GreedyMinimumChangeStrategy` if no rule matches.
- **`CashRegister` (Domain Service):**
  - Coordinates computation, returning `TransactionResult`:
    ```ts
    export interface TransactionResult {
      readonly transaction: RegisterTransaction;
      readonly distribution: ChangeDistribution;
      readonly strategyName: string;
    }
    ```

---

## 3. Proposed File Changes

### [NEW] `src/core/domain/errors/DomainErrors.ts`
- `DomainError`: Abstract base class.
- `InvalidAmountError`: Non-integer, negative, or malformed decimal string.
- `UnderpaidError`: `paid < owed`.
- `InvariantViolationError`: Unbalanced distribution or invalid distribution entries.
- `InvalidCurrencyError`: Currency lacking atomic unit-1 denomination.
- `InvalidDivisorError`: Divisor < 2 or non-integer.

### [NEW] `src/core/domain/model/Money.ts`
- Pure integer cents value object with comparison, arithmetic, and divisibility methods.

### [NEW] `src/core/domain/model/Denomination.ts`
- Physical unit value object with `code`, `value`, names, `equals()`, and `format()`.

### [NEW] `src/core/domain/model/Currency.ts`
- Currency value object with `minorUnitDigits`, unit-1 invariant, `parse()`, and static `Currencies.USD` and `Currencies.EUR`.

### [NEW] `src/core/domain/model/RegisterTransaction.ts`
- Transaction value object with underpayment invariant.

### [NEW] `src/core/domain/model/ChangeDistribution.ts`
- Distribution value object with entry balance validation and zero-change handling.

### [NEW] `src/core/domain/strategies/IChangeCalculationStrategy.ts`
- Strategy contract definition.

### [NEW] `src/core/domain/strategies/GreedyMinimumChangeStrategy.ts`
- Canonical greedy coin minimization.

### [NEW] `src/core/domain/strategies/RandomChangeStrategy.ts`
- Terminating randomized coin distribution with clamped PRNG helper.

### [NEW] `src/core/domain/services/StrategySelector.ts`
- Rule-based strategy router with divisor validation.

### [NEW] `src/core/domain/services/CashRegister.ts`
- Transaction orchestration returning `TransactionResult`.

### [NEW] `src/core/index.ts`
- Core barrel export exposing domain models, strategies, services, and errors.

### [NEW] Unit Tests in `tests/core/domain/`:
- `Money.test.ts`: Negative rejection, addition, subtraction (returning new instance), comparisons, `isZero`, `isDivisibleBy` (asserts `InvalidDivisorError` on divisor < 1 or non-integer), immutability.
- `Denomination.test.ts`: USD and EUR singular/plural formatting (`1 2-euro coin`, `2 50-cent coins`), structural `equals()`.
- `Currency.test.ts`: USD/EUR denomination order, unit-1 invariant assertion, currency-aware decimal parsing (`Currency.USD.parse("2.13")` -> 213¢, `"2.1"` -> 210¢, rejection of malformed decimals like `"2."`, `".5"`, `"-1.00"`, `"1e3"`, `""`).
- `RegisterTransaction.test.ts`: Valid transaction, exact payment (`owed === paid`), throws `UnderpaidError` on underpayment before subtraction.
- `ChangeDistribution.test.ts`: Valid distribution, rejection of `count <= 0`, rejection of duplicate denominations, rejection of unbalanced totals, empty entries on zero change.
- `GreedyMinimumChangeStrategy.test.ts`: Minimal coins on sample inputs (`2.12, 3.00` -> 3 quarters, 1 dime, 3 pennies; `1.97, 2.00` -> 3 pennies; all USD denominations `$1.41`; EUR requiring every denomination at once).
- `RandomChangeStrategy.test.ts`: 1,000 runs verifying invariant `sum === changeDue` holds 100% of the time, deterministic seeded PRNG test with boundary values (`0`, `≈0.999999`), zero change on random path (`3.00, 3.00` -> empty distribution), EUR random path transaction.
- `StrategySelector.test.ts`: Rule ordering, divisor validation (rejects `0`, `1`, negative), empty rule array fallback, divisibility by 3 routing.
- `CashRegister.test.ts`: End-to-end execution for USD and EUR, asserting structured `TransactionResult`.

---

## 4. Verification Plan

### Automated Verification Commands
```powershell
pnpm.cmd run typecheck
pnpm.cmd run lint
pnpm.cmd test tests/core/domain/
pnpm.cmd run test:coverage
pnpm.cmd run build
```

Verify:
1. `tsc -b` compiles `tsconfig.core.json` cleanly, producing types in `dist/types/`.
2. Zero DOM / Node globals referenced in `src/core/` (pure runtime isolation).
3. 100% test pass rate across all domain test suites.
4. Domain coverage ≥95%.
5. `pnpm run build` succeeds cleanly.
