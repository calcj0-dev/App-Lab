// Footer: links again, disclaimer, copyright (設計書 3.5). No GitHub link (U4).
import type { RenderContext } from './context.ts';
import { escapeHtml } from './html.ts';
import { t } from './i18n.ts';
import { renderSocialLinks } from './profile.ts';

export function renderFooter(ctx: RenderContext, year: number): string {
  const copyright = t(ctx.messages.footer.copyright, { year, xHandle: ctx.site.author.xHandle });
  return [
    '<footer class="site-footer">',
    renderSocialLinks(ctx),
    `<p class="disclaimer">${escapeHtml(ctx.messages.footer.disclaimer)}</p>`,
    `<p class="copyright"><small>${escapeHtml(copyright)}</small></p>`,
    '</footer>',
  ].join('');
}
