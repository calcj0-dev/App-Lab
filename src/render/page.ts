// Data -> HTML strings for the whole page. Runs only at build time (called from the Vite plugin).
import { DEFAULT_LANG, type PortalData } from '../data.ts';
import { renderCard } from './card.ts';
import type { RenderContext } from './context.ts';
import { renderFooter } from './footer.ts';
import { renderHead } from './head.ts';
import { escapeHtml } from './html.ts';
import { t } from './i18n.ts';
import { renderNews } from './news.ts';
import { groupApps } from './order.ts';
import { renderProfile } from './profile.ts';

export interface BuildInfo {
  version: string;
  year: number;
  /** Absolute site URL ending with "/" (VITE_SITE_URL). */
  siteUrl: string;
  /** Google Search Console HTML-tag value; omitted when empty. */
  gscVerification?: string;
}

export interface RenderedPage {
  head: string;
  body: string;
}

export function renderHeader(ctx: RenderContext, version: string): string {
  const { site } = ctx.messages;
  return [
    '<header class="site-header">',
    `<h1 class="site-name">${escapeHtml(site.name)}</h1>`,
    `<span class="site-version">${escapeHtml(t(site.version, { version }))}</span>`,
    '</header>',
  ].join('');
}

export function renderPage(data: PortalData, build: BuildInfo): RenderedPage {
  const ctx: RenderContext = { lang: DEFAULT_LANG, site: data.site, messages: data.messages };
  const headings = data.messages.categories as Record<string, string>;

  const sections = groupApps(data.apps, data.site.categories)
    .map(({ category, apps }) =>
      [
        `<section class="section category category--${escapeHtml(category.id)}" aria-labelledby="category-${escapeHtml(category.id)}">`,
        `<h2 class="section-heading" id="category-${escapeHtml(category.id)}">${escapeHtml(headings[category.id] ?? category.id)}</h2>`,
        `<div class="cards">${apps.map((app) => renderCard(app, ctx)).join('')}</div>`,
        '</section>',
      ].join(''),
    )
    .join('');

  const body = [
    renderHeader(ctx, build.version),
    '<main class="page">',
    renderProfile(ctx),
    sections,
    renderNews(data.news, ctx),
    '</main>',
    renderFooter(ctx, build.year),
  ].join('');

  return {
    head: renderHead(data, { siteUrl: build.siteUrl, gscVerification: build.gscVerification }),
    body,
  };
}
