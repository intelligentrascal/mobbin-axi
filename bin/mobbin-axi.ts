#!/usr/bin/env node
import { main } from '../src/cli.js';
import { AxiError, exitCodeForError } from '../src/errors.js';
main().catch((err) => {
  process.stderr.write((err?.message ?? String(err)) + '\n');
  process.exitCode = err instanceof AxiError ? exitCodeForError(err) : 1;
});
