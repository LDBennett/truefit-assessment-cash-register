// @vitest-environment happy-dom
import { ParseDiagnostic } from '@core/index';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InputEditor } from '@/features/input-editor';

describe('InputEditor component (features/input-editor)', () => {
  it('renders textarea with line numbers in the gutter', () => {
    const text = '2.12,3.00\n1.97,2.00';
    render(
      <InputEditor
        value={text}
        onChange={() => {}}
        diagnostics={[]}
      />
    );

    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter owed,paid pairs/i)).toBeDefined();
  });

  it('renders red warning indicator dot and inspector panel when diagnostics exist', () => {
    const diagnostic: ParseDiagnostic = {
      code: 'UNDERPAID',
      message: 'Amount paid is less than amount owed',
      line: 2,
      rawLine: '3.00,1.00',
      startColumn: 1,
      endColumn: 9
    };

    render(
      <InputEditor
        value={'2.12,3.00\n3.00,1.00'}
        onChange={() => {}}
        diagnostics={[diagnostic]}
      />
    );

    // Gutter error dot
    expect(screen.getByText('●')).toBeDefined();

    // Diagnostic inspector panel
    expect(screen.getByText(/1 Error Found/i)).toBeDefined();
    expect(screen.getByText(/L2:1-9/i)).toBeDefined();
    expect(screen.getByText(/Amount paid is less than amount owed/i)).toBeDefined();
  });

  it('triggers onChange when textarea content changes', () => {
    const handleChange = vi.fn();
    render(
      <InputEditor
        value=""
        onChange={handleChange}
        diagnostics={[]}
      />
    );

    const textarea = screen.getByPlaceholderText(/Enter owed,paid pairs/i);
    fireEvent.change(textarea, { target: { value: '2.12,3.00' } });

    expect(handleChange).toHaveBeenCalledWith('2.12,3.00');
  });
});
