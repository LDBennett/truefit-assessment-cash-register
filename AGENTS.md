# AGENT.md — Truefit Cash Register Assessment

Context for whatever AI coding tool you're using in-editor (Cursor, Claude Code, Copilot Chat, etc.) on this repo. Read this before generating code, and follow the working rules below — this assessment is explicitly evaluating *how* AI was used, not just the final output.

## What this actually is

This is a take-home code assessment for Truefit (truefit.io), sent by Zach Reott (Director of Engineering) via the repo at `github.com/TrueFit/CashRegister`. It is graded on two things at once: the correctness/design of the solution, AND a transparent record of how AI tools were used to build it. Do not optimize for one at the expense of the other.

## The problem (from the repo README)

Build a program that tells a cashier how much change is owed and which denominations to use.

1. Input: a flat file, one `owed,paid` pair per line (e.g. `2.13,3.00`), multiple lines.
2. Output: one line per input line, formatted like `1 dollar,2 quarters,1 nickel`.
3. Normal case: return the *minimum* number of physical units of change.
4. Special case: **if the owed amount is divisible by 3**, randomly generate the denominations instead — but the total must still add up to the correct change amount.

"Things to Consider" in the README (read these as requirements in disguise, not throwaway prompts):
- The divisor (currently 3) should be easy for the client to change later → **make it configuration, not a hardcoded literal.**
- The client may add another special case later → **the change-calculation strategy needs to be swappable/extensible (strategy pattern), not an if/else chain that grows forever.**
- A future client might be in France → **denominations/currency need to be abstracted behind an interface, not hardcoded to USD.**

## Resolved decisions (context for why these choices were made — carry them into the decision log, don't re-litigate silently)

- **Language/stack: Node.js + TypeScript.** Not specified by the assessment, but it's the closest honest match to both Lee's strongest production experience and Truefit's own stated preferred stack (Node/TS/React/React Router SSR/TanStack/Postgres) — a legitimate, non-contrived choice, not just "what will look good."
- **Currency arithmetic: integer minor units (cents), never floating point.** `2.12` becomes `212` internally. This avoids classic floating-point rounding bugs in money math — a real correctness issue, not a style preference, and worth calling out explicitly in the decision log as a deliberate choice.
- **"Divisible by 3" is evaluated on the integer cent value of the owed amount**, not the dollar-and-cents string. Reasoning: the sample input `3.33,5.00` triggers the random path, and `333 % 3 == 0` — this is the only interpretation consistent with the given example, so it's treated as resolved rather than ambiguous. Still worth one sentence in the decision log since the README itself doesn't say this explicitly.
- **Denomination set (USD): dollar, quarter, dime, nickel, penny.** Matches exactly what the sample outputs use — don't add half-dollars or larger bills unless a test case demands it.
- **EUR is a real second implementation, not just an interface stub** (per Lee's call — this is meant to be concrete proof the currency abstraction holds, not decoration). Reasonable EUR minor-unit denomination set to start from: 200, 100, 50, 20, 10, 5, 2, 1 (cents) → "2 euros, 1 euro, 50 cents," etc. — confirm pluralization/naming conventions before finalizing.
- **Output formatting:** singular/plural must be handled (`1 dollar` vs `2 dollars`, `1 nickel` vs `6 nickels`), comma-separated, no trailing comma, no "and."
- **Coding Style & Architecture:**
  - **Domain-Driven Design (DDD)** for backend / core domain: Financial models are kept pure and isolated from I/O (Value Objects for `Money`, `Denomination`, `ChangeDistribution`; Domain Services for `CashRegisterService`; Domain Strategy pattern for change algorithms; clear ubiquitous language).
  - **Feature-Sliced Design (FSD)** for frontend: Strict layered structure (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
  - **Single Responsibility Principle (SRP)** throughout BE and FE: Every class, module, service, and component has exactly one well-defined responsibility and reason to change.
  - **Frontend Hook Placement:** All React custom hooks (present and future) must strictly reside in a dedicated `hooks/` directory within their respective slice (e.g. `widgets/*/hooks/`, `features/*/hooks/`, `shared/hooks/`) with an `index.ts` export barrel, rather than a `model/` directory.
- **CLI Ergonomics & Zero Change:** CLI accepts `<inputFile> [outputFile]` (defaulting to `stdout`). Zero-change output is `"0"`. Input validation produces structured line/column diagnostics for CLI error reporting and real-time visual marking in the FE.

## Working rules for the AI tool on this repo

The deliverable isn't just code — Zach's requirements explicitly ask for:

1. **Full prompt transcript** — the raw conversation log(s), exported in entirety. Don't summarize or clean this up after the fact; export what actually happened. Always export and maintain these logs incrementally in `docs/gemini_logs.md` (for Gemini/Antigravity) and `docs/claude_logs.md` (for Claude Code), following `docs/initial_agent_creation.md` from the setup phase.
2. **Annotated diff / decision log** — keep a running `docs/decision_log.md` in this repo (indexed in `docs/index.md`), updated *as you go*, not reconstructed at the end. For every AI-generated chunk of code, note: kept as-is / modified (how, why) / rejected (why). "Looked fine" is not a reason — say what you evaluated it against.
3. **Verification info** — what tests were written, what edge cases they cover, and how you confirmed AI-generated code actually worked (don't just trust that it compiles).
4. **Tool/task mapping** — note which parts of the problem you used AI for differently (e.g., "used AI to scaffold the strategy interface, wrote the random-denomination algorithm by hand because the first AI attempt didn't guarantee termination," etc. — an example only, replace with what's actually true).
5. **Self-critique** — strongest part, weakest part, what you'd change, and why. Write this last, honestly, after the code exists — not aspirationally before it.

To make that record genuine rather than reconstructed:
- Maintain `docs/gemini_logs.md` incrementally with the raw prompt and response transcript of every interaction turn, without summarizing or omitting text.
- Before generating a chunk of implementation code, state the approach in one or two sentences and let Lee confirm or redirect before writing it out in full — especially for the strategy pattern shape, the random-denomination algorithm, and the currency abstraction, since those are the parts actually being evaluated.
- Flag any place where more than one reasonable design exists, instead of silently picking one.
- Don't auto-generate `docs/decision_log.md` or self-critique wholesale at the end from the transcript — draft entries as decisions actually happen, so the log reflects real-time judgment rather than a post-hoc narrative.
- If a generated test passes trivially or doesn't actually exercise the interesting logic (e.g., the divisible-by-3 branch, an EUR line item, a zero-change line), say so rather than treating "tests pass" as sufficient.

### Dual-Agent Plan Review Rule
Before executing any implementation plan (current and future phases):
1. **Peer Review Submission:** The authoring agent (Gemini in Antigravity) submits the plan to Claude (`claude -p`) for rigorous peer review.
2. **Critical Evaluation:** Gemini evaluates Claude's critique with technical rigor. Do not blindly accept or rubber-stamp critiques; evaluate each point against DDD, FSD, and SRP principles. Defend design choices when justified, and surface any genuine trade-offs or uncertainties to Lee.
3. **Review Loop Bound:** Conduct a maximum of 2 review loops (fewer if Claude has no actionable findings or consensus is reached).
4. **Plan Refinement & Logging:** Incorporate actionable findings into the plan and record the review exchange in the transcripts and `docs/decision_log.md`.
5. **Approval Gate:** After the review cycle concludes, present the finalized plan to Lee and await Lee's explicit approval before modifying any implementation/code files.

## Testing

Framework: **Vitest**.

Minimum edge cases to cover explicitly (beyond the three sample lines):
- Exact payment (owed == paid) → zero change, however that's defined per the open item above.
- An owed amount whose cents value is divisible by 3 vs. one that isn't, confirming the correct code path fires.
- A random-path result, asserted on *total value* (must equal the change amount) rather than on exact denomination output, since it's intentionally non-deterministic — seed the RNG in tests if that's the chosen approach, or assert on the invariant instead.
- At least one EUR line, proving the currency abstraction actually swaps cleanly.
- A case requiring every denomination at once (to catch off-by-one greedy-algorithm bugs in the minimum-coin path).
