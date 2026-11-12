import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { loadData } from './src/data.ts';
import { renderPage } from './src/render/page.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Builds the page HTML from data at build/dev time (設計書 1章).
function portalHtml(): Plugin {
  return {
    name: 'portal-html',
    transformIndexHtml(html) {
      const page = renderPage(loadData(), { version: pkg.version, year: new Date().getFullYear() });
      return html.replace('<!--app-head-->', page.head).replace('<!--app-body-->', page.body);
    },
  };
}

export default defineConfig({
  plugins: [portalHtml()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
