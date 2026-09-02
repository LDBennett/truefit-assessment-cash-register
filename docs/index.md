# Documentation Index — Truefit Cash Register

Welcome to the documentation suite for the Truefit Cash Register technical assessment. This directory contains architectural specifications, decision logs, domain blueprints, UI theming guidelines, progress tracking, and complete conversation transcripts.

---

## Document Directory & Map

| Document | Purpose & Summary | When to Reference | When to Update | Maintainer / Source |
| :--- | :--- | :--- | :--- | :--- |
| [`index.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/index.md) | Central entry point and catalog for all documentation. | Starting a new task, onboarding, finding specific guides. | When new documentation files are added or restructured. | All agents & developers |
| [`architecture.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/architecture.md) | High-level system architecture, Domain-Driven Design (DDD), Feature-Sliced Design (FSD), and Single Responsibility Principle (SRP). | Reviewing system boundaries, component layering, and module responsibilities. | When architectural patterns or system layers change. | Architecture & Core Team |
| [`blueprint.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/blueprint.md) | Technical blueprint of domain models, strategy pattern, rule engine, parser diagnostics, and CLI/Web delivery. | Implementing domain logic, strategies, input parsing, or formatters. | When domain entities, interfaces, or algorithm specs evolve. | Domain & Core Team |
| [`decision_log.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/decision_log.md) | Real-time Architectural Decision Records (ADR) capturing options considered, chosen paths, and rationale. | Understanding *why* a technical choice was made; preparing the assessment write-up. | Incrementally with every technical decision or trade-off made. | All AI tools & developers |
| [`faqs.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/faqs.md) | Answers to key domain, design, and implementation questions (e.g. cents math, termination guarantee, error models). | Answering evaluators' questions, reviewing rationale for edge cases. | When an open question is resolved or a new nuance is addressed. | Core Team |
| [`theming.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/theming.md) | UI design system, Base UI integration, Tailwind palette, component states, and responsive layout rules. | Building or styling React components in the frontend. | When UI tokens, styling conventions, or component variants change. | Frontend Team |
| [`progress.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/progress.md) | Project roadmap, milestone status, test coverage checklist, and next steps. | Checking what is done, what is in flight, and what remains. | As features, test suites, or milestones are completed. | Project Lead |
| [`plans/`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans) | Directory of discrete phase plans (Phases 1 through 5). | Prior to executing each specific phase. | When phase scope or verification requirements are refined. | Core Team |
| [`initial_agent_creation.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/initial_agent_creation.md) | **Transcript Part 1:** Raw log from the initial setup and scoping session with Claude Cowork. | Reviewing initial problem breakdown, requirements, and AGENTS.md creation. | Read-only historical record (setup phase). | Claude (Cowork) |
| [`gemini_logs.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/gemini_logs.md) | **Transcript Part 2:** Raw conversation log with Gemini / Antigravity in the editor. | Reviewing in-editor pair programming turns, planning steps, and verification with Gemini. | Incrementally appended on every interaction turn. | Gemini (Antigravity) |
| [`claude_logs.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/claude_logs.md) | **Transcript Part 3:** Raw conversation log with Claude Code in the terminal/editor. | Reviewing terminal-based pair programming turns and verification with Claude Code. | Incrementally appended on every interaction turn. | Claude Code |

---

## Phase Implementation Plans (`docs/plans/`)

Each phase of implementation is isolated into a standalone plan for incremental execution, review, and verification:

1. [`docs/plans/phase_1_scaffolding.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_1_scaffolding.md) — Toolchain, dependencies (`@base-ui/react`, Tailwind CSS, Vitest), tsconfig, and scripts.
2. [`docs/plans/phase_2_core_domain.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_2_core_domain.md) — Pure DDD domain entities (`Money`, `Denomination`, `Currency` USD/EUR, `RegisterTransaction`, `ChangeDistribution`), strategies (`GreedyMinimum`, `Random`), and selector service.
3. [`docs/plans/phase_3_application_and_cli.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_3_application_and_cli.md) — Lexical `InputParser` with line/col diagnostics, `ChangeFormatter`, and Node.js CLI runner.
4. [`docs/plans/phase_4_web_frontend.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_4_web_frontend.md) — FSD React application, Base UI components, Tailwind CSS styling, real-time error gutter, and live workbench.
5. [`docs/plans/phase_5_verification_and_review.md`](file:///C:/Users/Lee/Documents/Code%20Sandbox/truefit-assessment-cash-register/docs/plans/phase_5_verification_and_review.md) — Edge case matrix, automated test execution, tool/task mappings, and final self-critique.

---

## Architectural Principles at a Glance

1. **Domain-Driven Design (DDD)** for the backend / core domain (`src/core/`):
   - Pure domain models (`Money`, `Denomination`, `Currency`, `RegisterTransaction`, `ChangeDistribution`).
   - Strategy pattern (`GreedyMinimumChangeStrategy`, `RandomChangeStrategy`).
   - Domain services (`StrategySelector`, `CashRegister`).
   - Complete isolation from I/O, Node.js, and React.

2. **Feature-Sliced Design (FSD)** for the frontend (`src/web/`):
   - Strict hierarchical layers: `app` → `pages` → `widgets` → `features` → `entities` → `shared`.
   - Clear unidirectional dependency flow.

3. **Single Responsibility Principle (SRP)** across both:
   - Each file, class, service, and component has exactly one reason to change.

4. **Transparent AI Governance:**
   - Incremental raw logs maintained per tool (`gemini_logs.md`, `claude_logs.md`).
   - Real-time decision tracking in `decision_log.md`.
