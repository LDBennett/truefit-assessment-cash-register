# Phase 5 Plan — Verification, Edge Case Matrix & Self-Critique

This document specifies the plan for **Phase 5: Verification, Edge Case Matrix & Self-Critique**, fulfilling all deliverables required by Zach Reott and `AGENTS.md`.

---

## 1. Goal Description

Execute rigorous automated and manual verification covering all domain edge cases, document tool and task mappings, write an honest self-critique, and finalize the repository for submission.

---

## 2. Edge Case Matrix (Mandated by `AGENTS.md`)

| Edge Case | Test Description | Success Invariant |
| :--- | :--- | :--- |
| **Exact Payment** | `owed === paid` (e.g. `2.00,2.00`) | Returns `"0"` without throwing or printing empty lines. |
| **Exact Payment on Divisible-by-3 Owed** | `owed === paid` where `owed` is divisible by 3 (e.g. `3.00,3.00`) | Verifies random path cleanly yields `"0"` without producing an empty distribution. |
| **Divisible by 3 (Cents)** | `owed.minorUnits % 3 === 0` (e.g. `3.33,5.00`) | Selects `RandomChangeStrategy`. Total sum strictly equals $1.67. |
| **Not Divisible by 3** | `owed.minorUnits % 3 !== 0` (e.g. `2.12,3.00`) | Selects `GreedyMinimumChangeStrategy`. Output matches `3 quarters,1 dime,3 pennies`. |
| **Random Path Invariant** | Run `RandomChangeStrategy` 1,000 times on various amounts | Invariant `sum(count * denomination.value) === changeDue` holds 100% of the time. |
| **All Denominations at Once** | Amount requiring 1 dollar, 1 quarter, 1 dime, 1 nickel, 1 penny ($1.41) | Verifies greedy descent does not skip intermediate denominations. |
| **EUR Currency Verification** | Transaction processed using EUR (e.g. `1.33,2.00`) | Outputs in Euros and Euro cents (e.g. `50 cents,10 cents,5 cents,2 cents`). |
| **Underpayment Diagnostic** | `paid < owed` (e.g. `10.00,5.00`) | Reports `UNDERPAID` with exact line and character column span. |
| **Malformed Syntax Diagnostic** | Missing comma, letters, negative numbers | Reports `INVALID_FORMAT` / `INVALID_NUMBER` with line and column span. |

---

## 3. Tool & Task Mapping Deliverable

Document how AI tools were deployed across the assessment:
- **Claude Cowork:** Initial problem breakdown, assessment scoping, and creation of `AGENT.md` (recorded in `docs/initial_agent_creation.md`).
- **Claude Code:** Terminal-level pair programming, prompt logging in `docs/claude_logs.md`.
- **Gemini / Antigravity:** In-editor pair programming, implementation planning, DDD core modeling, FSD web UI implementation, and prompt logging in `docs/gemini_logs.md`.

---

## 4. Self-Critique Deliverable

Following assessment instructions, the self-critique will be written strictly after code and tests exist, directly answering:
1. **Strongest part:** What part of the architecture or implementation seems strongest, and why?
2. **Weakest part:** What part of the architecture or implementation seems weakest, and why?
3. **What would you change:** If you could change part of the solution, what would you change and why?

---

## 5. Verification Plan

### Automated Test Suite Execution
```powershell
npm.cmd run typecheck
npm.cmd test -- --coverage
npm.cmd run build
```
Verify 100% pass rate across domain, application, CLI, and edge cases, and verify production build succeeds.

### Final Sanity Checks
- Verify `docs/index.md` and all linked documentation files are intact.
- Verify `docs/gemini_logs.md` and `docs/claude_logs.md` capture all turns without missing entries.
- Verify `git status` shows clean, tracked, and well-organized files.
