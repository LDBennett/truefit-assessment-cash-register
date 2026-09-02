import {
  createCashRegister,
  createStrategySelector,
  CURRENCIES,
  Currency,
  formatDistributions,
  parseInputText
} from '../../core';
import { CliArgs, CliIo } from './types';

export function parseCliArgs(argv: readonly string[]): CliArgs {
  let inputFile: string | undefined;
  let outputFile: string | undefined;
  let currencyCode: 'USD' | 'EUR' = 'USD';
  let divisor = 3;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    if (arg === '--currency') {
      const next = argv[++i];
      if (!next || (next !== 'USD' && next !== 'EUR')) {
        throw new Error(
          `Invalid or missing currency. Supported currencies: USD, EUR. Received: ${next ?? 'none'}`
        );
      }
      currencyCode = next;
    } else if (arg.startsWith('--currency=')) {
      const val = arg.split('=')[1];
      if (val !== 'USD' && val !== 'EUR') {
        throw new Error(
          `Invalid currency. Supported currencies: USD, EUR. Received: ${val ?? 'none'}`
        );
      }
      currencyCode = val;
    } else if (arg === '--divisor') {
      const next = argv[++i];
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed < 2) {
        throw new Error(
          `Invalid divisor "${next}". Must be an integer greater than or equal to 2.`
        );
      }
      divisor = parsed;
    } else if (arg.startsWith('--divisor=')) {
      const val = arg.split('=')[1];
      const parsed = Number(val);
      if (!Number.isInteger(parsed) || parsed < 2) {
        throw new Error(
          `Invalid divisor "${val}". Must be an integer greater than or equal to 2.`
        );
      }
      divisor = parsed;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unrecognized flag: "${arg}"`);
    } else {
      if (!inputFile) {
        inputFile = arg;
      } else if (!outputFile) {
        outputFile = arg;
      } else {
        throw new Error(`Unexpected extra argument: "${arg}"`);
      }
    }
  }

  if (!inputFile) {
    throw new Error('Missing required argument: <inputFile>');
  }

  return Object.freeze({
    inputFile,
    outputFile,
    currencyCode,
    divisor
  });
}

export async function runCli(
  argv: readonly string[],
  io: CliIo
): Promise<number> {
  let args: CliArgs;

  try {
    args = parseCliArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(
      `Usage: cash-register <inputFile> [outputFile] [--currency USD|EUR] [--divisor N]\nError: ${message}`
    );
    return 2;
  }

  let content: string;
  try {
    content = await io.readFile(args.inputFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`Error reading file "${args.inputFile}": ${message}`);
    return 2;
  }

  const currency: Currency = CURRENCIES[args.currencyCode];

  if (content.trim() === '') {
    if (args.outputFile) {
      await io.writeFile(args.outputFile, '');
    }
    return 0;
  }

  const parseResult = parseInputText(content, {
    currency,
    ignoreEmptyLines: true
  });

  if (!parseResult.isValid) {
    const diagnosticsOutput = parseResult.diagnostics
      .map(
        (d) =>
          `Line ${d.line}, Col ${d.startColumn}: [${d.code}] ${d.message}`
      )
      .join('\n');
    io.stderr(diagnosticsOutput);
    return 1;
  }

  const register = createCashRegister({
    currency,
    selector: createStrategySelector({ divisor: args.divisor })
  });

  const distributions = parseResult.transactions.map(
    (tx) => register(tx).distribution
  );

  const formattedOutput = formatDistributions(distributions);

  if (args.outputFile) {
    await io.writeFile(args.outputFile, formattedOutput + '\n');
  } else {
    io.stdout(formattedOutput + '\n');
  }

  return 0;
}
