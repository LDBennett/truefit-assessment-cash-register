import { Banknote, Settings2 } from 'lucide-react';

import { CurrencySelector } from '@/features';
import { Badge, Button } from '@/shared';

export interface HeaderProps {
  readonly currencyCode: 'USD' | 'EUR';
  readonly onCurrencyChange: (code: 'USD' | 'EUR') => void;
  readonly onOpenConfig: () => void;
  readonly divisor: number;
}

export function Header({
  currencyCode,
  onCurrencyChange,
  onOpenConfig,
  divisor
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Banknote size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-100">
                Truefit Cash Register
              </h1>
              <Badge variant="emerald" size="sm" className="hidden sm:inline-flex">
                Production Ready
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Change Dispenser Workbench &amp; Spec Simulator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencySelector
            value={currencyCode}
            onChange={onCurrencyChange}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenConfig}
            title="Configure Divisor Rule"
            className="text-xs py-1.5 px-3"
          >
            <Settings2 size={14} className="text-slate-400" />
            <span className="hidden sm:inline">Divisor ({divisor})</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
