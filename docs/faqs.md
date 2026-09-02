# Frequently Asked Questions & Design Rationale — Truefit Cash Register

This document provides detailed explanations and rationale for key design decisions, edge case treatments, and architectural patterns.

---

### 1. Why use integer minor units (cents) instead of standard floating-point numbers?
**Answer:**
Standard IEEE 754 floating-point arithmetic introduces precision inaccuracies (e.g. `0.1 + 0.2 === 0.30000000000000004` or `1.14 - 1.00 === 0.14000000000000012`). In financial calculations, rounding errors can cause cash registers to calculate incorrect change or fail invariant checks.
By converting all amounts to integer minor units (cents) at the system boundary (`2.12` becomes `212`), all arithmetic is exact and free from rounding drift. Amounts are converted back to formatted strings only at the presentation boundary.

---

### 2. Why is "divisible by 3" evaluated on integer cents rather than dollar strings?
**Answer:**
The assessment specification gives sample input `3.33, 5.00` and sample output `1 dollar,1 quarter,6 nickels,12 pennies` with the explicit note: `*Remember the last one is random`.
Evaluating `3.33` as cents yields `333`, which satisfies `333 % 3 === 0`. If the rule were evaluated on the whole dollar portion (`3`), or by some decimal string check, it would not reflect the true monetary amount. Evaluating on integer minor units is mathematically sound, unambiguous, and consistent with the sample dataset.

---

### 3. Why does exact payment (`owed === paid`) output `"0"`?
**Answer:**
The original assessment README does not include an exact payment test case. When change owed is 0, omitting the line would cause line misalignment between the multi-line input file and the output file (violating requirement: *"Each new line in the input file should be a new line in the output file"*). Outputting `"0"` clearly and unambiguously informs the cashier that no physical currency needs to be handed back while preserving 1:1 line correspondence.

---

### 4. How does the random change strategy guarantee termination?
**Answer:**
A naive random coin generator might pick coins randomly and get stuck with an amount it cannot divide cleanly, leading to an infinite retry loop.
Our `RandomChangeStrategy` avoids this by construction:
1. At each step, it filters denominations to only those where `denomination.value <= remaining`.
2. It randomly picks one denomination from this valid subset and randomly selects a count between `1` and `floor(remaining / denomination.value)`.
3. Because both USD and EUR include the atomic 1-cent denomination (penny / 1 cent), the set of valid denominations is never empty as long as `remaining > 0`.
4. Each iteration strictly reduces `remaining` by at least 1 minor unit. Therefore, the algorithm is mathematically guaranteed to terminate in at most `remaining` iterations, and the total value will always strictly equal `changeDue`.

---

### 5. Why combine Base UI with Tailwind CSS?
**Answer:**
- **Base UI (`@base-ui-components/react`):** Provides unstyled, accessible primitives (proper ARIA attributes, keyboard navigation, focus management) without imposing CSS opinions.
- **Tailwind CSS:** Provides utility classes for precise, bespoke UI styling matching the design tokens without fighting component library stylesheet overrides.
Together, they deliver an enterprise-grade, accessible UI with a tailored financial workbench design.

---

### 6. How does Feature-Sliced Design (FSD) benefit the frontend?
**Answer:**
FSD establishes explicit, layered architecture (`app` → `pages` → `widgets` → `features` → `entities` → `shared`) with strict unidirectional dependencies. This eliminates cyclical dependencies, prevents sprawling "components" folders, and cleanly isolates user interactions (features like `file-upload` or `currency-switch`) from visual presentations (`entities`) and low-level primitives (`shared/ui`).

---

### 7. How does Domain-Driven Design (DDD) keep financial logic pure?
**Answer:**
All core business rules (`Money`, `Denomination`, `Currency`, `ChangeDistribution`, `CashRegister`) reside in `src/core/domain/` and have zero imports from React, HTML, or Node.js APIs (`fs`, `path`, etc.). This means the exact same domain code executes identically in the Node CLI runner, the React browser app, and unit test suites.

---

### 8. How does the system support adding new currencies or new special rules?
**Answer:**
- **New Currencies:** Simply create a new instance of `Currency` with its code, symbol, and ordered `Denomination` list (as done for EUR). The change strategies operate on `Currency` polymorphically and require no modifications.
- **New Rules:** `StrategySelector` uses a predicate-based registry. Adding a new condition (e.g. "if owed > $100 use a different strategy") is as simple as registering `{ predicate, strategy }` without altering existing calculation logic.

---

### 9. How are line and column errors pinpointed for malformed inputs?
**Answer:**
`InputParser` reads input line-by-line and tokenizes each row, tracking the 1-indexed character offsets of each token (`owed` start/end column, comma column, `paid` start/end column). When an error occurs (such as non-numeric characters, missing columns, negative numbers, or underpayment `paid < owed`), it produces a structured `ParseDiagnostic` containing the line number and character range. This allows the CLI to print gcc/eslint-style error indicators and allows the web editor to highlight the exact character span with red squiggles.
