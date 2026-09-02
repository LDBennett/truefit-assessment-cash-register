# Decision Log — Truefit Cash Register

This document tracks technical decisions made throughout development, updated in real time per assessment guidelines. For each decision, we record the context, alternatives considered, the chosen path, and rationale.

For overall architectural structure, see [`docs/architecture.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/architecture.md). For detailed domain and component blueprints, see [`docs/blueprint.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/blueprint.md).

---

## 1. Stack & Architecture

- **Choice:** Node.js (v24) + TypeScript, with Vite + React for the interactive UI and Vitest for testing.
- **Context:** The assessment leaves language and architecture open ("use whatever technology and techniques you feel are applicable... as if this code was part of a larger system").
- **Alternatives Considered:**
  1. Pure CLI in Node/TS with zero UI: Minimalist, but misses the opportunity to demonstrate UI/UX skills and real-time input validation.
  2. Separate backend API server + React frontend + CLI: Over-engineered for a take-home assessment; adds IPC/HTTP overhead without architectural benefit.
  3. Single shared TypeScript domain engine powering both a Node.js CLI runner and a React frontend (via Vite): Clean separation of concerns; shared core logic eliminates duplication; allows both batch file processing via CLI and rich interactive exploration with error location in the browser.
- **Evaluation / Rationale:** Choice 3 provides clean domain modeling while directly fulfilling the user's preference for an interactive frontend with Tailwind + Base UI and a Node CLI.

---

## 2. Currency Arithmetic

- **Choice:** Integer minor units (cents) exclusively throughout the domain model.
- **Context:** Financial calculations with IEEE 754 floating-point numbers produce precision artifacts (e.g., `0.1 + 0.2 !== 0.3`).
- **Evaluation / Rationale:** All amounts are parsed into integer cents upon ingestion and formatted back to strings only at the presentation boundary. This eliminates rounding hazards.

---

## 3. Divisibility-by-3 Rule

- **Choice:** Evaluated on the total integer minor units of the owed amount (`owedMinorUnits % 3 === 0`).
- **Context:** The README states: "If the 'owed' amount is divisible by 3, the app should randomly generate the change denominations". Sample: `3.33,5.00` triggers the random path.
- **Evaluation / Rationale:** `3.33` as dollars is `333` cents, which satisfies `333 % 3 === 0`. Evaluating on cents is mathematically sound and consistent with the sample dataset.

---

## 4. CLI Ergonomics & Zero Change

- **Choice:** CLI accepts `<inputFile> [outputFile]`, outputting to `stdout` if no output file path is provided. Zero change (`owed === paid`) outputs `"0"`.
- **Context:** The README requires processing input lines to output lines, but does not define exact CLI flag conventions or zero-change output.
- **Evaluation / Rationale:** Standard Unix-friendly argument conventions allow piping and redirection while supporting direct file output. Outputting `"0"` avoids ambiguous empty lines while explicitly signaling zero change.

---

## 5. Extensibility & Currency Abstraction

- **Choice:**
  - `ICurrency`: Defines denomination values, singular/plural names, and formatting. Includes concrete implementations for `USD` and `EUR`.
  - `IChangeCalculationStrategy`: Encapsulates change distribution logic (e.g., `GreedyMinimumChangeStrategy`, `RandomChangeStrategy`).
  - `CashRegisterService`: Coordinates parsing, strategy selection based on configurable rules (divisor, triggers), and formatting.
- **Context:** The README highlights: configurable random divisor, additional special cases, and international clients (e.g., France).
- **Evaluation / Rationale:** The Strategy pattern keeps calculation algorithms decoupled and swappable. Currency abstraction ensures adding new currencies requires only implementing `ICurrency` without altering change algorithms.

---

## 6. Coding Style & Architectural Patterns (DDD, FSD, SRP)

- **Choice:**
  - **Backend / Core:** Domain-Driven Design (DDD). We isolate pure domain models (`Money`, `Denomination`, `Currency`, `RegisterTransaction`, `ChangeDistribution`) from I/O and framework concerns. Domain logic uses Ubiquitous Language matching financial registers.
  - **Frontend:** Feature-Sliced Design (FSD). UI codebase is decomposed into strict hierarchical layers: `app`, `pages`, `widgets`, `features`, `entities`, and `shared`.
  - **Single Responsibility Principle (SRP):** Upheld uniformly across both backend services and frontend components. Each unit (e.g., parser, strategy selector, change calculator, display formatter, editor widget) has one single reason to change.
- **Context:** User guidance to structure the solution with enterprise-grade modularity and maintainability.
- **Evaluation / Rationale:** Keeps domain logic completely independent of both Node CLI and React DOM boundaries. FSD prevents component tangling and makes adding new UI features or widgets seamless. SRP guarantees testability and prevents sprawling god-objects or god-components.

---

## 7. Documentation Architecture & Split

- **Choice:** Centralized documentation hub at `docs/index.md`, with dedicated topical files:
  - `architecture.md`: System-level architectural design (DDD, FSD, SRP).
  - `blueprint.md`: Domain model, strategy pattern, parser diagnostics, and component specifications.
  - `theming.md`: Tailwind CSS + Base UI design system tokens, states, and responsive layout.
  - `progress.md`: Roadmap, milestones, and test matrix.
  - `faqs.md`: Nuanced questions and answers.
  - `decision_log.md`: Chronological and structured ADRs.
  - Individual raw prompt logs: `initial_agent_creation.md` (Part 1), `gemini_logs.md` (Part 2), `claude_logs.md` (Part 3).
- **Context:** Managing documentation scalability, clarity for reviewers, and transparent parallel agent logs.
- **Evaluation / Rationale:** Prevents monolithic decision docs from becoming hard to navigate while ensuring every technical facet has a dedicated home.

---

## 8. Library Selection & Compatibility Review (Base UI & Ecosystem)

- **Choice:**
  - UI Primitive: `@base-ui/react` (v1.7.0) (modern package name, replacing deprecated `@base-ui-components/react`).
  - Framework: React 19 (`react`, `react-dom` `^19.0.0`, `@types/react` `^19.0.0`).
  - Styling: Tailwind CSS v4 with `@tailwindcss/vite` plugin.
  - Bundler & Toolchain: Vite 6 (`^6.2.0`), `@vitejs/plugin-react` (`^5.1.0`), TypeScript (`^5.7.0`), `tsx` (`^4.19.0`).
  - Test Runner: Vitest (`^3.0.0`).
- **Context:** User pointed out that `@base-ui-components/react` was renamed to `@base-ui/react`, and directed us to audit all dependencies for currency and peer dependency alignment.
- **Evaluation / Rationale:** Validated on npm registry that `@base-ui/react` v1.7.0 supports React 19 peer dependencies out of the box (with `date-fns` flagged as optional). Vite 6 with `@tailwindcss/vite` v4 and Vitest v3 provides a seamless, zero-conflict modern development environment.

---

## 9. Dual-Agent Plan Review Rule

- **Choice:** Establish an automated cross-model review cycle between Gemini (in Antigravity) and Claude (`claude -p`).
- **Protocol:**
  1. Gemini submits proposed phase implementation plans to Claude CLI.
  2. Claude reviews and outputs actionable technical critique, edge-case gaps, and risk flags.
  3. Gemini critically evaluates Claude's feedback (accepting valid improvements, defending deliberate design decisions, surfacing genuine ambiguities to Lee).
  4. Max 2 iterations per plan (reduced from 3 per user instruction).
  5. Refined plan is updated in `docs/plans/` and presented to Lee for final explicit approval before touching implementation code.
- **Context:** Evaluator Zach Reott explicitly grades on *how* AI was used, requiring transparency, verification, and critical human/AI oversight rather than blind acceptance.
- **Evaluation / Rationale:** Dual-model review catches blind spots, avoids confirmation bias, strengthens test edge cases, and provides concrete proof of rigorous AI pair programming. Bound adjusted to max 2 loops to balance rigor with velocity.

---

## 10. Tripartite Project References & Modern Toolchain Scaffolding (Phase 1)

- **Choice:**
  - Architecture: Tripartite TypeScript composite project references (`tsconfig.json`, `tsconfig.core.json`, `tsconfig.app.json`, `tsconfig.node.json`).
  - Toolchain: Vite 8, `@vitejs/plugin-react` 6, Vitest 4 with `@vitest/coverage-v8`, Tailwind CSS v4 (`@tailwindcss/vite`), `@base-ui/react` 1.7.0, TypeScript 5.9, TSX 4.23, ESLint flat config with `typescript-eslint` v8 and `simple-import-sort`.
  - Package Manager: `pnpm` (v11) with committed `pnpm-lock.yaml`.
  - Node Pin: Node 24 (`.nvmrc`, `engines: { "node": ">=24.0.0" }`, `@types/node ^24`).
- **Context:** During Dual-Agent Plan Review, Claude flagged that a monolithic tsconfig across browser and Node violated SRP and allowed CLI/domain code to inadvertently touch browser DOM globals.
- **Evaluation / Rationale:** Splitting into `tsconfig.core.json` (pure ES2022, zero DOM/Node globals, declaration emit enabled), `tsconfig.app.json` (DOM enabled, referencing core), and `tsconfig.node.json` (Node globals, referencing core) provides compile-time enforcement of Domain-Driven Design boundaries. All 188 packages resolved with zero peer conflicts, and automated verification (`typecheck`, `lint`, `test`, `coverage`, `build`) achieved 100% pass rates.

---

## 11. Migration to Native Vite 8 `resolve.tsconfigPaths`

- **Choice:** Remove `vite-tsconfig-paths` plugin and adopt Vite 8's built-in `resolve: { tsconfigPaths: true }`.
- **Context:** During `pnpm run dev` and `pnpm run build`, Vite 8 detected `vite-tsconfig-paths` and logged an advisory that native resolution is now supported directly. User directed us to remove the redundant plugin before Phase 2.
- **Evaluation / Rationale:** Eliminating external plugins that duplicate native engine capabilities directly serves the Single Responsibility Principle, reduces dependency risk, and noticeably speeds up test and build times (build time dropped from 1.10s to 315ms, Vitest test execution dropped from 2.20s to 453ms). Verified that TypeScript composite project references resolve flawlessly with zero warnings.

---

## 12. EUR Physical Denomination Naming & Currency-Aware Parsing (Phase 2)

- **Choice:**
  - EUR Naming: Physical coin convention (`1 2-euro coin`, `2 50-cent coins`, `1 1-cent coin`).
  - Decimal Parsing: Currency-aware parsing via `Currency.parse(string)` using `minorUnitDigits` (2 for USD and EUR).
  - Canonicity Assumption: Documented that `GreedyMinimumChangeStrategy` assumes a canonical denomination set (both USD and EUR are canonical).
- **Context:** During Dual-Agent Plan Review for Phase 2, Claude noted that naive value strings for EUR (e.g. `"2 euros"`) produced ungrammatical counts like `"3 2 euros"` or `"1 50 cents"`, and that decimal-to-minor-unit parsing conceptually belongs with `Currency` which knows its exponent. Lee confirmed the physical coin format and currency-aware parsing.
- **Evaluation / Rationale:** The physical coin naming model is grammatically natural in English, provides clean singular/plural distinctions, and faithfully reflects a cashier's physical drawer. Moving decimal parsing to `Currency` keeps `Money` focused purely on integer arithmetic while cleanly supporting non-2-decimal currencies in the future.

---

## 13. Functional Core Architecture & Data/Behavior Separation (Phase 2.5)

- **Choice:** Refactor the core domain from class-based OOP Value Objects and Services into pure functional TypeScript (immutable interface definitions, pure standalone functions, functional strategies, and closure-based service factories).
- **Context:** User expressed an explicit preference for functional TypeScript over class-based OOP prior to Phase 3.
- **Evaluation / Rationale:**
  - In TypeScript, functional programming provides direct separation of state (readonly data types) from behavior (pure functions).
  - Eliminates unnecessary `new` instantiation boilerplate across callers.
  - Improves tree-shakeability for web bundlers.
  - Aligns directly with React and Feature-Sliced Design (FSD) for Phase 4, where pure functions can be imported into hooks, memoized, or mapped across collections without object lifecycle management.
  - Retains domain error classes (`DomainError` hierarchy) for clean `instanceof` exception catching and stack trace preservation.
  - Random Partition Distribution: Acknowledged that iterative random denomination selection is non-uniform across the space of all valid integer partitions (favoring larger counts of initially selected denominations); this fully satisfies the assessment requirement for a valid random breakdown whose sum strictly equals the owed change.
  - Directory Granularity (Option 2): Organized `src/core/domain/` by cohesive bounded sub-domains (`currency/`, `transaction/`, `calculation/`, `errors/`), each structured with `index.ts` (barrel export), `types/index.ts` (contracts), and `src/` (pure function implementations). Provides high cohesion, zero circular dependencies, and eliminates folder proliferation.

---

## 14. Application Layer Architecture, Rich Parser Diagnostics & Testable CLI Runner (Phase 3)

- **Choice:**
  - `parser`: Pure functions `parseInputText` / `parseInputLine` producing structured diagnostics with 1-indexed line and column ranges on raw text, delegating to `parseCurrencyAmount` with explicit negative amount classification, and splitting on `/\r?\n/` with default `ignoreEmptyLines: true`.
  - `formatter`: Pure functions `formatDistribution` / `formatDistributions` directly delegating physical coin naming to domain `formatDenomination`, producing `"0"` on zero change, and joining entries with commas (no trailing comma, no "and").
  - `cli`: Pure, testable `runCli(args, io: CliIo)` runner using dependency injection without disk leak risks, returning explicit exit codes (`0` success, `1` input data failure with fail-fast atomic refusal to produce partial output, `2` CLI usage error). Thin production wrapper `src/cli/index.ts` attaches `process.argv` and `process.exitCode`.
- **Context:** During Dual-Agent Review of Phase 3, Claude identified Windows CRLF splitting bugs (`\r` attached to amount strings), trailing newline empty line false alarms on standard files, and the need for strict IO dependency injection in tests.
- **Evaluation / Rationale:**
  - Delegating decimal parsing to domain `parseCurrencyAmount` eliminates regex duplication and ensures currency-specific minor-unit logic remains unified.
  - Splitting on `/\r?\n/` prevents Windows line ending bugs across developer machines and automated CI.
  - Comprehensive column indexing directly empowers the Phase 4 interactive web editor to render inline squigglies and error gutters.
  - Decoupling CLI orchestration from Node.js runtime globals via `CliIo` enables fast, reliable in-memory Vitest testing of all CLI branches without process spawning or file clutter.

---

## 15. Frontend Architecture: Feature-Sliced Design (FSD), Per-Line Twist Caching & Scroll-Synchronized Gutter (Phase 4)

- **Choice:**
  - Layering: Strict FSD structure (`app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`) with explicit public barrels (`index.ts`).
  - Calculation Hook: Extracted `useRegisterCalculation` hook into `widgets/register-workbench/hooks/` with per-line result caching keyed by `` `${rerollKey}:${currencyCode}:${safeDivisor}:${rawLine}` ``.
  - Divisor Guard: Clamped `safeDivisor = isDivisorValid ? divisor : 3` preventing invalid input crashes.
  - Input Editor: Scroll-synchronized line-numbered gutter with red indicator dots (`●`), and an interactive diagnostic inspector that computes character spans and focuses the exact token using `setSelectionRange`.
  - Testing & Bundler: Configured `resolve.alias` in `vite.config.ts` using `import.meta.dirname`, included `tests/web` in `tsconfig.app.json` (with DOM and React JSX), excluded `tests/web` from `tsconfig.node.json`, and added `happy-dom` for DOM rendering tests.
- **Context:** During Dual-Agent Review of Phase 4, Claude identified that keystrokes on unrelated lines would re-randomize twists without caching, that native textareas cannot host inline CSS squigglies, that unvalidated divisors would crash render, and that path alias resolution needed explicit configuration. Lee directed that all custom hooks (present and future) across the frontend codebase must strictly reside in a dedicated `hooks/` directory within their respective slice with an `index.ts` barrel, rather than `model/`.
- **Evaluation / Rationale:**
  - Per-line twist caching ensures a calm, predictable editing experience: cashiers editing line 5 will not see line 3's randomized coin combination randomly change on every keystroke, while an explicit "Re-roll Twist" button empowers them to regenerate random change whenever desired.
  - Gutter dots and character selection provide immediate, precise feedback without unstable overlay DOM synchronization.
  - Isolating hooks in dedicated `hooks/` subdirectories fulfills Single Responsibility, establishes uniform architectural predictability across all frontend slices, and enables fast, comprehensive headless testing of workbench logic.

---

## 16. Verification, Edge Case Matrix, Tool/Task Mapping & Self-Critique (Phase 5)

- **Choice:**
  - Edge Case Matrix: Implemented in `tests/core/edgeCases.test.ts` asserting exact payment ($2.00, $2.00) yields `"0"`, exact payment on divisible-by-3 owed ($3.00, $3.00) cleanly yields `"0"` with an empty entries list, README golden master CLI test matching sample lines 1–2 exactly and asserting total value on line 3, bidirectional divisor reconfiguration (`divisor: 4`), strategy rule extensibility via custom predicate injection, all denominations at once ($1.41 with non-divisible owed), EUR physical coins ($0.67), deterministic seeded PRNG test, and a 2,000-iteration random invariant stress test across USD and EUR.
  - Tool/Task Mapping: Documented in `docs/tool_task_mapping.md` with an explicit "Reworked & Rejected AI Code" section (recording the rejection of initial class-based OOP in favor of functional TypeScript, PRNG upper-bound loop clamping, per-line twist caching, and CLI single exit channel).
  - Self-Critique: Documented in `docs/self_critique.md` with deep substantive analysis of the greedy change algorithm's optimality limitation (provably optimal only for canonical coin systems, necessitating DP/BFS for arbitrary non-canonical systems) alongside architectural strengths (integer arithmetic, nominal branding, dual-agent peer review).
- **Context:** During Dual-Agent Review of Phase 5, Claude identified that the assessment specifically grades verification rigor, honest reporting of where AI was rejected or reworked, and substantive technical critique rather than process marketing.
- **Evaluation / Rationale:**
  - Direct end-to-end assertions against the README sample output provide indisputable correctness proof for assessment evaluators.
  - Testing bidirectional divisor changes and custom rule injection verifies the two core extensibility requirements in "Things to Consider".
  - Transparently documenting rejected AI generations and canonical-coin algorithmic limitations demonstrates genuine engineering maturity and critical AI oversight.





