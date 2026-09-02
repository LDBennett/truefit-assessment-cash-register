import { Receipt,RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { CurrencyBadge, TransactionResultRow } from '@/entities';
import { FileUploader, InputEditor, SampleLoader, SAMPLES } from '@/features';
import { Badge, Button, Card, cn } from '@/shared';

import { useRegisterCalculation } from '../hooks';
import { RegisterWorkbenchProps } from '../types';

export function RegisterWorkbench({
  currencyCode,
  divisor,
  className
}: RegisterWorkbenchProps) {
  const [inputText, setInputText] = useState<string>(SAMPLES.README);
  const [rerollKey, setRerollKey] = useState<number>(0);

  const {
    currency,
    safeDivisor,
    parseResult,
    lineItems,
    formattedOutput
  } = useRegisterCalculation({
    inputText,
    currencyCode,
    divisor,
    rerollKey
  });

  const handleReroll = () => {
    setRerollKey((prev) => prev + 1);
  };

  return (
    <div
      className={cn(
        'max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6',
        className
      )}
    >
      {/* Left Column: Input Editor & Ingestion Controls (5 cols on desktop) */}
      <div className="lg:col-span-6 space-y-4 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SampleLoader onLoadSample={setInputText} />
        </div>

        <InputEditor
          value={inputText}
          onChange={setInputText}
          diagnostics={parseResult.diagnostics}
          className="flex-1"
        />

        <div className="flex items-center justify-between pt-1">
          <FileUploader
            onFileLoaded={setInputText}
            formattedOutput={formattedOutput}
          />
        </div>
      </div>

      {/* Right Column: Real-Time Results & Denominations (7 cols on desktop) */}
      <div className="lg:col-span-6 space-y-4 flex flex-col">
        {/* Results Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              Calculation Results
            </h2>
            <Badge variant="slate" size="sm" className="font-mono text-xs">
              {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <CurrencyBadge currency={currency} />

            <Badge variant="slate" size="sm" className="font-mono text-xs hidden sm:inline-flex">
              Divisor: {safeDivisor}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReroll}
              title="Re-sample random twist denominations"
              className="text-xs py-1 px-2.5 text-amber-300 hover:text-amber-200 hover:bg-amber-950/30"
            >
              <RefreshCw size={12} className="text-amber-400" />
              <span>Re-roll Twist</span>
            </Button>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {lineItems.length > 0 ? (
            lineItems.map((item) => (
              <TransactionResultRow
                key={`${item.lineNumber}-${item.rawLine}`}
                item={item}
              />
            ))
          ) : (
            <Card className="p-8 text-center bg-slate-900/40 border-dashed border-slate-800 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
                <Receipt size={24} />
              </div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">
                No Valid Transactions to Display
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter valid <code className="text-slate-400">owed,paid</code> pairs in the editor, load a preset, or drag and drop a flat file.
              </p>
            </Card>
          )}
        </div>

        {/* Plain Text Formatted Output Preview (matches CLI output) */}
        {formattedOutput.trim() && (
          <Card className="p-3 bg-slate-950 border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400">
                CLI Flat-File Format Preview (Standard Output)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                comma-separated &bull; singular/plural
              </span>
            </div>
            <pre className="font-mono text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/60 overflow-x-auto whitespace-pre">
              {formattedOutput}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
