# Phase 2.5 Plan — Core Domain Functional Refactoring (FP & Pure Data Models)

This document specifies the architectural plan for **Phase 2.5: Core Domain Functional Refactoring**, converting the core domain from class-based OOP Value Objects to an idiomatic functional TypeScript architecture (branded immutable data contracts, pure functions, closure-based strategies, and functional service factories) prior to Phase 3.

---

## 1. Goal Description

Refactor `src/core/domain/` from class-based entities to a pure functional programming (FP) model:
1. **Data Structures:** Branded immutable TypeScript types and interfaces (`Money`, `Denomination`, `Currency`, `RegisterTransaction`, `ChangeDistribution`). Branding guarantees that callers cannot bypass factory invariants with unvalidated object literals.
2. **Behavior as Pure Functions:** Standalone, tree-shakeable functions with strict input validation, `Object.freeze` immutability, and zero side effects (`createMoney`, `addMoney`, `subtractMoney`, `parseCurrencyAmount`, `createTransaction`, `createChangeDistribution`, `calculateGreedyChange`, `calculateRandomChange`).
3. **Strategies as Functions:** Strategy contracts defined as pure function signatures (`(changeDue: Money, currency: Currency) => ChangeDistribution`) with metadata wrappers (`ChangeStrategy`).
4. **Services as Closure Factories:** Symmetric closure factories (`createStrategySelector`, `createCashRegister`).
5. **Errors:** Retain domain error classes (`DomainError`, `UnderpaidError`, etc.) for clean `instanceof` exception handling and stack trace preservation.

---

## 2. Architecture & Design Principles (FP, DDD & SRP)

### 2.1 Separation of Data and Behavior & Invariant Guarantees
In class-based OOP, data and behavior are bound into classes. In functional TypeScript:
- **Data (State):** Defined via readonly types with nominal branding (`__brand`) for safety-critical types (`Money`, `Currency`). This prevents unvalidated object literals (such as `{ minorUnits: -3 }` or empty currency sets) from satisfying type contracts without passing through validating factories.
- **Behavior (Logic):** Pure standalone functions operating on data. All arithmetic (`addMoney`, `subtractMoney`) re-routes through `createMoney` to preserve validation.
- **Immutability:** All factory outputs are frozen via `Object.freeze`.
- **Defensive Termination:** In strategies, `validDenoms.length === 0` is explicitly guarded with `InvalidCurrencyError` so even corrupted data cannot cause out-of-bounds access or infinite loops.

### 2.2 Functional Models & Operations (`src/core/domain/model/`)

#### `Money.ts`
```ts
export type Money = {
  readonly minorUnits: number;
  readonly __brand: 'Money';
};

export const MONEY_ZERO: Money = Object.freeze({ minorUnits: 0, __brand: 'Money' as const });

export function createMoney(minorUnits: number): Money;
export function addMoney(a: Money, b: Money): Money;
export function subtractMoney(minuend: Money, subtrahend: Money): Money;
export function equalsMoney(a: Money, b: Money): boolean;
export function isGreaterThanMoney(a: Money, b: Money): boolean;
export function isLessThanMoney(a: Money, b: Money): boolean;
export function isZeroMoney(m: Money): boolean;
export function isDivisibleMoney(m: Money, divisor: number): boolean; // throws InvalidDivisorError on < 1 or non-integer
export function formatMoney(m: Money): string; // diagnostic-only: "${m.minorUnits} minor units"
```

#### `Denomination.ts`
```ts
export interface Denomination {
  readonly code: string;
  readonly value: Money;
  readonly singularName: string;
  readonly pluralName: string;
}

export interface CreateDenominationOptions {
  readonly code: string;
  readonly value: Money;
  readonly singularName: string;
  readonly pluralName: string;
}

export function createDenomination(options: CreateDenominationOptions): Denomination;
export function formatDenomination(denomination: Denomination, count: number): string;
export function equalsDenomination(a: Denomination, b: Denomination): boolean;
```

#### `Currency.ts`
```ts
export type Currency = {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnitDigits: number;
  readonly denominations: readonly Denomination[];
  readonly __brand: 'Currency';
};

export interface CreateCurrencyOptions {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnitDigits: number;
  readonly denominations: readonly Denomination[];
}

export function createCurrency(options: CreateCurrencyOptions): Currency;
export function parseCurrencyAmount(currency: Currency, decimalStr: string): Money;

export const CURRENCIES: {
  readonly USD: Currency;
  readonly EUR: Currency;
};
```

#### `RegisterTransaction.ts`
```ts
export interface RegisterTransaction {
  readonly owed: Money;
  readonly paid: Money;
  readonly changeDue: Money;
}

export function createTransaction(owed: Money, paid: Money): RegisterTransaction;
```

#### `ChangeDistribution.ts`
```ts
export interface DenominationCount {
  readonly denomination: Denomination;
  readonly count: number;
}

export interface ChangeDistribution {
  readonly entries: readonly DenominationCount[];
  readonly changeDue: Money;
  readonly totalValue: Money;
}

export function createChangeDistribution(
  entries: readonly DenominationCount[],
  changeDue: Money
): ChangeDistribution;
```

---

### 2.3 Functional Strategies (`src/core/domain/strategies/`)

#### `changeStrategy.ts`
```ts
export type ChangeCalculationFn = (changeDue: Money, currency: Currency) => ChangeDistribution;

export interface ChangeStrategy {
  readonly name: string;
  readonly calculate: ChangeCalculationFn;
}

// Greedy strategy
export const greedyMinimumChangeStrategy: ChangeStrategy;
export function calculateGreedyChange(changeDue: Money, currency: Currency): ChangeDistribution;

// Random strategy
export function createRandomChangeStrategy(rng?: () => number): ChangeStrategy;
export function calculateRandomChange(
  changeDue: Money,
  currency: Currency,
  rng?: () => number
): ChangeDistribution;
```

**Termination & Distribution Guarantees:**
- Termination: `remaining` strictly decreases each iteration because each step picks a valid denomination (value $\ge 1$) with count $\ge 1$. Since `Currency` enforces a 1-minor-unit denomination, `validDenoms` is never empty while `remaining > 0`. The algorithm terminates in at most `changeDue.minorUnits` steps.
- Random Distribution Shape: The random algorithm chooses denominations iteratively and aggregates them; it is not uniform across all integer partitions, which satisfies the prompt's requirement for a valid random breakdown totaling the exact change amount.

---

### 2.4 Functional Services (`src/core/domain/services/`)

#### `strategySelector.ts`
```ts
export interface StrategyRule {
  readonly name: string;
  readonly predicate: (tx: RegisterTransaction) => boolean;
  readonly strategy: ChangeStrategy;
}

export interface StrategySelectorOptions {
  readonly divisor?: number;
  readonly customRules?: readonly StrategyRule[];
  readonly randomStrategy?: ChangeStrategy;
  readonly defaultStrategy?: ChangeStrategy;
}

export type StrategySelectorFn = (tx: RegisterTransaction) => ChangeStrategy;

export function createStrategySelector(options?: StrategySelectorOptions): StrategySelectorFn;
```

#### `cashRegister.ts`
```ts
export interface TransactionResult {
  readonly transaction: RegisterTransaction;
  readonly distribution: ChangeDistribution;
  readonly strategyName: string;
}

export interface CashRegisterOptions {
  readonly currency?: Currency;
  readonly selector?: StrategySelectorFn;
}

export type CashRegisterFn = (
  transaction: RegisterTransaction,
  currency?: Currency
) => TransactionResult;

export function createCashRegister(options?: CashRegisterOptions): CashRegisterFn;
```

---

## 3. Migration Scope & File Disposition (Option 2 Layout)

Grep verification confirms that only `src/core/` and `tests/core/domain/` consume domain entities today. No imports exist in `src/web/` or outside tests.

Per architectural consensus, each cohesive domain module follows the standard `index.ts`, `types/`, and `src/` modular layout:

```
src/core/domain/
├── errors/
│   ├── index.ts                      # Barrel export for domain errors
│   ├── types/
│   │   └── index.ts                  # Error type definitions (re-exports)
│   └── src/
│       └── DomainErrors.ts           # DomainError, UnderpaidError, InvalidAmountError, etc.
├── currency/
│   ├── index.ts                      # Barrel export for currency domain
│   ├── types/
│   │   └── index.ts                  # Money, Denomination, Currency, CreateCurrencyOptions, CreateDenominationOptions
│   └── src/
│       ├── money.ts                  # createMoney, addMoney, subtractMoney, equalsMoney, isZeroMoney, isDivisibleMoney, formatMoney, MONEY_ZERO
│       ├── denomination.ts           # createDenomination, formatDenomination, equalsDenomination
│       └── currency.ts               # createCurrency, parseCurrencyAmount, CURRENCIES
├── transaction/
│   ├── index.ts                      # Barrel export for transaction domain
│   ├── types/
│   │   └── index.ts                  # RegisterTransaction, ChangeDistribution, DenominationCount
│   └── src/
│       ├── transaction.ts            # createTransaction
│       └── distribution.ts           # createChangeDistribution
└── calculation/
    ├── index.ts                      # Barrel export for calculation domain
    ├── types/
    │   └── index.ts                  # ChangeStrategy, StrategyRule, StrategySelectorOptions, CashRegisterOptions, TransactionResult
    └── src/
        ├── changeStrategy.ts         # calculateGreedyChange, greedyMinimumChangeStrategy, createRandomChangeStrategy, calculateRandomChange
        ├── strategySelector.ts       # createStrategySelector
        └── cashRegister.ts           # createCashRegister
```

### Public Core Barrel (`src/core/index.ts`):
Re-exports the public contracts from each domain slice:
- `export * from './domain/errors';`
- `export * from './domain/currency';`
- `export * from './domain/transaction';`
- `export * from './domain/calculation';`

---

## 4. Verification Plan

### Test Migration Details
All 69 existing unit tests across 10 test files (`tests/smoke.test.ts` + 9 domain test suites) will be updated to test the functional API:
- `StrategySelector.test.ts`: `toBeInstanceOf(RandomChangeStrategy)` updated to `expect(strategy.name).toBe('RandomChange')`.
- `SpecialVIPStrategy` class subclassing updated to a plain `ChangeStrategy` object `{ name: 'SpecialVIPStrategy', calculate: ... }`.
- Behavioral assertions preserved verbatim:
  - Divisible-by-3 rule routing (`333 % 3 === 0` -> random path, `212` -> greedy).
  - Invariant assertion over 1,000 runs of `calculateRandomChange` (`totalValue === changeDue`).
  - Clamped PRNG boundary tests (`0`, `0.9999999`, `1.0`).
  - EUR physical coin formatting and EUR random path.
  - Zero change path (`owed === paid`).
  - Underpayment rejection throwing `UnderpaidError` before subtraction.

### Automated Verification Commands
```powershell
pnpm.cmd run typecheck
pnpm.cmd run lint
pnpm.cmd test tests/core/domain/
pnpm.cmd run test:coverage
pnpm.cmd run build
```

Verification Gate:
- 100% tests passing (all 69 tests).
- 100% test coverage maintained across statements, branches, functions, and lines.
- Zero DOM / Node globals referenced in core domain.
