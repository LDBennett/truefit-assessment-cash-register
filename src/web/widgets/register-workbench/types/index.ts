export interface RegisterWorkbenchProps {
  readonly currencyCode: 'USD' | 'EUR';
  readonly onCurrencyChange: (code: 'USD' | 'EUR') => void;
  readonly divisor: number;
  readonly onDivisorChange: (divisor: number) => void;
  readonly className?: string;
}
