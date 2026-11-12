// T-10: every text/background pair in style.css has contrast >= 4.5:1, light and dark (設計書 3.6).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(__dirname, '..', 'src', 'style.css'), 'utf8');
const DARK_MARKER = '@media (prefers-color-scheme: dark)';

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}

function firstRootBlock(text: string): string {
  const start = text.indexOf(':root {');
  if (start < 0) throw new Error('no :root block');
  return text.slice(start, text.indexOf('}', start));
}

const light = tokens(firstRootBlock(css));
const dark = { ...light, ...tokens(firstRootBlock(css.slice(css.indexOf(DARK_MARKER)))) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [text, background] — every combination the stylesheet actually uses.
const PAIRS: [string, string][] = [
  ['text', 'bg'],
  ['text', 'card'],
  ['muted', 'bg'],
  ['muted', 'card'],
  ['muted', 'chip'],
  ['muted', 'placeholder'],
  ['text', 'placeholder'],
  ['accent-strong', 'card'],
  ['accent-strong', 'bg'],
  ['on-accent', 'accent-strong'],
  ['coming', 'card'],
  ['coming', 'bg'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('T-10 contrast (%s)', (_mode, palette) => {
  it.each(PAIRS)('--%s on --%s >= 4.5', (fg, bg) => {
    expect(palette[fg], `--${fg} missing`).toBeDefined();
    expect(palette[bg], `--${bg} missing`).toBeDefined();
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
