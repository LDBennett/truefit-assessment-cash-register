# Phase 5 Plan — Verification, Edge Case Matrix & Self-Critique

This document specifies the plan for **Phase 5: Verification, Edge Case Matrix & Self-Critique**, fulfilling all evaluation deliverables required by Zach Reott and `AGENTS.md`.

---

## 1. Goal Description

Execute rigorous automated and manual verification covering all domain edge cases, document tool and task mappings (including rejected and reworked solutions), write an authentic self-critique analyzing architectural strengths and substantive algorithmic limitations, and finalize the repository for submission.

---

## 2. Edge Case Matrix & Invariant Test Suite (`tests/core/edgeCases.test.ts`)

| Edge Case | Test Description | Success Invariant |
| :--- | :--- | :--- |
| **README Golden Master** | Execute full README sample (`2.12,3.00`, `1.97,2.00`, `3.33,5.00`) through CLI runner and domain pipeline | Line 1: `3 quarters,1 dime,3 pennies`<br>Line 2: `3 pennies`<br>Line 3: Valid denominations totaling strictly 167¢ ($1.67) |
| **Divisor Reconfiguration ("Things to Consider")** | Set `divisor: 4`: (1) `3.33,5.00` ($333 \pmod 4 = 1 \neq 0$) routes to `calculateGreedyChange` producing `1 dollar,2 quarters,1 dime,1 nickel,2 pennies`; (2) `2.00,3.00` ($200 \pmod 4 = 0$) flips into `calculateRandomChange` | Confirms bidirectional reconfiguration of the divisor condition |
| **Strategy Extensibility ("Things to Consider")** | Inject custom rule `predicate: (tx) => tx.owed.minorUnits >= 10000` (large purchase rule) into `createStrategySelector` | Confirms strategy pattern enables adding new client special cases without modifying existing core logic (Open/Closed Principle) |
| **Exact Payment** | `owed === paid` (e.g. `2.00,2.00`) | Returns `"0"` without throwing or printing empty lines |
| **Exact Payment on Divisible-by-3 Owed** | `owed === paid` where `owed` is divisible by 3 (e.g. `3.00,3.00`) | Verifies random path cleanly yields `"0"` with an empty entries list |
| **Divisible by 3 (Cents)** | `owed.minorUnits % 3 === 0` (e.g. `3.33,5.00`) | Selects `strategyName === 'RandomChange'`. Total sum strictly equals $1.67 |
| **Not Divisible by 3** | `owed.minorUnits % 3 !== 0` (e.g. `2.12,3.00`) | Selects `strategyName === 'GreedyMinimumChange'`. Output matches `3 quarters,1 dime,3 pennies` |
| **Deterministic Seeded Random Test** | `calculateRandomChange` with fixed mock PRNG | Returns deterministic breakdown with exact expected counts, confirming internal algorithm behavior |
| **Random Path Invariant Stress Test** | Run `calculateRandomChange` 2,000 times across varied amounts (1¢, 88¢, 141¢, 500¢, 999¢) in USD and EUR | Invariant `sum(count * denomination.value) === changeDue` holds 100% of the time with 0 infinite loops |
| **All Denominations at Once** | Amount requiring 1 dollar, 1 quarter, 1 dime, 1 nickel, 1 penny ($1.41) using owed not divisible by 3 (`2.00,3.41` $\rightarrow$ owed 200¢, change 141¢) | Verifies greedy descent does not skip intermediate denominations |
| **EUR Currency Verification** | Transaction processed using EUR (e.g. `1.33,2.00`) | Outputs physical euro coins (`1 50-cent coin,1 10-cent coin,1 5-cent coin,1 2-cent coin`) |
| **Windows CRLF & Whitespace Normalization** | Input fixture formatted with `\r\n` and mixed whitespace | Parses without `\r` character bleeding into amount tokens |
| **Single-Decimal Inputs** | `2.1,3.0` | Accurately parses to 210 and 300 minor units |
| **Underpayment Diagnostic** | `paid < owed` (e.g. `3.00,1.00`) | Reports `UNDERPAID` with exact 1-indexed column span on raw text |
| **Negative Amount Diagnostic** | Negative inputs (e.g. `-2.12,3.00`) | Reports `NEGATIVE_AMOUNT` with line and column span |
| **Malformed Syntax Diagnostic** | Missing comma, letters, multiple commas | Reports `INVALID_FORMAT` / `INVALID_NUMBER` with column coordinates |

---

## 3. Tool & Task Mapping Deliverable (`docs/tool_task_mapping.md`)

Document how AI tools and human pairing were deployed across the assessment:
1. **Tool Allocation by Problem Dimension:**
   - **Claude Cowork:** Problem decomposition, assessment scoping, and creation of `AGENTS.md` and initial agent prompts.
   - **Gemini in Antigravity:** Architectural design, DDD domain implementation, pure functional refactoring, application parser/formatter, and FSD web frontend.
   - **Claude Code (CLI):** Dual-Agent Plan Reviewer operating under the 2-loop protocol (`claude -p`), identifying edge cases before implementation.
   - **Human-in-the-Loop Pairing (Lee):** Strategic architectural mandates (converting class-based code to functional TypeScript, Option 2 sub-domain directory layout, FSD hook directory rule, capping review loops).
2. **Reworked & Rejected AI Code (Honest Accounting):**
   - *Rejected:* Initial OOP class hierarchy (`Money`, `CashRegisterService`, class-based strategies). While technically functional, it carried unnecessary object identity and mutable baggage. Lee directed refactoring to pure functional TypeScript.
   - *Reworked:* Random denomination algorithm. The first AI attempt used unclamped random coin counts that could overdraw remaining amounts and lacked an empty-denomination defensive guard; reworked to clamp upper bounds and mandate a unit-1 denomination invariant to guarantee termination.
   - *Reworked:* React reactive calculation pipeline. Initial implementation recalculated random twists on every keystroke across the entire file; reworked to add per-line caching keyed by `rerollKey + config + rawLine`.
   - *Reworked:* CLI argument parser and error handling. Initial plan had multiple process exits and lacked atomic fail-fast partial failure guarantees; reworked to use dependency-injected `CliIo` and a single return channel.

---

## 4. Authentic Self-Critique Deliverable (`docs/self_critique.md`)

Written honestly after code and test suites exist:
1. **Strongest Parts:**
   - **Integer Minor-Unit Arithmetic:** Total elimination of IEEE 754 floating-point rounding bugs (`2.12` $\rightarrow$ `212`).
   - **Pure Functional Domain Architecture:** Nominal branding (`__brand: 'Money'`), immutable frozen structures, and closure factories guarantee purity and testability.
   - **Dual-Agent Plan Review Board:** Pairing Gemini (author) with Claude (reviewer) caught 15+ substantive edge cases before code was written.
   - **Rich Diagnostic Engine:** 1-indexed inclusive column coordinates power both the CLI error reporter and the interactive web editor.
2. **Substantive Design Limitations & Weakest Parts:**
   - **Canonical Coin System Dependency:** The greedy minimum change algorithm (`calculateGreedyChange`) is only provably optimal for *canonical coin systems* (such as standard USD and EUR). For hypothetical non-canonical currencies (e.g. denominations [1, 3, 4], where change for 6 yields `4 + 1 + 1` [3 coins] instead of `3 + 3` [2 coins]), greedy produces sub-optimal results. A generalized change register for arbitrary future currencies should incorporate dynamic programming (or BFS shortest path) with a fallback to greedy for verified canonical sets.
   - **Browser Editor Primitive:** Using a native `<textarea>` with scroll-synchronized gutter requires offset math for character selection. A full Monaco or CodeMirror 6 editor would support native AST-based inline squigglies.
3. **What We Would Change:**
   - Add a canonical coin validation check (e.g. Pearson's algorithm) or swap greedy for a DP change-making solver for arbitrary currencies.
   - Embed CodeMirror 6 in the web interface for native inline linter squiggles.

---

## 5. Documentation & Finalization Gate

1. Update `docs/index.md` linking all deliverables.
2. Update `README.md` with CLI and Web usage.
3. Verify test coverage threshold ($\ge 90\%$ overall, 100% core domain).
4. Run complete verification gate:
   - `pnpm.cmd run typecheck` (`tsc -b`)
   - `pnpm.cmd run lint` (`eslint .`)
   - `pnpm.cmd test` (`vitest run`)
   - `pnpm.cmd run test:coverage` (`vitest run --coverage`)
   - `pnpm.cmd run build` (`vite build && tsc -b`)
