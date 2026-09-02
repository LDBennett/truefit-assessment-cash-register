// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ConfigDrawer,
  CurrencySelector,
  FileUploader,
  SampleLoader,
  SAMPLES
} from '@/features';

describe('Frontend Feature Components (features/*)', () => {
  describe('CurrencySelector', () => {
    it('triggers onChange when switching currency buttons', () => {
      const handleChange = vi.fn();
      render(<CurrencySelector value="USD" onChange={handleChange} />);

      const eurBtn = screen.getByRole('radio', { name: /€ EUR/i });
      fireEvent.click(eurBtn);
      expect(handleChange).toHaveBeenCalledWith('EUR');
    });
  });

  describe('SampleLoader', () => {
    it('calls onLoadSample with respective sample text on button click', () => {
      const handleLoad = vi.fn();
      render(<SampleLoader onLoadSample={handleLoad} />);

      fireEvent.click(screen.getByRole('button', { name: /Official Sample/i }));
      expect(handleLoad).toHaveBeenCalledWith(SAMPLES.README);

      fireEvent.click(screen.getByRole('button', { name: /Zero Change/i }));
      expect(handleLoad).toHaveBeenCalledWith(SAMPLES.ZERO_CHANGE);

      fireEvent.click(screen.getByRole('button', { name: /All Denominations/i }));
      expect(handleLoad).toHaveBeenCalledWith(SAMPLES.ALL_DENOMS);

      fireEvent.click(screen.getByRole('button', { name: /Diagnostics \/ Errors/i }));
      expect(handleLoad).toHaveBeenCalledWith(SAMPLES.ERRORS);
    });
  });

  describe('ConfigDrawer', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ConfigDrawer
          divisor={3}
          onChange={() => {}}
          isOpen={false}
          onClose={() => {}}
        />
      );

      expect(screen.queryByText('Rule Configuration')).toBeNull();
    });

    it('renders drawer and allows changing divisor and clicking presets', () => {
      const handleChange = vi.fn();
      const handleClose = vi.fn();

      render(
        <ConfigDrawer
          divisor={3}
          onChange={handleChange}
          isOpen={true}
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Rule Configuration')).toBeDefined();

      // Click preset 5
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      expect(handleChange).toHaveBeenCalledWith(5);

      // Type new divisor into input
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '7' } });
      expect(handleChange).toHaveBeenCalledWith(7);

      // Click Done
      fireEvent.click(screen.getByRole('button', { name: /Done/i }));
      expect(handleClose).toHaveBeenCalled();
    });

    it('shows warning validation text when divisor is invalid (< 2)', () => {
      render(
        <ConfigDrawer
          divisor={1}
          onChange={() => {}}
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(
        screen.getByText(/Must be an integer greater than or equal to 2/i)
      ).toBeDefined();
    });
  });

  describe('FileUploader', () => {
    it('renders upload dropzone and export button', () => {
      render(
        <FileUploader
          onFileLoaded={() => {}}
          formattedOutput="3 quarters,1 dime,3 pennies"
        />
      );

      expect(screen.getByText(/Drop file or Click to Upload/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Export \.txt/i })).toBeDefined();
    });

    it('triggers file download on export click', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:test');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      render(
        <FileUploader
          onFileLoaded={() => {}}
          formattedOutput="3 quarters,1 dime,3 pennies"
        />
      );

      const exportBtn = screen.getByRole('button', { name: /Export \.txt/i });
      fireEvent.click(exportBtn);

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
    });
  });
});
