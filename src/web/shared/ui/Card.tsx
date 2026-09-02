import React from 'react';

import { cn } from '../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'default' | 'subtle' | 'ghost';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl transition-all',
        variant === 'default' &&
          'bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md shadow-slate-950/40',
        variant === 'subtle' &&
          'bg-slate-900/40 border border-slate-800/60',
        variant === 'ghost' &&
          'bg-transparent border border-transparent',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
