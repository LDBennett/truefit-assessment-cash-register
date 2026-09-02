# Phase 1 Plan — Project Scaffolding & Toolchain Configuration

This document specifies the exact goals, component changes, and verification steps for **Phase 1: Project Scaffolding & Toolchain Configuration**, refined through the Dual-Agent Plan Review cycle.

---

## 1. Goal Description

Establish a production-grade TypeScript, React 19, Tailwind CSS v4, `@base-ui/react`, ESLint, and Vitest toolchain using `pnpm`. This phase sets up the structural foundation, strict typechecking boundaries via composite project references, linting automation, CI workflows, and path alias infrastructure without premature business logic.

---

## 2. Architecture & Design Principles (SRP & Runtime Isolation)

To strictly enforce the Single Responsibility Principle and guarantee pure runtime isolation (ensuring CLI and core domain code cannot access browser DOM globals, and core domain code cannot access Node globals):
- **Tripartite Project References Architecture:**
  - `tsconfig.core.json`: Pure domain & application logic (`src/core`). Compiles with pure `lib: ["ES2022"]` and zero DOM or Node types. `composite: true`.
  - `tsconfig.app.json`: Browser & UI domain (`src/web`). References `tsconfig.core.json`. Compiles with `lib: ["ES2022", "DOM", "DOM.Iterable"]`. `composite: true`.
  - `tsconfig.node.json`: Node CLI, test runner, and tooling (`src/cli`, `tests`, `vite.config.ts`). References `tsconfig.core.json`. Compiles with `lib: ["ES2022"]` and Node types. `composite: true`.
  - `tsconfig.json`: Solution root orchestrating the three references.
- **Single Source of Truth for Path Aliases:**
  - Aliases defined in TypeScript configs (`@/*` -> `src/web/*`, `@core/*` -> `src/core/*`, `@tests/*` -> `tests/*`).
  - Bundler and test runner inherit aliases automatically via `vite-tsconfig-paths`.
- **Tailwind CSS v4 CSS-First Pipeline:**
  - Zero legacy JavaScript configuration (`tailwind.config.js` and `postcss.config.js` are eliminated).
  - Styles configured directly in `src/web/app/styles/index.css` via `@import "tailwindcss";` and `@theme`.
- **Unified Toolchain Configuration:**
  - Single `vite.config.ts` using `defineConfig` from `vitest/config` to eliminate type errors on the `test` block.
- **Standardized Package Manager:**
  - Unified on `pnpm` across local scripts and GitHub Actions CI.

---

## 3. Proposed File Changes

### [NEW] `package.json`
```json
{
  "name": "truefit-assessment-cash-register",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.1.3",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "dev": "vite",
    "build": "tsc -b && vite build",
    "cli": "tsx src/cli/index.ts"
  },
  "dependencies": {
    "@base-ui/react": "^1.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^1.39.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.1.0",
    "@vitest/coverage-v8": "^4.1.0",
    "eslint": "^9.20.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-simple-import-sort": "^12.1.0",
    "prettier": "^3.5.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.23.0",
    "typescript": "^5.9.0",
    "typescript-eslint": "^8.24.0",
    "vite": "^8.2.0",
    "vitest": "^4.1.0"
  }
}
```

### [NEW] `tsconfig.json` (Solution Root)
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.core.json" },
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### [NEW] `tsconfig.core.json` (Pure Domain & Application Core — Zero DOM / Zero Node)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"]
    }
  },
  "include": ["src/core"]
}
```

### [NEW] `tsconfig.app.json` (Web App & UI — DOM Enabled)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/web/*"],
      "@core/*": ["src/core/*"]
    }
  },
  "references": [
    { "path": "./tsconfig.core.json" }
  ],
  "include": ["src/web"]
}
```

### [NEW] `tsconfig.node.json` (CLI, Tooling & Tests — Node Enabled)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "composite": true,
    "types": ["node", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@tests/*": ["tests/*"]
    }
  },
  "references": [
    { "path": "./tsconfig.core.json" }
  ],
  "include": ["vite.config.ts", "src/cli", "tests"]
}
```

### [NEW] `vite.config.ts`
```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    tsconfigPaths: true
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

### [NEW] `src/web/app/styles/index.css`
```css
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### [NEW] `src/web/app/App.tsx`
- Minimal shell component establishing the root DOM node and importing styles.

### [NEW] `src/web/app/main.tsx`
- Entry script mounting `App` into `#root`.

### [NEW] `index.html`
- HTML shell with `#root` container linking to `/src/web/app/main.tsx`.

### [NEW] `src/core/smoke.ts` & `tests/smoke.test.ts`
- `src/core/smoke.ts`: Exports `CASH_REGISTER_VERSION = '1.0.0'`.
- `tests/smoke.test.ts`: Imports via `@core/smoke` and asserts value, verifying that TypeScript compilation, composite project references, and path aliases function end-to-end.

### [NEW] `eslint.config.js` & `.prettierrc`
- ESLint flat configuration using `typescript-eslint`, `eslint-plugin-simple-import-sort`, and `eslint-config-prettier`.
- Enforces import ordering, strict types, and zero unused variables.

### [NEW] `.gitignore`
- Ignores `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `.vite/`, `.system_generated/`, `.env`, and OS artifacts.

### [NEW] `.nvmrc`
```text
24
```

### [NEW] `.claude/settings.json`
```json
{
  "permissions": {
    "allow": [
      "Edit(docs/**)",
      "Write(docs/**)",
      "Read(**)"
    ]
  }
}
```
*(Permits Claude Code CLI to maintain transcript logs under `docs/claude_logs.md` during Dual-Agent Plan Review).*

### [NEW] `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test:coverage
      - run: pnpm run build
```

---

## 4. Verification Plan

### Automated Verification Commands
```powershell
pnpm.cmd install
pnpm.cmd run typecheck
pnpm.cmd run lint
pnpm.cmd test
pnpm.cmd run build
```
Verify:
1. `pnpm install` installs cleanly and generates `pnpm-lock.yaml`.
2. `tsc -b` typechecks `core`, `app`, and `node` composite projects without cross-boundary errors.
3. `pnpm run lint` passes with 0 errors.
4. Vitest passes the non-trivial `@core/*` alias import test.
5. `vite build` bundles `main.tsx` and `index.css` into `dist/` without errors.
