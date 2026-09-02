# Phase 4 Plan — Web Frontend (FSD + Base UI + Tailwind CSS)

This document specifies the implementation plan for **Phase 4: Web Frontend**, built strictly with Feature-Sliced Design (FSD), Base UI headless primitives, and Tailwind CSS.

---

## 1. Goal Description

Build an interactive web application that provides a modern financial workbench for cashiers and administrators. Features include drag-and-drop flat-file uploading, real-time input editing with line and column error indicators, interactive currency switching (USD/EUR), live divisor configuration, and visual denomination breakdowns.

---

## 2. Feature-Sliced Design (FSD) Structure

```
src/web/
├── app/                  # Application initialization & global styling
├── pages/                # Route/Page level views
│   └── register-page/
├── widgets/              # Autonomous composite UI blocks
│   └── register-workbench/
├── features/             # User interaction slices with business outcomes
│   ├── input-editor/     # Textarea with line/col error highlighting
│   ├── file-upload/      # Drag & drop flat-file ingestion
│   ├── currency-switch/  # USD / EUR selector
│   ├── config-drawer/    # Divisor tuning drawer (e.g. 3 -> 5)
│   └── sample-loader/    # Sample data presets
├── entities/             # Business entities mapped to UI presentation
│   ├── transaction/      # Transaction row & breakdown chip display
│   └── currency/         # Currency badges & pills
└── shared/               # Reusable UI primitives & utilities
    ├── ui/               # Base UI wrappers (Button, Dialog, Tooltip, etc.)
    └── lib/              # cn() helper
```

---

## 3. Proposed File Changes

### 3.1 `src/web/shared/`
- **`lib/cn.ts`**: Standard helper using `clsx` and `tailwind-merge`.
- **`ui/Button.tsx`**: Base UI button wrapper with variants (`primary`, `secondary`, `ghost`, `danger`).
- **`ui/Card.tsx`**: Styled container card.
- **`ui/Badge.tsx`**: Visual badge for status, errors, and twist flags.
- **`ui/Tooltip.tsx`**: Base UI tooltip wrapper for helpful diagnostics.

### 3.2 `src/web/entities/`
- **`entities/currency/ui/CurrencyBadge.tsx`**: Renders currency tag with symbol (`$ USD`, `€ EUR`).
- **`entities/transaction/ui/TransactionResultRow.tsx`**: Renders individual transaction results with denomination chips and strategy indicator (`Minimal` vs `Random Twist`).

### 3.3 `src/web/features/`
- **`features/input-editor/ui/InputEditor.tsx`**:
  - Split gutter for line numbers.
  - Red marker dots on rows with diagnostics.
  - Inline squiggly underline on exact column spans with errors.
  - Interactive click-to-highlight.
- **`features/file-upload/ui/FileUploader.tsx`**:
  - Drag-and-drop zone reading flat `.txt` or `.csv` files into the editor.
- **`features/currency-switch/ui/CurrencySelector.tsx`**:
  - Switcher between USD and EUR.
- **`features/config-drawer/ui/ConfigDrawer.tsx`**:
  - Allows the user to change the random divisor (demonstrating the "Things to Consider" requirement).
- **`features/sample-loader/ui/SampleLoader.tsx`**:
  - One-click buttons to load:
    - Official README Sample
    - Exact Payment (Zero Change)
    - Underpayment & Malformed Errors
    - All Denominations

### 3.4 `src/web/widgets/`
- **`widgets/register-workbench/ui/RegisterWorkbench.tsx`**:
  - Side-by-side desktop view and stacked mobile view.
  - Left pane: Editor, file uploader, sample loader, and error panel.
  - Right pane: Active currency, strategy rules, live transaction breakdown table, and export button.

### 3.5 `src/web/pages/` & `src/web/app/`
- **`pages/register-page/ui/RegisterPage.tsx`**: Assembles workbench with header and footer.
- **`app/App.tsx`**: Mounts `RegisterPage`.
- **`app/main.tsx`**: React DOM mounting.
- **`app/styles/index.css`**: Tailwind directives and typography styles.

---

## 4. Verification Plan

### Automated Verification
- Component render tests in Vitest (using `@testing-library/react` if needed, or DOM smoke tests).

### Manual Verification
1. Run `npm.cmd run dev` and open in browser.
2. Type valid lines (`2.12,3.00`) and verify instant calculation of `3 quarters,1 dime,3 pennies`.
3. Type invalid lines (`5.00,2.00` or `abc,def`) and verify red markers appear on the exact line and character positions.
4. Upload a flat file via drag-and-drop; verify content loads and processes.
5. Switch currency to EUR and verify proper euro denominations appear.
6. Change divisor to 5; verify divisibility-by-5 triggers random twist.
