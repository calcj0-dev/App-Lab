import { DEFAULT_LANG, type Lang, type Localized } from '../data.ts';

/** Picks the text for a language, falling back to Japanese. */
export function loc<T>(value: Localized<T>, lang: Lang = DEFAULT_LANG): T {
  return value[lang] ?? value.ja;
}

/** Fills {placeholders} in a message. Unknown placeholders are left as is. */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}
