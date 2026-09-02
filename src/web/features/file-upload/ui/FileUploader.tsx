import { Download, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Button, cn } from '@/shared';

import { FileUploaderProps } from '../types';

export function FileUploader({
  onFileLoaded,
  formattedOutput,
  disabled = false,
  className
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        onFileLoaded(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      // Reset input so re-selecting same file triggers onChange
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    // Append single trailing newline to match CLI output format
    const blob = new Blob([formattedOutput + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cash_register_output.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,text/plain"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled) fileInputRef.current?.click();
        }}
        className={cn(
          'cursor-pointer border border-dashed rounded-lg px-3 py-1.5 transition-colors flex items-center gap-2 select-none text-xs',
          isDragging
            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
            : 'border-slate-700 bg-slate-900 hover:border-slate-600 text-slate-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="Drop a .txt flat file or click to select"
      >
        <Upload size={14} className={isDragging ? 'text-emerald-400' : 'text-slate-400'} />
        <span>Drop file or Click to Upload</span>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleDownload}
        disabled={!formattedOutput.trim()}
        title="Download calculated change output file"
        className="text-xs"
      >
        <Download size={13} className="text-slate-300" />
        <span>Export .txt</span>
      </Button>
    </div>
  );
}
