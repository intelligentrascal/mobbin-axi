#!/usr/bin/env node
// Fast path: handle version flags before loading the full CLI command graph
// Only match exact single-argument version invocations; extra args fall through to the CLI
if ((process.argv[2] === '--version' || process.argv[2] === '-v' || process.argv[2] === '-V') && process.argv.length === 3) {
  process.stdout.write('0.1.3\n');
  process.exit(0);
}
const [{ main }, { AxiError, exitCodeForError }, { closeClient }] = await Promise.all([
  import('../src/cli.js'),
  import('../src/errors.js'),
  import('../src/mcp/client.js'),
]);
main()
  .catch((err: unknown) => {
    process.stderr.write((err instanceof Error ? err.message : String(err)) + '\n');
    process.exitCode = err instanceof AxiError ? exitCodeForError(err) : 1;
  })
  .finally(async () => {
    await closeClient();
    const code = process.exitCode ?? 0;
    if (process.stdout.writableLength === 0) process.exit(code);
    else process.stdout.once('drain', () => process.exit(code));
  });
