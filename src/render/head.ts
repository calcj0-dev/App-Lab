// <head> tags: title, description, canonical, OGP, twitter:card, icons, JSON-LD (設計書 6.1・8章).
import type { App, PortalData } from '../data.ts';
import { escapeHtml } from './html.ts';
import { loc } from './i18n.ts';

export interface HeadOptions {
  /** Absolute site URL ending with "/" (VITE_SITE_URL). */
  siteUrl: string;
  /** Google Search Console HTML-tag value (VITE_GSC_VERIFICATION). Omitted when empty. */
  gscVerification?: string;
}

/** schema.org applicationCategory per site category. */
const SCHEMA_CATEGORY: Record<string, string> = {
  tool: 'FinanceApplication',
  game: 'GameApplication',
};

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

function meta(attr: 'name' | 'property', key: string, content: string): string {
  return `<meta ${attr}="${key}" content="${escapeHtml(content)}">`;
}

/** JSON for a <script> block: escape "<" so the data can never close the tag. */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function structuredData(data: PortalData, siteUrl: string): object[] {
  const { messages } = data;
  const publicApps = data.apps.filter((a): a is App & { url: string } => a.status === 'public' && a.url !== null);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: messages.site.name,
      url: siteUrl,
      description: messages.site.description,
      inLanguage: 'ja',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: publicApps.map((app, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: loc(app.name),
          url: app.url,
          description: loc(app.description),
          applicationCategory: SCHEMA_CATEGORY[app.category] ?? 'WebApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'JPY' },
        },
      })),
    },
  ];
}

export function renderHead(data: PortalData, options: HeadOptions): string {
  const { messages, site } = data;
  const { siteUrl } = options;
  const ogImage = new URL(site.ogImage, siteUrl).toString();

  const tags = [
    `<title>${escapeHtml(messages.site.title)}</title>`,
    meta('name', 'description', messages.site.description),
    `<link rel="canonical" href="${escapeHtml(siteUrl)}">`,
    meta('property', 'og:title', messages.site.ogTitle),
    meta('property', 'og:description', messages.site.ogDescription),
    meta('property', 'og:image', ogImage),
    meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
    meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
    meta('property', 'og:url', siteUrl),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:locale', 'ja_JP'),
    meta('property', 'og:site_name', messages.site.name),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'theme-color', site.themeColor),
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  ];
  if (options.gscVerification) {
    tags.push(meta('name', 'google-site-verification', options.gscVerification));
  }
  for (const block of structuredData(data, siteUrl)) {
    tags.push(`<script type="application/ld+json">${jsonForScript(block)}</script>`);
  }
  return tags.join('\n    ');
}

/** sitemap.xml: the top page only for now (detail pages are added in L-01). */
export function sitemapXml(siteUrl: string, lastmod: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${escapeHtml(siteUrl)}</loc><lastmod>${lastmod}</lastmod></url>`,
    '</urlset>',
    '',
  ].join('\n');
}

export function robotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', siteUrl).toString()}\n`;
}
