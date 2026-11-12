import { readFileSync } from 'node:fs';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { loadData } from './src/data.ts';
import { robotsTxt, sitemapXml } from './src/render/head.ts';
import { renderPage } from './src/render/page.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

function siteUrlFrom(env: Record<string, string>): string {
  const url = env.VITE_SITE_URL ?? '';
  if (!/^https:\/\/.+\/$/.test(url)) {
    throw new Error(`VITE_SITE_URL must be an https URL ending with "/" (got "${url}")`);
  }
  return url;
}

// Builds the page HTML from data at build/dev time, plus sitemap.xml and robots.txt (設計書 1・8章).
function portalHtml(env: Record<string, string>): Plugin {
  const siteUrl = siteUrlFrom(env);
  return {
    name: 'portal-html',
    transformIndexHtml(html) {
      const page = renderPage(loadData(), {
        version: pkg.version,
        year: new Date().getFullYear(),
        siteUrl,
        gscVerification: env.VITE_GSC_VERIFICATION || undefined,
      });
      return html.replace('<!--app-head-->', page.head).replace('<!--app-body-->', page.body);
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl, today) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [portalHtml(env)],
    test: {
      include: ['tests/**/*.test.ts'],
    },
  };
});
