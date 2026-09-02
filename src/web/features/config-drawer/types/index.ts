export interface ConfigDrawerProps {
  readonly divisor: number;
  readonly onChange: (divisor: number) => void;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly className?: string;
}
