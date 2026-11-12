// News list, newest first (設計書 3.4). Items are plain text, not links.
import type { News } from '../data.ts';
import type { RenderContext } from './context.ts';
import { escapeHtml } from './html.ts';
import { loc, t } from './i18n.ts';
import { latestNews } from './order.ts';

export function renderNews(news: News, ctx: RenderContext): string {
  const items = latestNews(news.items, news.show);
  if (items.length === 0) return '';

  const list = items
    .map((item) => {
      const [y, m, d] = item.date.split('-');
      const label = t(ctx.messages.news.date, { y, m, d });
      return `<li><time datetime="${escapeHtml(item.date)}">${escapeHtml(label)}</time><span>${escapeHtml(loc(item.text, ctx.lang))}</span></li>`;
    })
    .join('');

  return [
    '<section class="section news" aria-labelledby="news-heading">',
    `<h2 class="section-heading" id="news-heading">${escapeHtml(ctx.messages.news.heading)}</h2>`,
    `<ul class="news-list">${list}</ul>`,
    '</section>',
  ].join('');
}
