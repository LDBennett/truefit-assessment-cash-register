import { AlertTriangle, BookOpen, CheckCircle2, Coins } from 'lucide-react';

import { Button, cn } from '@/shared';

import { SampleLoaderProps } from '../types';

export const SAMPLES = {
  README: `2.12,3.00\n1.97,2.00\n3.33,5.00`,
  ZERO_CHANGE: `3.00,3.00\n1.50,1.50\n5.25,5.25`,
  ERRORS: `2.12,3.00\n3.00,2.12\nabc,5.00\n-1.00,2.00\n2.12,3.00,4.00`,
  ALL_DENOMS: `1.41,2.00\n0.59,2.00`
} as const;

export function SampleLoader({ onLoadSample, className }: SampleLoaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="text-xs text-slate-400 mr-1 select-none">Presets:</span>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onLoadSample(SAMPLES.README)}
        className="text-xs py-1 px-2.5"
      >
        <BookOpen size={13} className="text-emerald-400" />
        <span>Official Sample</span>
      </Button>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onLoadSample(SAMPLES.ZERO_CHANGE)}
        className="text-xs py-1 px-2.5"
      >
        <CheckCircle2 size={13} className="text-slate-400" />
        <span>Zero Change</span>
      </Button>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onLoadSample(SAMPLES.ALL_DENOMS)}
        className="text-xs py-1 px-2.5"
      >
        <Coins size={13} className="text-blue-400" />
        <span>All Denominations</span>
      </Button>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onLoadSample(SAMPLES.ERRORS)}
        className="text-xs py-1 px-2.5"
      >
        <AlertTriangle size={13} className="text-rose-400" />
        <span>Diagnostics / Errors</span>
      </Button>
    </div>
  );
}
