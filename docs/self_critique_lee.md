# Self-Critique: Truefit Cash Register Architecture

> [!NOTE]
> **Authorship & Transparency Notice:**
> This document represents the **AI-generated self-critique authored by Gemini in Antigravity**. In accordance with the assessment's evaluation goals and Lee's direction, an independent, unassisted human self-critique will be authored separately by Lee (in `docs/self_critique_human.md`) to provide evaluators with a transparent, side-by-side comparison of AI self-reflection versus human engineering perspective.

---

## 1. Strongest Parts of the Solution

### A. Integer Minor-Unit Financial Arithmetic
From the very first design decision ([Decision 1](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/decision_log.md)), money is strictly represented in integer minor units (`minorUnits: number`, e.g. `$2.12` $\rightarrow$ `212`). Standard IEEE 754 floating-point numbers in JavaScript suffer from binary rounding errors (e.g. `0.1 + 0.2 === 0.30000000000000004` or `1.00 - 0.97 === 0.030000000000000027`), which in financial systems lead to off-by-one penny drift and reconciliation failures. By confining all internal mathematics to integer cents and isolating parsing/formatting at the application boundaries, arithmetic correctness is mathematically guaranteed.

### B. Pure Functional Domain Architecture with Nominal Branding
Following Lee's architectural pivot in Phase 2.5, the core domain was refactored from class-based OOP into idiomatic functional TypeScript. Nominal branding (`__brand: 'Money'`, `__brand: 'Currency'`) enforces compile-time type safety, preventing raw numbers from being accidentally passed where validated monetary amounts are required. All domain functions (`calculateGreedyChange`, `calculateRandomChange`, `createTransaction`) are pure, deterministic (or accept mockable PRNGs), and operate on deeply frozen immutable data structures (`Object.freeze`), eliminating mutable state bugs and side effects.

### C. The Dual-Agent Plan Review Protocol
The formal pairing of Gemini (authoring agent) and Claude Code (CLI peer review agent) under the **Dual-Agent Plan Review Rule** served as an automated architectural review board. Across four review phases, this protocol caught over 15 subtle issues before a line of code was written:
- Windows CRLF line-ending normalization in parser streams.
- The unit-1 denomination invariant required to guarantee random change termination.
- Scroll-synchronized gutter limitations in native browser textareas.
- Per-line twist caching to prevent typing keystrokes from re-randomizing unrelated lines.
- Composite TypeScript project reference scoping for DOM testing globals.

### D. Granular Diagnostic Coordinates & Structural Linkage
The `inputParser` produces structured `ParseDiagnostic` objects with 1-indexed, inclusive `startColumn` and `endColumn` coordinates for every syntax error, underpayment, or negative number. This single diagnostic model cleanly powers both the CLI error reporter (printing formatted line/column snippets) and the web frontend editor (rendering red gutter dots and focusing the exact character range on click).

---

## 2. Weakest Parts & Substantive Design Limitations

### A. Canonical Coin System Dependency (Algorithmic Limitation)
The primary algorithmic limitation in `calculateGreedyChange` is that the **greedy coin change algorithm is only provably optimal for *canonical coin systems***.
- **The Problem:** A coin system is "canonical" if the greedy algorithm (always taking the largest denomination $\le$ remaining balance) produces the minimal number of coins for every possible change amount. Standard USD `[100, 25, 10, 5, 1]` and EUR `[200, 100, 50, 20, 10, 5, 2, 1]` are proven canonical systems.
- **The Counterexample:** Consider a hypothetical client currency with denominations `[1, 3, 4]`. If a customer is owed 6 cents in change:
  - **Greedy approach:** Takes `4` first (balance 2), then `1` (balance 1), then `1` (balance 0) $\rightarrow$ **3 coins** (`4 + 1 + 1`).
  - **Optimal approach:** Takes two 3-cent coins $\rightarrow$ **2 coins** (`3 + 3`).
- **Impact:** While our currency abstraction (`Currency` interface) cleanly allows adding arbitrary new currencies, if a future client introduces a non-canonical currency system, `calculateGreedyChange` will silently produce non-minimal change.
- **Remediation:** A production-grade multi-currency register should execute a canonicity verification algorithm (such as Pearson's $O(n^3)$ test) when a currency is registered. If the currency is non-canonical, the system should automatically fallback to a Dynamic Programming (DP) or Breadth-First Search (BFS) shortest-path coin change solver.

### B. Browser Editor Primitive Trade-Offs
In the web frontend (`InputEditor.tsx`), we utilized a native HTML `<textarea>` paired with a scroll-synchronized line gutter and a range-based selection inspector (`textarea.setSelectionRange`). 
- **The Trade-Off:** While this avoids heavy external dependencies and executes with zero bundle bloat, native textareas cannot host inline child HTML elements or CSS squiggly underlines. Highlighting errors requires programmatic cursor selection rather than true in-situ token decorations.

### C. Review Protocol Latency & Coordination Overhead
Operating a multi-agent review pipeline via CLI subprocesses (`claude -p`) added noticeable execution latency (10–30 seconds per review turn). While the architectural quality gains were substantial, managing review loop bounds, transcript synchronizations, and token budgets requires disciplined orchestration.

---

## 3. What We Would Change in a Future Iteration

1. **Hybrid Greedy / Dynamic Programming Engine:**
   - Incorporate Pearson's algorithm on `Currency` definition to verify canonicity at compile or startup time.
   - Implement a DP/BFS change solver that activates whenever an unverified or non-canonical currency is selected, ensuring absolute mathematical optimality across any arbitrary currency.
2. **CodeMirror 6 In-Browser Editor:**
   - Replace the native `<textarea>` with a lightweight CodeMirror 6 editor instance configured with a custom linter extension. This would render true inline red squigglies and hover tooltips directly on invalid line tokens.
3. **Web Worker Offloading for Large Ingestion:**
   - For massive flat files (e.g. 50,000+ transaction lines), offload parsing and change distribution to a Web Worker background thread, keeping the React UI thread at 60 FPS.
4. **Deterministic Seed Injection in the UI:**
   - Add an optional PRNG seed input in the web interface's "Rule Configuration" drawer to allow cashiers or testers to reproduce specific random change breakdowns deterministically.
