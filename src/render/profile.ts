// Self-introduction (設計書 3.2) and the X / note links shared with the footer.
import type { RenderContext } from './context.ts';
import { escapeHtml, NEW_TAB, publicPath } from './html.ts';

/** "Follow on X" / "Read note". No UTM: these are not our sites (設計書 3.2). */
export function renderSocialLinks({ site, messages }: RenderContext): string {
  return [
    '<div class="social">',
    `<a class="btn btn--sub" href="${escapeHtml(site.author.xUrl)}"${NEW_TAB}>${escapeHtml(messages.profile.follow)}</a>`,
    `<a class="btn btn--sub" href="${escapeHtml(site.author.noteUrl)}"${NEW_TAB}>${escapeHtml(messages.profile.note)}</a>`,
    '</div>',
  ].join('');
}

export function renderProfile(ctx: RenderContext): string {
  const { author } = ctx.site;
  // Until the owner provides the X icon (U15), show the first letter of the display name.
  const avatar = author.avatar
    ? `<img class="avatar" src="${escapeHtml(publicPath(author.avatar))}" width="56" height="56" alt="">`
    : `<span class="avatar avatar--fallback" aria-hidden="true">${escapeHtml([...author.displayName][0] ?? '')}</span>`;

  return [
    '<section class="profile">',
    `<div class="profile-head">${avatar}<p class="profile-name">${escapeHtml(author.displayName)}</p></div>`,
    `<p class="profile-intro">${escapeHtml(ctx.messages.profile.intro)}</p>`,
    renderSocialLinks(ctx),
    '</section>',
  ].join('');
}
