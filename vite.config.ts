import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { renderPage } from './src/render/page.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Builds the page HTML from data at build/dev time (設計書 1章).
function portalHtml(): Plugin {
  return {
    name: 'portal-html',
    transformIndexHtml(html) {
      // Site name moves to src/data/i18n/ja.json in M2.
      const page = renderPage({ siteName: 'Ted App Lab', version: pkg.version });
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
