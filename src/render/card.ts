// App cards: featured (large), normal, and coming soon (設計書 3.3).
import type { App } from '../data.ts';
import type { RenderContext } from './context.ts';
import { escapeHtml, NEW_TAB, publicPath } from './html.ts';
import { loc, t } from './i18n.ts';
import { withUtm } from './utm.ts';

const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 420;

function renderMedia(app: App, ctx: RenderContext, href: string | null): string {
  const name = escapeHtml(loc(app.name, ctx.lang));
  const alt = escapeHtml(loc(app.imageAlt, ctx.lang));

  let media: string;
  if (app.image) {
    const lazy = app.featured ? '' : ' loading="lazy"';
    media = `<img class="card-image" src="${escapeHtml(publicPath(app.image))}" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" alt="${alt}"${lazy} decoding="async">`;
  } else {
    // Placeholder drawn with CSS instead of an image file (設計書 6.2).
    const coming =
      app.status === 'coming'
        ? `<span class="placeholder-coming">${escapeHtml(ctx.messages.card.coming)}</span>`
        : '';
    media = `<div class="card-image placeholder" role="img" aria-label="${alt}"><span class="placeholder-name">${name}</span>${coming}</div>`;
  }

  // The image links to the same place as the main button; keep it out of the tab order
  // and the accessibility tree so the app is announced once.
  return href
    ? `<a class="card-media" href="${escapeHtml(href)}"${NEW_TAB} tabindex="-1" aria-hidden="true">${media}</a>`
    : `<div class="card-media">${media}</div>`;
}

export function renderCard(app: App, ctx: RenderContext): string {
  const { messages, site, lang } = ctx;
  const isPublic = app.status === 'public' && app.url !== null;
  const href = isPublic ? withUtm(app.url as string, site.utm, app.featured ? 'featured' : 'card') : null;

  const classes = ['card'];
  if (app.featured) classes.push('card--featured');
  if (!isPublic) classes.push('card--coming');

  const badge = isPublic
    ? `<span class="badge badge--public">${escapeHtml(messages.card.public)}</span>`
    : `<span class="badge badge--coming">${escapeHtml(messages.card.coming)}</span>`;

  const tags = loc(app.tags, lang);
  const tagList =
    tags.length > 0
      ? `<ul class="tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
      : '';

  const notice = app.notice ? `<p class="card-notice">${escapeHtml(loc(app.notice, lang))}</p>` : '';

  let action: string;
  if (href) {
    const label = app.featured
      ? t(messages.card.openFeatured, { name: loc(app.shortName ?? app.name, lang) })
      : messages.card.open;
    const variant = app.featured ? 'btn--featured' : 'btn--primary';
    action = `<a class="btn ${variant}" href="${escapeHtml(href)}"${NEW_TAB}>${escapeHtml(label)}</a>`;
  } else {
    action = `<a class="btn btn--coming" href="${escapeHtml(site.author.xUrl)}"${NEW_TAB}>${escapeHtml(messages.card.comingAction)}</a>`;
  }

  const note = app.notes[0];
  const noteLink = note
    ? `<a class="card-note" href="${escapeHtml(note.url)}"${NEW_TAB} title="${escapeHtml(loc(note.title, lang))}">${escapeHtml(messages.card.noteLink)}</a>`
    : '';

  return [
    `<article class="${classes.join(' ')}" id="app-${escapeHtml(app.id)}">`,
    renderMedia(app, ctx, href),
    '<div class="card-body">',
    `<div class="card-title"><h3 class="card-name">${escapeHtml(loc(app.name, lang))}</h3>${badge}</div>`,
    `<p class="card-tagline">${escapeHtml(loc(app.tagline, lang))}</p>`,
    `<p class="card-description">${escapeHtml(loc(app.description, lang))}</p>`,
    tagList,
    notice,
    `<div class="card-actions">${action}${noteLink}</div>`,
    '</div>',
    '</article>',
  ].join('');
}
