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
    process.exit(process.exitCode ?? 0);
  });
