#!/usr/bin/env node
import { main } from '../src/cli.js';
import { AxiError, exitCodeForError } from '../src/errors.js';
import { closeClient } from '../src/mcp/client.js';
main()
  .catch((err) => {
    process.stderr.write((err?.message ?? String(err)) + '\n');
    process.exitCode = err instanceof AxiError ? exitCodeForError(err) : 1;
  })
  .finally(async () => {
    await closeClient();
    const code = process.exitCode ?? 0;
    if (process.stdout.writableLength === 0) process.exit(code);
    else process.stdout.once('drain', () => process.exit(code));
  });
