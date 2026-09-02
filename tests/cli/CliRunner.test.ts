import { describe, expect, it } from 'vitest';

import { parseCliArgs, runCli } from '../../src/cli/src/cliRunner';
import { CliIo } from '../../src/cli/src/types';

function createMockIo(files: Record<string, string> = {}): {
  io: CliIo;
  getStdout: () => string;
  getStderr: () => string;
  getWrittenFiles: () => Record<string, string>;
} {
  const fileStore: Record<string, string> = { ...files };
  const writtenFiles: Record<string, string> = {};
  let stdoutData = '';
  let stderrData = '';

  const io: CliIo = {
    readFile: async (path: string) => {
      if (!(path in fileStore)) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return fileStore[path]!;
    },
    writeFile: async (path: string, content: string) => {
      writtenFiles[path] = content;
      fileStore[path] = content;
    },
    stdout: (msg: string) => {
      stdoutData += msg;
    },
    stderr: (msg: string) => {
      stderrData += msg;
    }
  };

  return {
    io,
    getStdout: () => stdoutData,
    getStderr: () => stderrData,
    getWrittenFiles: () => writtenFiles
  };
}

describe('CLI Runner & Argument Parser (Infrastructure/Presentation)', () => {
  describe('parseCliArgs', () => {
    it('parses mandatory inputFile and optional outputFile', () => {
      const args1 = parseCliArgs(['input.txt']);
      expect(args1.inputFile).toBe('input.txt');
      expect(args1.outputFile).toBeUndefined();
      expect(args1.currencyCode).toBe('USD');
      expect(args1.divisor).toBe(3);

      const args2 = parseCliArgs(['input.txt', 'out.txt']);
      expect(args2.inputFile).toBe('input.txt');
      expect(args2.outputFile).toBe('out.txt');
    });

    it('parses --currency flag in both space and equals syntax', () => {
      expect(parseCliArgs(['in.txt', '--currency', 'EUR']).currencyCode).toBe('EUR');
      expect(parseCliArgs(['in.txt', '--currency=EUR']).currencyCode).toBe('EUR');
    });

    it('parses --divisor flag in both space and equals syntax', () => {
      expect(parseCliArgs(['in.txt', '--divisor', '5']).divisor).toBe(5);
      expect(parseCliArgs(['in.txt', '--divisor=7']).divisor).toBe(7);
    });

    it('throws when required inputFile is missing', () => {
      expect(() => parseCliArgs([])).toThrow('Missing required argument');
    });

    it('throws for unsupported currency', () => {
      expect(() => parseCliArgs(['in.txt', '--currency', 'GBP'])).toThrow(
        'Supported currencies: USD, EUR'
      );
      expect(() => parseCliArgs(['in.txt', '--currency=XYZ'])).toThrow(
        'Supported currencies: USD, EUR'
      );
    });

    it('throws for invalid divisor (non-integer or < 2)', () => {
      expect(() => parseCliArgs(['in.txt', '--divisor', '1'])).toThrow(
        'greater than or equal to 2'
      );
      expect(() => parseCliArgs(['in.txt', '--divisor', 'abc'])).toThrow(
        'greater than or equal to 2'
      );
      expect(() => parseCliArgs(['in.txt', '--divisor=1'])).toThrow(
        'greater than or equal to 2'
      );
    });

    it('throws for unrecognized flags and extra arguments', () => {
      expect(() => parseCliArgs(['in.txt', '--unknown'])).toThrow('Unrecognized flag');
      expect(() => parseCliArgs(['in.txt', 'out.txt', 'extra.txt'])).toThrow(
        'Unexpected extra argument'
      );
    });
  });

  describe('runCli End-to-End Execution', () => {
    const sampleInput = '2.12,3.00\n1.97,2.00\n3.33,5.00\n';

    it('processes sample input and prints to stdout with exit code 0', async () => {
      const { io, getStdout, getStderr } = createMockIo({ 'sample.txt': sampleInput });
      const exitCode = await runCli(['sample.txt'], io);

      expect(exitCode).toBe(0);
      expect(getStderr()).toBe('');

      const lines = getStdout().trim().split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('3 quarters,1 dime,3 pennies');
      expect(lines[1]).toBe('3 pennies');
      // Line 3 is random totaling 167 cents ($1.67)
      expect(lines[2]!.length).toBeGreaterThan(0);
    });

    it('writes output to file when outputFile argument is provided', async () => {
      const { io, getStdout, getWrittenFiles } = createMockIo({
        'input.txt': '2.12,3.00\n'
      });
      const exitCode = await runCli(['input.txt', 'output.txt'], io);

      expect(exitCode).toBe(0);
      expect(getStdout()).toBe('');
      expect(getWrittenFiles()['output.txt']).toBe('3 quarters,1 dime,3 pennies\n');
    });

    it('processes EUR currency when --currency EUR is specified', async () => {
      const { io, getStdout } = createMockIo({
        'eur.txt': '1.33,2.00\n'
      });
      const exitCode = await runCli(['eur.txt', '--currency', 'EUR'], io);

      expect(exitCode).toBe(0);
      expect(getStdout().trim()).toBe(
        '1 50-cent coin,1 10-cent coin,1 5-cent coin,1 2-cent coin'
      );
    });

    it('respects --divisor flag for random trigger routing', async () => {
      // 2.50 owed -> 250 cents. 250 % 5 == 0 -> triggers random path
      const { io, getStdout } = createMockIo({
        'div.txt': '2.50,3.00\n'
      });
      const exitCode = await runCli(['div.txt', '--divisor', '5'], io);

      expect(exitCode).toBe(0);
      expect(getStdout().trim().length).toBeGreaterThan(0);
    });

    it('handles empty input file by writing empty output and exiting 0', async () => {
      const { io, getStdout, getWrittenFiles } = createMockIo({
        'empty.txt': '   \n\n'
      });
      const exitCode = await runCli(['empty.txt', 'empty_out.txt'], io);

      expect(exitCode).toBe(0);
      expect(getStdout()).toBe('');
      expect(getWrittenFiles()['empty_out.txt']).toBe('');

      // Also test without outputFile (stdout branch)
      const { io: ioStdout, getStdout: getStdoutOnly } = createMockIo({
        'empty.txt': ''
      });
      const exitCodeStdout = await runCli(['empty.txt'], ioStdout);
      expect(exitCodeStdout).toBe(0);
      expect(getStdoutOnly()).toBe('');
    });

    it('returns exit code 2 when input file does not exist', async () => {
      const { io, getStderr } = createMockIo();
      const exitCode = await runCli(['missing.txt'], io);

      expect(exitCode).toBe(2);
      expect(getStderr()).toContain('Error reading file "missing.txt"');
    });

    it('returns exit code 2 on CLI argument syntax errors', async () => {
      const { io, getStderr } = createMockIo();
      const exitCode = await runCli(['in.txt', '--divisor', 'invalid'], io);

      expect(exitCode).toBe(2);
      expect(getStderr()).toContain('Usage: cash-register');
    });

    it('returns exit code 1 and writes nothing on input data validation failure (atomic fail-fast)', async () => {
      const badInput = '2.12,3.00\nmalformed\n3.00,1.00\n';
      const { io, getStderr, getWrittenFiles } = createMockIo({
        'bad.txt': badInput
      });
      const exitCode = await runCli(['bad.txt', 'out.txt'], io);

      expect(exitCode).toBe(1);
      expect(getStderr()).toContain('Line 2, Col 1: [INVALID_FORMAT]');
      expect(getStderr()).toContain('Line 3, Col 1: [UNDERPAID]');
      // File must NOT have been written
      expect(getWrittenFiles()['out.txt']).toBeUndefined();
    });
  });
});
