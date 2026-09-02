# Project Progress & Status — Truefit Cash Register

This document tracks implementation milestones, task status, test coverage, and remaining work items for the Truefit Cash Register assessment.

---

## 1. Milestone Status (5-Phase Delivery Roadmap)

| Phase | Plan Document | Status | Deliverables / Artifacts |
| :--- | :--- | :--- | :--- |
| **Phase 1** | [`phase_1_scaffolding.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_1_scaffolding.md) | ✅ **Completed** | `package.json`, tripartite composite tsconfigs (`core`, `app`, `node`), `vite.config.ts` (native Vite 8 paths), Tailwind v4, `@base-ui/react`, ESLint flat config, CI workflow, `smoke.test.ts`. |
| **Phase 2** | [`phase_2_core_domain.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_2_core_domain.md) | ✅ **Completed** | Pure DDD domain models (`Money`, `Denomination`, `Currency` USD/EUR with unit-1 invariant, `RegisterTransaction`, `ChangeDistribution`), strategies (`GreedyMinimumChange`, `RandomChange` with clamped PRNG), and `StrategySelector` (extensible rules, configurable divisor). 100% test coverage across 69 tests. |
| **Phase 3** | [`phase_3_application_and_cli.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_3_application_and_cli.md) | 🎯 **Ready Next** | Lexical `InputParser` with line/col diagnostics, `ChangeFormatter`, and Node.js CLI runner (`src/cli/index.ts`). |
| **Phase 4** | [`phase_4_web_frontend.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_4_web_frontend.md) | ⏳ Pending | FSD React application with Tailwind CSS and `@base-ui/react`: editor with real-time error gutter, drag & drop uploader, live currency switcher, divisor adjuster. |
| **Phase 5** | [`phase_5_verification_and_review.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_5_verification_and_review.md) | ⏳ Pending | Edge case matrix (including `3.00,3.00`), test invariant verification, tool/task mappings, and final self-critique. |

---

## 2. Test Verification Matrix

| Test Scenario | Purpose | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Exact Payment (`owed == paid`)** | Tests zero-change edge case | Returns empty distribution / `"0"` | ✅ Verified (`CashRegister.test.ts`, `ChangeDistribution.test.ts`) |
| **Sample 1 (`2.12, 3.00`)** | Minimal coins path | `3 quarters,1 dime,3 pennies` (88¢) | ✅ Verified (`GreedyMinimumChangeStrategy.test.ts`, `CashRegister.test.ts`) |
| **Sample 2 (`1.97, 2.00`)** | Minimal coins path | `3 pennies` (3¢) | ✅ Verified (`GreedyMinimumChangeStrategy.test.ts`, `CashRegister.test.ts`) |
| **Sample 3 (`3.33, 5.00`)** | Divisible by 3 trigger (`333 % 3 == 0`) | Randomized valid distribution totaling $1.67 | ✅ Verified (`RandomChangeStrategy.test.ts`, `CashRegister.test.ts`) |
| **All Denominations Case** | Tests all denominations in single change | Includes dollars, quarters, dimes, nickels, pennies ($1.41) | ✅ Verified (`GreedyMinimumChangeStrategy.test.ts`) |
| **EUR Currency Case** | Validates currency abstraction with EUR | Formats in physical euro coins (`1 2-euro coin`, etc.) and exercises all 8 denominations | ✅ Verified (`Currency.test.ts`, `GreedyMinimumChangeStrategy.test.ts`, `CashRegister.test.ts`) |
| **Underpayment Edge Case** | `paid < owed` (e.g. `5.00, 2.00`) | Throws `UnderpaidError` before subtraction | ✅ Verified (`RegisterTransaction.test.ts`) |
| **Malformed Format Edge Case** | Missing comma, letters, invalid numbers | Currency parser rejects with `InvalidAmountError` | ✅ Verified (`Currency.test.ts`) |
| **Configurable Divisor** | Divisor changed from 3 to 5 | Only amounts where `cents % 5 == 0` trigger random strategy | ✅ Verified (`StrategySelector.test.ts`) |
| **Random Strategy Invariant** | Multiple random runs on identical amount | Total value strictly equals change due every time (1,000 runs) | ✅ Verified (`RandomChangeStrategy.test.ts`) |
| **Exact Payment on Random Path (`3.00, 3.00`)** | Zero change when divisible by 3 | Routes to random strategy and produces empty distribution | ✅ Verified (`CashRegister.test.ts`) |
| **EUR Random Path** | EUR currency on divisible-by-3 transaction | Valid random distribution matching total in EUR | ✅ Verified (`CashRegister.test.ts`, `RandomChangeStrategy.test.ts`) |
