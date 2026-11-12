// T-08: no Japanese strings in src/**/*.ts — all wording lives in src/data/ (設計書 9.2).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const JAPANESE = /[぀-ヿ㐀-䶿一-鿿！-｠]/;

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === join(SRC, 'data') ? [] : tsFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

describe('T-08 source strings', () => {
  const files = tsFiles(SRC);

  it('finds the source files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [relative(SRC, f), f]))('%s has no Japanese outside comments', (_name, file) => {
    const offending = stripComments(readFileSync(file, 'utf8'))
      .split('\n')
      .filter((line) => JAPANESE.test(line));
    expect(offending).toEqual([]);
  });
});
