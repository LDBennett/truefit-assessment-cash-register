import { formatDenomination, formatMoney, isZeroMoney } from '@core/index';
import { Coins, Sparkles } from 'lucide-react';

import { Badge, cn } from '@/shared';

import { TransactionResultRowProps } from '../types';

export function TransactionResultRow({ item, className }: TransactionResultRowProps) {
  const { lineNumber, rawLine, result } = item;
  const isRandom = result.strategyName === 'RandomChange';
  const isZero = isZeroMoney(result.transaction.changeDue);

  return (
    <div
      className={cn(
        'p-3.5 rounded-lg border transition-all',
        isRandom
          ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Badge variant="slate" size="sm" className="font-mono text-slate-400">
            #{lineNumber}
          </Badge>
          <span className="font-mono text-xs text-slate-400 truncate max-w-[160px] sm:max-w-xs">
            {rawLine}
          </span>
        </div>

        <div>
          {isRandom ? (
            <Badge variant="amber" size="sm">
              <Sparkles size={12} className="text-amber-400" />
              <span>Random Twist</span>
            </Badge>
          ) : (
            <Badge variant="emerald" size="sm">
              <Coins size={12} className="text-emerald-400" />
              <span>Minimal Coins</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2.5">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div>
            <span>Owed: </span>
            <span className="font-mono text-slate-200">
              {formatMoney(result.transaction.owed)}
            </span>
          </div>
          <div>
            <span>Paid: </span>
            <span className="font-mono text-slate-200">
              {formatMoney(result.transaction.paid)}
            </span>
          </div>
          <div>
            <span>Change: </span>
            <span className="font-mono font-semibold text-emerald-400">
              {formatMoney(result.transaction.changeDue)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
          {isZero ? (
            <span className="text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded">
              0 (No change due)
            </span>
          ) : (
            result.distribution.entries.map((entry) => (
              <span
                key={entry.denomination.code}
                className={cn(
                  'text-xs font-mono px-2 py-0.5 rounded border select-none',
                  isRandom
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                )}
              >
                {formatDenomination(entry.denomination, entry.count)}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
