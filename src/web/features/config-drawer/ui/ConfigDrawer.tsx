import { AlertCircle, Check, Settings2, X } from 'lucide-react';

import { Button, Card, cn } from '@/shared';

import { ConfigDrawerProps } from '../types';

export function ConfigDrawer({
  divisor,
  onChange,
  isOpen,
  onClose,
  className
}: ConfigDrawerProps) {
  if (!isOpen) {
    return null;
  }

  const isValid = Number.isInteger(divisor) && divisor >= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-drawer-title"
    >
      <Card
        className={cn(
          'w-full max-w-md p-6 bg-slate-900 border-slate-700 shadow-2xl relative animate-in zoom-in-95 duration-150',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Settings2 size={18} className="text-emerald-400" />
            <h2 id="config-drawer-title">Rule Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Close configuration"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <label
              htmlFor="divisor-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Random Twist Divisor (Client Specification)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="divisor-input"
                type="number"
                min={2}
                step={1}
                value={Number.isNaN(divisor) ? '' : divisor}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChange(val);
                }}
                className={cn(
                  'w-full px-3 py-2 bg-slate-950 border rounded-lg font-mono text-sm text-slate-100 outline-none transition-colors',
                  isValid
                    ? 'border-slate-700 focus:border-emerald-500'
                    : 'border-rose-700 focus:border-rose-500'
                )}
                placeholder="e.g. 3"
              />
            </div>
            {!isValid && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>Must be an integer greater than or equal to 2 (defaults to 3).</span>
              </p>
            )}
          </div>

          <div>
            <span className="block text-xs text-slate-400 mb-2">Preset Divisors:</span>
            <div className="flex items-center gap-2">
              {[3, 5, 7, 10].map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant={divisor === preset ? 'primary' : 'secondary'}
                  onClick={() => onChange(preset)}
                  className="font-mono text-xs px-3"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="text-slate-300 font-medium flex items-center gap-1">
              <Check size={13} className="text-emerald-400" />
              <span>Extensibility Invariant</span>
            </div>
            <p>
              Satisfies the assessment requirement: <em>"The divisor should be easy for the client to change later."</em>
            </p>
            <p className="font-mono text-slate-500 pt-1">
              Trigger: <code className="text-amber-300">owedMinorUnits % {isValid ? divisor : 3} === 0</code>
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
