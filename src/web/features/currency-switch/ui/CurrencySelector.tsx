import { Button, cn } from '@/shared';

import { CurrencySelectorProps } from '../types';

export function CurrencySelector({
  value,
  onChange,
  className
}: CurrencySelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800',
        className
      )}
      role="radiogroup"
      aria-label="Select Currency"
    >
      <Button
        variant={value === 'USD' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onChange('USD')}
        aria-checked={value === 'USD'}
        role="radio"
        className={cn(
          'text-xs font-mono font-medium',
          value !== 'USD' && 'text-slate-400 hover:text-slate-200'
        )}
      >
        $ USD
      </Button>

      <Button
        variant={value === 'EUR' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onChange('EUR')}
        aria-checked={value === 'EUR'}
        role="radio"
        className={cn(
          'text-xs font-mono font-medium',
          value !== 'EUR' && 'text-slate-400 hover:text-slate-200'
        )}
      >
        € EUR
      </Button>
    </div>
  );
}
