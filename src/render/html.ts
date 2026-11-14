const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Root-relative path for a file under public/ (data stores it without a leading slash). */
export function publicPath(path: string): string {
  return `/${path}`;
}

/**
 * Every link opens in a new tab (owner, 2026-11-14). Only `noopener`, never `noreferrer`:
 * the apps count visits from this site by the referrer (設計書 7.2, T-09).
 */
export const NEW_TAB = ' target="_blank" rel="noopener"';
