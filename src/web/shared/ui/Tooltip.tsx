import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import React from 'react';

export function TooltipProvider({
  children
}: {
  readonly children: React.ReactNode;
}) {
  return <BaseTooltip.Provider>{children}</BaseTooltip.Provider>;
}

export interface TooltipProps {
  readonly content: React.ReactNode;
  readonly children: React.ReactElement;
  readonly side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup className="z-50 max-w-xs rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 shadow-lg border border-slate-700 animate-in fade-in-0 zoom-in-95">
            {content}
            <BaseTooltip.Arrow className="fill-slate-800" />
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
