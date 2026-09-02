import { ParseDiagnostic } from '@core/index';
import { AlertCircle, CheckCircle2, Copy, Trash2 } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

import { Button, Card, cn } from '@/shared';

import { InputEditorProps } from '../types';

export function InputEditor({
  value,
  onChange,
  diagnostics,
  className
}: InputEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Split lines on raw text to match exact row counts
  const lines = useMemo(() => value.split(/\r?\n/), [value]);

  // Map diagnostics by line number for O(1) gutter marker lookup
  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, ParseDiagnostic>();
    for (const d of diagnostics) {
      if (!map.has(d.line)) {
        map.set(d.line, d);
      }
    }
    return map;
  }, [diagnostics]);

  // Synchronize scroll between textarea and gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Jump to error token and select characters in textarea
  const handleSelectDiagnostic = (d: ParseDiagnostic) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let base = 0;
    for (let i = 0; i < d.line - 1 && i < lines.length; i++) {
      base += lines[i]!.length + 1; // +1 for \n
    }
    const start = Math.max(0, base + (d.startColumn - 1));
    const end = Math.min(value.length, base + d.endColumn);

    textarea.setSelectionRange(start, end);
    textarea.focus();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Input Flat File</span>
          <span className="text-slate-500 font-mono">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy input text"
            className="text-xs py-0.5 px-2"
          >
            <Copy size={12} />
            <span>Copy</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            title="Clear editor"
            className="text-xs py-0.5 px-2 hover:text-rose-400"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* Editor Body with Synchronized Gutter */}
      <div className="relative flex bg-slate-950 font-mono text-xs leading-5 min-h-[220px] max-h-[380px] overflow-hidden">
        {/* Line Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 py-3 bg-slate-950/80 border-r border-slate-800/80 select-none overflow-hidden text-right pr-2 text-slate-600 shrink-0"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasError = diagnosticsByLine.has(lineNum);
            return (
              <div
                key={lineNum}
                className="h-5 flex items-center justify-end gap-1"
              >
                {hasError ? (
                  <span
                    className="text-rose-500 font-bold leading-none"
                    title={diagnosticsByLine.get(lineNum)?.message}
                  >
                    ●
                  </span>
                ) : (
                  <span className="w-1.5" />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          wrap="off"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          placeholder="Enter owed,paid pairs (e.g. 2.12,3.00)"
          className="w-full py-3 px-3 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-5 overflow-auto placeholder:text-slate-600"
        />
      </div>

      {/* Diagnostic Inspector Panel */}
      {diagnostics.length > 0 ? (
        <div className="border-t border-rose-900/40 bg-rose-950/20 p-3 max-h-[140px] overflow-y-auto space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <AlertCircle size={14} />
            <span>
              {diagnostics.length} {diagnostics.length === 1 ? 'Error' : 'Errors'} Found
            </span>
          </div>

          <div className="space-y-1 pt-1">
            {diagnostics.map((d, idx) => (
              <button
                key={`${d.line}-${d.startColumn}-${idx}`}
                onClick={() => handleSelectDiagnostic(d)}
                className="w-full text-left font-mono text-xs p-1.5 rounded hover:bg-rose-900/30 text-rose-300 flex items-start gap-2 transition-colors cursor-pointer"
                title="Click to jump to and highlight error"
              >
                <span className="bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-rose-800 shrink-0">
                  L{d.line}:{d.startColumn}-{d.endColumn}
                </span>
                <span className="truncate">{d.message}</span>
              </button>
            ))}
          </div>
        </div>
      ) : value.trim() ? (
        <div className="border-t border-slate-800 bg-slate-900/40 px-3.5 py-2 text-xs text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          <span>All input lines parsed cleanly</span>
        </div>
      ) : null}
    </Card>
  );
}
