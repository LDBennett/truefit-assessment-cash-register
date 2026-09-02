import { Button as BaseButton } from '@base-ui/react/button';
import React from 'react';

import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ComponentProps<typeof BaseButton> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, ...props },
  ref
) {
  return (
    <BaseButton
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
        size === 'sm' && 'text-xs px-2.5 py-1.5 gap-1.5',
        size === 'md' && 'text-sm px-3.5 py-2 gap-2',
        size === 'lg' && 'text-base px-5 py-2.5 gap-2.5',
        variant === 'primary' &&
          'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm shadow-emerald-950/50',
        variant === 'secondary' &&
          'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 active:bg-slate-800',
        variant === 'ghost' &&
          'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 active:bg-slate-800',
        variant === 'accent' &&
          'bg-amber-600 text-white hover:bg-amber-500 active:bg-amber-700 shadow-sm shadow-amber-950/50',
        variant === 'danger' &&
          'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm shadow-rose-950/50',
        className
      )}
      {...props}
    >
      {children}
    </BaseButton>
  );
});
