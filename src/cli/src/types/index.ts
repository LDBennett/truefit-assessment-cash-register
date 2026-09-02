export interface CliIo {
  readonly readFile: (path: string) => Promise<string>;
  readonly writeFile: (path: string, content: string) => Promise<void>;
  readonly stdout: (message: string) => void;
  readonly stderr: (message: string) => void;
}

export interface CliArgs {
  readonly inputFile: string;
  readonly outputFile?: string;
  readonly currencyCode: 'USD' | 'EUR';
  readonly divisor: number;
}

export type CliExitCode = 0 | 1 | 2;
