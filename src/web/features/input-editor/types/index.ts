import { ParseDiagnostic } from '@core/index';

export interface InputEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly diagnostics: readonly ParseDiagnostic[];
  readonly className?: string;
}
