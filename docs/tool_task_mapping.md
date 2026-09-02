# Tool & Task Mapping — Truefit Cash Register Assessment

This document provides a transparent, granular accounting of how AI tools and human engineering oversight were deployed across the development of this repository. In accordance with Zach Reott's evaluation guidelines and [`AGENTS.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/AGENTS.md), this record highlights not only what AI generated, but where AI outputs were critically challenged, reworked, or rejected.

---

## 1. Problem Dimension & Tool Allocation

| Problem Dimension / Lifecycle Stage | Primary Tool / Agent | Role & Specific Contribution | Human Intervention & Oversight (Lee) |
| :--- | :--- | :--- | :--- |
| **Initial Scoping & Strategy** | Claude Cowork | Problem breakdown from README; identified hidden requirements ("Things to Consider"); drafted initial `AGENTS.md` and repository working rules. | Validated stack choice (TypeScript/Node.js/React); clarified cent-based integer arithmetic requirement; directed preservation of raw prompt logs. |
| **Architectural Formulation & Plans** | Gemini in Antigravity | Authored detailed phase plans (`docs/plans/phase_*.md`), architectural decision records (`docs/decision_log.md`), DDD core models, and FSD UI layouts. | Reviewed all plans; directed refactoring from OOP to functional TypeScript (Phase 2.5); mandated dedicated `hooks/` directory convention for all React custom hooks. |
| **Dual-Agent Peer Review Board** | Claude Code (`claude -p`) | Executed rigorous automated peer reviews of implementation plans (capped at 2 loops per phase), surfacing edge cases and architectural friction before code was written. | Established the 2-loop protocol bound; resolved architectural trade-offs; approved final plan before implementation began. |
| **Core Domain Modeling (DDD)** | Gemini in Antigravity | Implemented immutable value objects (`Money`, `Denomination`, `Currency`), strategies (`GreedyMinimumChange`, `RandomChange`), and `StrategySelector`. | Insisted on branded nominal types (`__brand: 'Money'`), pure functions, and complete isolation from external I/O. |
| **Application & CLI Layer** | Gemini in Antigravity | Built streaming `inputParser` with 1-indexed column diagnostics, `changeFormatter` handling zero-change (`"0"`) and singular/plural rules, and testable CLI runner. | Verified CLI behavior against `sample_input.txt`; mandated dependency-injected I/O (`CliIo`) for 100% deterministic testability. |
| **Web Frontend (FSD React App)** | Gemini in Antigravity | Implemented Feature-Sliced Design structure (`app`, `pages`, `widgets`, `features`, `entities`, `shared`), Base UI headless wrappers, Lucide icons, and Tailwind v4. | Enforced dedicated `hooks/` directory placement rule; evaluated editor gutter and selection inspector UX. |
| **Verification & Invariant Testing** | Gemini & Claude Code | Authored 148 automated Vitest tests across 19 test suites, including 2,000-iteration random invariant stress testing and DOM component suites. | Verified full test coverage (100% core domain, $\ge 90\%$ overall); inspected edge case matrix. |

---

## 2. Reworked & Rejected AI Code (Honest Accounting)

A critical grading criterion of this assessment is transparency into when AI-generated code was *not* accepted as-is. Below are the key instances where human engineering judgment or dual-agent critique intervened:

### 1. Rejection of Initial OOP Class Hierarchy (Phase 2.5)
- **Initial AI Proposal:** In Phase 2, Gemini initially generated a classic object-oriented domain hierarchy (`class Money`, `class CashRegisterService`, class-based strategy implementations).
- **Why It Was Rejected:** While the OOP solution was technically correct and passed tests, Lee identified that object-oriented classes with mutable instance baggage and `instanceof` checks were suboptimal for a modern TypeScript financial engine. In a functional stack (React 19 / Node.js), pure functions and immutable data types are vastly superior for predictability, serialization, and test isolation.
- **Reworked Solution:** Phase 2.5 was specifically created to refactor the entire domain into idiomatic functional TypeScript using nominal branding (`__brand: 'Money'`), pure functions (`createMoney`, `calculateGreedyChange`), and closure-based factories (`createCashRegister`, `createStrategySelector`).

### 2. Random Denomination Algorithm: PRNG Clamping & Unit-1 Termination Invariant
- **Initial AI Proposal:** Early drafts of the random change algorithm used unclamped `Math.floor(Math.random() * maxCount)` logic and assumed that any coin combination would naturally terminate.
- **Why It Was Reworked:** In edge cases, unconstrained random selection could pick counts that left small fractional remainders that could not be satisfied if the currency lacked a 1-minor-unit base denomination, or could cause infinite while-loops.
- **Reworked Solution:** 
  1. A formal currency invariant was introduced in `Currency`: every currency *must* contain a 1-minor-unit denomination (e.g. Penny in USD, 1-cent coin in EUR).
  2. The random count generation was clamped with defensive upper bounds (`clampedRandomInt`).
  3. The final unit-1 denomination is computed deterministically to absorb any exact remaining balance, guaranteeing 100% termination in $O(D)$ time with 0 infinite loops.

### 3. Web UI: Per-Line Twist Caching (F7 Review Finding)
- **Initial AI Proposal:** In Phase 4, the initial reactive hook (`useRegisterCalculation`) recomputed change across all lines whenever the user typed in the editor textarea.
- **Why It Was Reworked:** Claude's peer review (Loop 1, F7) noted that typing on an unrelated line (e.g. editing line 5) would cause line 3's randomized coin combination to constantly churn on every keystroke, disorienting the user. Furthermore, a naive `useEffect` on-mount cache clearance caused initial cache misses.
- **Reworked Solution:** Replaced naive recalculation with a synchronous ref-based cache keyed by `` `${rerollKey}:${currencyCode}:${safeDivisor}:${rawLine}` ``. Unchanged lines preserve their randomized coin breakdown across edits, while an explicit **"Re-roll Twist"** button in the UI allows cashiers to refresh random change on demand.

### 4. CLI Runner: Single Exit Channel & Atomic Error Handling
- **Initial AI Proposal:** Initial CLI drafts had multiple `process.exit()` calls scattered throughout conditional branches, making automated testing difficult and potentially producing partial outputs.
- **Why It Was Reworked:** Scatted `process.exit()` calls bypass test runners and violate single-responsibility separation between command orchestration and runtime process management.
- **Reworked Solution:** Refactored into a pure `runCli(args, io: CliIo): Promise<number>` function that returns a numeric exit code through a single exit channel, with all file I/O and terminal streams injected via the `CliIo` interface.

---

## 3. Verification & Validation Protocol

AI-generated code was never trusted solely because it compiled:
1. **Integer Arithmetic Grounding:** Verified that all currency values remain integers (`minorUnits`), completely avoiding IEEE 754 floating-point inaccuracies.
2. **Invariant Stress Testing:** The random change strategy was subjected to automated 2,000-iteration stress tests across both USD and EUR to mathematically prove total value preservation (`sum(count * denomination.value) === changeDue`).
3. **Live Golden Master CLI Verification:** Executed the compiled CLI against the official `sample_input.txt` fixture, asserting exact line-for-line matching against the README sample output.
4. **End-to-End Automated Gates:** Enforced strict pipeline checks: `tsc -b` composite typechecking, `eslint .` flat config linting, and `vitest --coverage` across 148 automated tests.
