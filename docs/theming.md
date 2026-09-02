# UI Theming & Design System — Truefit Cash Register

This document defines the styling architecture, component styling conventions, design tokens, and UI layout specifications for the Cash Register web frontend.

---

## 1. Design System Overview

The frontend combines two complementary tools:
1. **Tailwind CSS:** Utility-first CSS framework for rapid, consistent styling, responsive design, and design tokens.
2. **Base UI (`@base-ui/react`):** Headless, accessible UI component primitives providing keyboard navigation, screen-reader support, and flexible styling hooks without forced opinions.

---

## 2. Color Palette & Design Tokens

A clean, modern financial workbench palette:

| Token | Class | Description |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-950` / `bg-slate-900` | Deep slate dark background for a focused, technical aesthetic. |
| **Surface / Card** | `bg-slate-900/80` / `border-slate-800` | Subtle contrast container cards with frosted border separation. |
| **Primary Brand** | `emerald-500` / `emerald-600` | Financial green used for primary actions, success states, and cash amounts. |
| **Accent / Twist** | `amber-500` / `amber-400` | Warm amber highlight for the "random twist" special case indicators. |
| **Error / Diagnostic** | `rose-500` / `rose-400` | High-visibility red for invalid tokens, underpayment, and syntax errors. |
| **Text Primary** | `text-slate-100` | High contrast text for labels, inputs, and results. |
| **Text Muted** | `text-slate-400` | Secondary text for hints, line numbers, and currency symbols. |

---

## 3. Typography & Monospace Formatting

- **Sans-serif (`font-sans`):** Inter / system-ui for labels, buttons, dialogs, and descriptions.
- **Monospace (`font-mono`):** JetBrains Mono / Fira Code / system monospace for:
  - Input editor text and line numbers.
  - Parsed cash amounts (`2.12`, `3.00`).
  - Denomination breakdown outputs.
  - Positional column indicators.

---

## 4. Tailwind CSS v4 & Styling Pipeline

Styling uses Tailwind CSS v4 via `@tailwindcss/vite`. It is entirely CSS-first, with zero legacy JavaScript configuration (`tailwind.config.js` and `postcss.config.js` are eliminated):
- **Entry Stylesheet (`src/web/app/styles/index.css`):**
  ```css
  @import "tailwindcss";

  @theme {
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  ```
- **Path Aliases:**
  - `@/*` points to `src/web/*` (the standard Feature-Sliced Design root).
  - `@core/*` points to `src/core/*` (the DDD core domain and application layer).

---

## 5. Base UI Integration Pattern

Base UI components are headless and unstyled. We wrap them in `src/web/shared/ui/` with Tailwind CSS classes using `clsx` and `tailwind-merge` (`cn` helper):

### Button (`src/web/shared/ui/Button.tsx`)
```tsx
import { Button as BaseButton } from '@base-ui/react/button';
import { cn } from '@/shared/lib/cn';
```

export function Button({ variant = 'primary', className, ...props }) {
  return (
    <BaseButton
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        variant === 'primary' && 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
        variant === 'secondary' && 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700',
        variant === 'ghost' && 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
        className
      )}
      {...props}
    />
  );
}
```

---

## 5. Input Editor & Positional Error Highlighting

A key UX feature is real-time highlighting of invalid input rows and character spans:
- **Gutter Column:** Shows line numbers (1, 2, 3...) with red warning dots next to lines with errors.
- **Underline / Squiggle:** Any token identified with a parse error (e.g., column 6 to 10 for underpayment or malformed decimal) is styled with a wavy red underline (`decoration-rose-500 underline decoration-wavy`).
- **Error Inspector Banner:** Displays an expandable list of diagnostics detailing the exact line, column, and remediation hint. Clicking an error scrolls to and selects the affected characters.

---

## 6. Responsive Workbench Layout

The workbench layout (`src/web/widgets/register-workbench/`):
- **Desktop (>= 1024px):** Side-by-side two-column view:
  - **Left Column:** Flat-file input editor, sample loader quick-buttons, drag-and-drop file upload zone, and real-time validation error drawer.
  - **Right Column:** Transaction results table, strategy badge (`Minimal` vs `Random Twist`), currency breakdown badges, and output export/copy buttons.
- **Tablet / Mobile (< 1024px):** Stacked vertical view with sticky calculation trigger.
