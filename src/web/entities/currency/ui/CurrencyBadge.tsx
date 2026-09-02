import { Badge, cn } from '@/shared';

import { CurrencyBadgeProps } from '../types';

export function CurrencyBadge({ currency, className }: CurrencyBadgeProps) {
  const isUSD = currency.code === 'USD';

  return (
    <Badge
      variant={isUSD ? 'emerald' : 'blue'}
      className={cn('font-mono tracking-tight text-xs font-semibold', className)}
    >
      <span>{currency.symbol}</span>
      <span>{currency.code}</span>
    </Badge>
  );
}
