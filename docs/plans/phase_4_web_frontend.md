# Phase 4 Plan — Web Frontend (FSD, React 19, Base UI & Tailwind CSS)

This document specifies the architectural implementation plan for **Phase 4: Web Frontend**, built strictly adhering to **Feature-Sliced Design (FSD)**, React 19 functional components and custom hooks, Base UI headless primitives (`@base-ui/react`), Lucide icons, and Tailwind CSS v4 design tokens from `docs/theming.md`.

---

## 1. Goal Description

Build a high-performance, accessible, and reactive financial workbench for cashiers and retail administrators:
1. **Interactive Multi-Line Editor (`features/input-editor`):**
   - Monospace editor (`wrap="off"`) with scroll-synchronized line-numbered gutter.
   - Real-time diagnostic red warning indicators (`●`) on lines with errors.
   - Diagnostic inspector panel detailing 1-indexed `line`, `startColumn`, and `endColumn` (inclusive) coordinates with click-to-select range in textarea.
2. **Drag-and-Drop & Export (`features/file-upload`):**
   - Drag-and-drop ingestion of flat `.txt` files directly into editor state.
   - One-click `.txt` file export downloading calculated results matching CLI format with single trailing `\n`.
3. **Live Currency & Divisor Controls (`features/currency-switch`, `features/config-drawer`):**
   - Instant currency toggle between USD ($) and EUR (€), re-calculating denominations immediately.
   - Divisor configuration drawer (default 3, allowing client adjustment to 5, 7, etc.), guarded against invalid inputs.
4. **Stable Twist via Result Caching & Re-roll (`F7`):**
   - Random change distributions are cached per line using `` `${rerollKey}:${currencyCode}:${safeDivisor}:${rawLine}` ``. Keystrokes on unrelated lines (e.g. line 5) do not re-randomize unchanged lines (e.g. line 3).
   - Cashiers can explicitly re-roll random distributions via the "Re-roll Twist" toolbar button (which increments `rerollKey`).
5. **Preset Sample Loader (`features/sample-loader`):**
   - Quick-load buttons for:
     - Official README Sample (`2.12,3.00`, `1.97,2.00`, `3.33,5.00`)
     - Exact Payment Zero-Change (`3.00,3.00`)
     - Underpayment & Malformed Errors (`abc,def`, `5.00,2.00`)
     - Full Currency Spectrum (exercising all denominations at once)
6. **Real-Time Transaction Results Workbench (`widgets/register-workbench`):**
   - Derives linked transaction line rows (`lineNumber`, `rawLine`, `result`).
   - Strategy badges: `'GreedyMinimumChange'` $\rightarrow$ `Minimal Coins` (emerald), `'RandomChange'` $\rightarrow$ `Random Twist` (amber).
   - Visual denomination breakdown chips.

---

## 2. Feature-Sliced Design (FSD) Layering & Directory Standards

Every FSD slice follows the standard modular layout with explicit `index.ts` public contracts and isolated types:

```
src/web/
├── app/                              # Application bootstrap, root providers & styles
│   ├── main.tsx                      # ReactDOM entry point
│   ├── App.tsx                       # Root shell with Tooltip.Provider mounting RegisterPage
│   └── styles/
│       └── index.css                 # Tailwind CSS v4 theme variables
├── pages/                            # Full page composition
│   └── register-page/
│       ├── index.ts                  # Public barrel export
│       └── ui/
│           └── RegisterPage.tsx      # Composes Header, RegisterWorkbench, and Footer
├── widgets/                          # Autonomous composite UI blocks
│   ├── header/
│   │   ├── index.ts
│   │   └── ui/Header.tsx             # Top navbar with title, branding, and status
│   ├── footer/
│   │   ├── index.ts
│   │   └── ui/Footer.tsx             # Bottom bar with keyboard shortcuts and repo links
│   └── register-workbench/
│       ├── index.ts                  # Public barrel export
│       ├── hooks/
│       │   ├── index.ts              # Export custom hooks
│       │   └── useRegisterCalculation.ts # Pure calculation hook with twist caching
│       ├── types/
│       │   └── index.ts              # WorkbenchState, TransactionLineItem
│       └── ui/
│           └── RegisterWorkbench.tsx # Desktop side-by-side / mobile stacked orchestrator
├── features/                         # User interactions with business outcomes
│   ├── input-editor/
│   │   ├── index.ts                  # Public barrel export
│   │   ├── types/index.ts            # InputEditorProps
│   │   └── ui/InputEditor.tsx        # Textarea with synchronized gutter & diagnostic panel
│   ├── file-upload/
│   │   ├── index.ts                  # Public barrel export
│   │   ├── types/index.ts            # FileUploaderProps
│   │   └── ui/FileUploader.tsx       # Drag & drop zone + export download button
│   ├── currency-switch/
│   │   ├── index.ts                  # Public barrel export
│   │   ├── types/index.ts            # CurrencySelectorProps (value, onChange)
│   │   └── ui/CurrencySelector.tsx   # Toggle buttons for USD / EUR
│   ├── config-drawer/
│   │   ├── index.ts                  # Public barrel export
│   │   ├── types/index.ts            # ConfigDrawerProps (divisor, onChange, isOpen, onClose)
│   │   └── ui/ConfigDrawer.tsx       # Divisor number input & rule inspector
│   └── sample-loader/
│       ├── index.ts                  # Public barrel export
│       ├── types/index.ts            # SampleLoaderProps
│       └── ui/SampleLoader.tsx       # Preset buttons
├── entities/                         # Business models mapped to UI views
│   ├── transaction/
│   │   ├── index.ts                  # Public barrel export
│   │   ├── types/index.ts            # TransactionResultRowProps
│   │   └── ui/TransactionResultRow.tsx # Row with line number, chips, and twist badge
│   └── currency/
│       ├── index.ts                  # Public barrel export
│       └── ui/CurrencyBadge.tsx      # $ USD and € EUR visual pills
└── shared/                           # Reusable UI primitives and utilities
    ├── lib/
    │   ├── index.ts                  # Public barrel export
    │   └── cn.ts                     # clsx + tailwind-merge helper
    └── ui/
        ├── index.ts                  # Public barrel export
        ├── Button.tsx                # Base UI button with variants
        ├── Card.tsx                  # Styled surface card
        ├── Badge.tsx                 # Status and strategy badges
        └── Tooltip.tsx               # Base UI tooltip wrapper
```

---

## 3. Detailed Component & Hook Specifications

### 3.1 Reactive Calculation Hook with Line Caching (`hooks/useRegisterCalculation.ts`)
Addresses F2, F3, F6, F7:

```ts
export interface TransactionLineItem {
  readonly lineNumber: number;
  readonly rawLine: string;
  readonly result: TransactionResult;
}

export interface UseRegisterCalculationOptions {
  readonly inputText: string;
  readonly currencyCode: 'USD' | 'EUR';
  readonly divisor: number;
  readonly rerollKey: number;
}

export interface UseRegisterCalculationResult {
  readonly currency: Currency;
  readonly safeDivisor: number;
  readonly isDivisorValid: boolean;
  readonly parseResult: ParseResult;
  readonly lineItems: readonly TransactionLineItem[];
  readonly formattedOutput: string;
}

export function useRegisterCalculation(
  options: UseRegisterCalculationOptions
): UseRegisterCalculationResult {
  const { inputText, currencyCode, divisor, rerollKey } = options;

  const isDivisorValid = Number.isInteger(divisor) && divisor >= 2;
  const safeDivisor = isDivisorValid ? divisor : 3;

  const currency = CURRENCIES[currencyCode];

  const register = useMemo(() => {
    return createCashRegister({
      currency,
      selector: createStrategySelector({ divisor: safeDivisor })
    });
  }, [currency, safeDivisor]);

  const parseResult = useMemo(() => {
    return parseInputText(inputText, { currency, ignoreEmptyLines: true });
  }, [inputText, currency]);

  // Per-line result cache: avoids re-randomizing unchanged lines across keystrokes
  const resultCacheRef = useRef<Map<string, TransactionResult>>(new Map());

  // Clear cache when rerollKey increments or configuration changes
  useEffect(() => {
    resultCacheRef.current.clear();
  }, [rerollKey, currencyCode, safeDivisor]);

  const lineItems: readonly TransactionLineItem[] = useMemo(() => {
    const cache = resultCacheRef.current;

    return parseResult.lines
      .filter((l): l is typeof l & { transaction: RegisterTransaction } => l.transaction !== null)
      .map((line) => {
        const cacheKey = `${rerollKey}:${currencyCode}:${safeDivisor}:${line.rawLine}`;
        let res = cache.get(cacheKey);

        if (!res) {
          res = register(line.transaction);
          cache.set(cacheKey, res);
        }

        return {
          lineNumber: line.lineNumber,
          rawLine: line.rawLine,
          result: res
        };
      });
  }, [parseResult.lines, register, rerollKey, currencyCode, safeDivisor]);

  const formattedOutput = useMemo(() => {
    return formatDistributions(lineItems.map((item) => item.result.distribution));
  }, [lineItems]);

  return {
    currency,
    safeDivisor,
    isDivisorValid,
    parseResult,
    lineItems,
    formattedOutput
  };
}
```

---

### 3.2 Editor with Scroll-Synchronized Gutter (`features/input-editor/`)
Addresses F4:
- Textarea with `wrap="off"` and `font-mono`.
- Gutter element rendered to the left with line numbers and red `●` dots for lines matching `parseResult.diagnostics`.
- Scroll sync: Textarea `onScroll` mirrors `scrollTop` to the gutter `<div>`, ensuring line numbers stay aligned.
- Selection helper: Computes absolute offset by summing preceding line lengths + newlines:
  ```ts
  const rawLines = inputText.split(/\r?\n/);
  let base = 0;
  for (let i = 0; i < diagnostic.line - 1; i++) {
    base += rawLines[i]!.length + 1; // +1 for newline
  }
  const startOffset = base + (diagnostic.startColumn - 1);
  const endOffset = base + diagnostic.endColumn; // inclusive
  textarea.setSelectionRange(startOffset, endOffset);
  textarea.focus();
  ```

---

### 3.3 File Upload & Download (`features/file-upload/`)
- Ingestion: Drag & drop over dropzone or file picker (`.txt`, `.csv`) loads text via `FileReader.readAsText`.
- Export: Creates blob with single trailing newline (`new Blob([formattedOutput + '\n'], { type: 'text/plain' })`), downloading `cash_register_output.txt` matching CLI format.

---

### 3.4 Tooltip & Base UI Integration (`shared/ui/`)
- `shared/ui/Button.tsx`: Wraps `@base-ui/react/button`.
- `shared/ui/Tooltip.tsx`: Wraps `@base-ui/react/tooltip`.
- `app/App.tsx`: Wraps application in `Tooltip.Provider`.

---

## 4. Configuration Updates (Vite, TypeScript, Testing)

### 4.1 `vite.config.ts` Alias Configuration (Addresses F1)
Explicitly configure `resolve.alias` using `import.meta.dirname`:
```ts
import path from 'node:path';

resolve: {
  alias: {
    '@': path.resolve(import.meta.dirname, './src/web'),
    '@core': path.resolve(import.meta.dirname, './src/core')
  }
}
```

### 4.2 TypeScript Composite Configuration (Addresses F5b)
- In `tsconfig.app.json`: Add `"tests/web"` to `"include"` (it already includes `"DOM"`, `"DOM.Iterable"`, `"jsx": "react-jsx"`, and path aliases `@/*` and `@core/*`).
- In `tsconfig.node.json`: Add `"exclude": ["tests/web"]` so Node/CLI configuration does not attempt to compile React JSX files.
- Install `happy-dom` (`pnpm add -D happy-dom`) for DOM component tests.

---

## 5. Test & Verification Plan

### 5.1 Automated Test Suites:
1. `tests/web/shared/cn.test.ts`: Class merging and conditional tailwind classes.
2. `tests/web/widgets/useRegisterCalculation.test.ts`:
   - Valid sample lines compute correctly.
   - Line linkage (`lineNumber`, `rawLine`, `result`) preserved for every row.
   - Divisor guard defaults safely when invalid input (`0`, `1`, `NaN`) is supplied.
   - Currency toggle USD $\leftrightarrow$ EUR updates denominations.
   - Per-line twist caching preserves random breakdown of unchanged lines across keystrokes on other lines.
   - Incrementing `rerollKey` clears cache and triggers fresh random distribution.
3. `tests/web/components/InputEditor.test.tsx` (using `// @vitest-environment happy-dom`):
   - Renders gutter with line numbers and red indicator dot on invalid line.
   - Renders diagnostic messages in the inspector.
4. `tests/web/components/TransactionResultRow.test.tsx`:
   - Renders `Minimal Coins` (emerald) vs `Random Twist` (amber) badge based on strategy name.
   - Renders denomination chips with pluralized labels.
   - Renders `0` representation on exact payment.

### 5.2 Automated Verification Commands
```powershell
pnpm.cmd run typecheck
pnpm.cmd run lint
pnpm.cmd test
pnpm.cmd run test:coverage
pnpm.cmd run build
```

Verification Gate:
- 100% tests passing across all suites.
- High test coverage maintained across domain, application, CLI, and frontend.
- Production build succeeds cleanly in `dist/`.
