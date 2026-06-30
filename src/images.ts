import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { CACHE_DIR } from './config.js';

function cacheDir(): string {
  return process.env.MOBBIN_CACHE_DIR ?? CACHE_DIR;
}

type FetchLike = (
  url: string,
) => Promise<{ ok: boolean; status?: number; arrayBuffer: () => Promise<ArrayBuffer> }>;

export async function downloadImages(
  urls: string[],
  fetchImpl: FetchLike = fetch as FetchLike,
): Promise<string[]> {
  const dir = cacheDir();
  mkdirSync(dir, { recursive: true });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const ext = extname(new URL(url).pathname) || '.webp';
    const file = join(
      dir,
      createHash('sha1').update(url).digest('hex') + ext,
    );
    if (!existsSync(file)) {
      try {
        const res = await fetchImpl(url);
        if (!res.ok) {
          process.stderr.write(
            `mobbin-axi: image fetch failed (${res.status ?? '?'}) ${url}\n`,
          );
          continue;
        }
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      } catch (e) {
        process.stderr.write(
          `mobbin-axi: image fetch error ${url}: ${(e as Error).message}\n`,
        );
        continue;
      }
    }
    out.push(file);
  }
  return out;
}
