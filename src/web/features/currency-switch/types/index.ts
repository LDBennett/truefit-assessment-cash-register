export interface CurrencySelectorProps {
  readonly value: 'USD' | 'EUR';
  readonly onChange: (currency: 'USD' | 'EUR') => void;
  readonly className?: string;
}
