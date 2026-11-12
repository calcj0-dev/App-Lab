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
