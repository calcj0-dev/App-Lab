// Data -> HTML strings. Runs only at build time (called from the Vite plugin).
// M1: header only. Sections are added in M3 (設計書 2章).

export interface PageInput {
  siteName: string;
  version: string;
}

export interface RenderedPage {
  head: string;
  body: string;
}

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

export function renderHeader({ siteName, version }: PageInput): string {
  return [
    '<header class="site-header">',
    `<h1 class="site-name">${escapeHtml(siteName)}</h1>`,
    `<span class="site-version">v${escapeHtml(version)}</span>`,
    '</header>',
  ].join('');
}

export function renderPage(input: PageInput): RenderedPage {
  return {
    head: `<title>${escapeHtml(input.siteName)}</title>`,
    body: `${renderHeader(input)}<main class="page"></main>`,
  };
}
