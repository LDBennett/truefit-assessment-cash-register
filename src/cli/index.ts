#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

import { runCli } from './src/cliRunner';
import { CliIo } from './src/types';

const prodIo: CliIo = {
  readFile: (path: string) => readFile(path, 'utf8'),
  writeFile: (path: string, content: string) => writeFile(path, content, 'utf8'),
  stdout: (message: string) => process.stdout.write(message),
  stderr: (message: string) => process.stderr.write(message + '\n')
};

runCli(process.argv.slice(2), prodIo).then((exitCode) => {
  process.exitCode = exitCode;
});
