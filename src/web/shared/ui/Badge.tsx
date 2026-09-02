import React from 'react';

import { cn } from '../lib/cn';

export type BadgeVariant = 'slate' | 'emerald' | 'amber' | 'rose' | 'blue';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly size?: 'sm' | 'md';
}

export function Badge({
  variant = 'slate',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border select-none',
        size === 'sm' && 'text-xs px-1.5 py-0.5 gap-1',
        size === 'md' && 'text-xs px-2.5 py-1 gap-1.5',
        variant === 'slate' &&
          'bg-slate-800/80 text-slate-300 border-slate-700',
        variant === 'emerald' &&
          'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
        variant === 'amber' &&
          'bg-amber-950/60 text-amber-300 border-amber-800/80',
        variant === 'rose' &&
          'bg-rose-950/60 text-rose-300 border-rose-800/80',
        variant === 'blue' &&
          'bg-blue-950/60 text-blue-300 border-blue-800/80',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
