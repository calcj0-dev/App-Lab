// T-02〜T-06, T-09 (設計書 9.2) and the header.
import { describe, expect, it } from 'vitest';
import { loadData, type App, type PortalData } from '../src/data.ts';
import { renderCard } from '../src/render/card.ts';
import type { RenderContext } from '../src/render/context.ts';
import { escapeHtml } from '../src/render/html.ts';
import { t } from '../src/render/i18n.ts';
import { groupApps, latestNews } from '../src/render/order.ts';
import { renderPage } from '../src/render/page.ts';
import { renderProfile } from '../src/render/profile.ts';
import { withUtm } from '../src/render/utm.ts';

const build = { version: '0.3.0', year: 2026, siteUrl: 'https://app-lab-rust.vercel.app/' };

function data(): PortalData {
  return structuredClone(loadData());
}

function ctx(d: PortalData): RenderContext {
  return { lang: 'ja', site: d.site, messages: d.messages };
}

const find = (d: PortalData, id: string): App => {
  const app = d.apps.find((a) => a.id === id);
  if (!app) throw new Error(`no app ${id}`);
  return app;
};

describe('header', () => {
  it('shows the site name and version', () => {
    const { body } = renderPage(data(), build);
    expect(body).toContain('<h1 class="site-name">Ted App Lab</h1>');
    expect(body).toContain('<span class="site-version">v0.3.0</span>');
  });
});

describe('T-02 withUtm', () => {
  const utm = { source: 'portal', medium: 'referral', campaign: 'ted_app_lab' };
  const q = 'utm_source=portal&utm_medium=referral&utm_campaign=ted_app_lab';

  it('adds UTM to a URL with no query', () => {
    expect(withUtm('https://tameru-lovat.vercel.app', utm, 'featured')).toBe(
      `https://tameru-lovat.vercel.app/?${q}&utm_content=featured`,
    );
  });

  it('keeps an existing query', () => {
    expect(withUtm('https://example.com/play?lang=en', utm, 'card')).toBe(
      `https://example.com/play?lang=en&${q}&utm_content=card`,
    );
  });

  it('keeps the hash after the query', () => {
    expect(withUtm('https://example.com/#top', utm, 'card')).toBe(`https://example.com/?${q}&utm_content=card#top`);
  });

  it('is applied to app links in the page, with featured/card', () => {
    const { body } = renderPage(data(), build);
    expect(body).toContain(escapeHtml(`https://tameru-lovat.vercel.app/?${q}&utm_content=featured`));
    expect(body).toContain(escapeHtml(`https://building-chase.vercel.app/?${q}&utm_content=card`));
  });

  it('is not applied to X and note links', () => {
    const { body } = renderPage(data(), build);
    expect(body).not.toMatch(/x\.com\/shooojp19\?/);
    expect(body).not.toMatch(/note\.com\/teddd19\?/);
  });
});

describe('T-03 ordering', () => {
  it('groups by category, then public before coming, then by order', () => {
    const d = data();
    const groups = groupApps(d.apps, d.site.categories);
    expect(groups.map((g) => g.category.id)).toEqual(['tool', 'game']);
    expect(groups[1].apps.map((a) => a.id)).toEqual([
      'trader-vs-autopilot',
      'city-chase',
      'nagatacho-politics',
      'takarakuji-gacha',
      'life-wealth',
      'portfolio-pals',
      'tiny-gold-bar',
    ]);
  });

  it('moves a coming app up when it becomes public', () => {
    const d = data();
    Object.assign(find(d, 'takarakuji-gacha'), { status: 'public', url: 'https://example.com' });
    const games = groupApps(d.apps, d.site.categories)[1].apps.map((a) => a.id);
    expect(games.slice(0, 2)).toEqual(['trader-vs-autopilot', 'takarakuji-gacha']);
  });

  it('renders sections in that order', () => {
    const { body } = renderPage(data(), build);
    const positions = ['id="category-tool"', 'id="category-game"', 'id="news-heading"'].map((s) => body.indexOf(s));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});

describe('T-04 coming cards', () => {
  it('has no open button, and links to X instead', () => {
    const d = data();
    const html = renderCard(find(d, 'life-wealth'), ctx(d));
    expect(html).not.toContain(d.messages.card.open + '<');
    expect(html).toContain('準備中');
    expect(html).toContain(`<a class="btn btn--coming" href="https://x.com/shooojp19">公開したら X でお知らせします</a>`);
  });

  it('a coming card with an image shows it without a link, with the 準備中 badge', () => {
    const d = data();
    const html = renderCard(find(d, 'life-wealth'), ctx(d));
    expect(html).toContain('<div class="card-media"><img class="card-image" src="/images/life-wealth.webp"');
    expect(html).not.toContain('<a class="card-media"');
    expect(html).toContain('badge--coming');
  });

  it('public cards have the open button', () => {
    const d = data();
    const html = renderCard(find(d, 'city-chase'), ctx(d));
    expect(html).toContain('>開く</a>');
    expect(html).not.toContain('btn--coming');
  });

  it('the featured card uses shortName in its button', () => {
    const d = data();
    expect(renderCard(find(d, 'tameru'), ctx(d))).toContain('>TAMERU を使ってみる</a>');
  });

  it('falls back to name when shortName is missing', () => {
    const d = data();
    const app = find(d, 'tameru');
    delete app.shortName;
    expect(renderCard(app, ctx(d))).toContain('>TAMERU（タメル） を使ってみる</a>');
  });
});

describe('T-05 optional parts', () => {
  it('omits notice and note link when empty', () => {
    const d = data();
    const html = renderCard(find(d, 'city-chase'), ctx(d));
    expect(html).not.toContain('card-notice');
    expect(html).not.toContain('card-note');
  });

  it('shows notice and the first note when present', () => {
    const d = data();
    const app = find(d, 'trader-vs-autopilot');
    app.notes = [
      { title: { ja: '一本目' }, url: 'https://note.com/teddd19/n/a' },
      { title: { ja: '二本目' }, url: 'https://note.com/teddd19/n/b' },
    ];
    const html = renderCard(app, ctx(d));
    expect(html).toContain('<p class="card-notice">ゲームであり、投資助言ではありません。相場は架空です。</p>');
    expect(html).toContain('href="https://note.com/teddd19/n/a"');
    expect(html).not.toContain('https://note.com/teddd19/n/b');
  });

  it('uses a CSS placeholder when there is no image, and <img> when there is', () => {
    const d = data();
    const coming = find(d, 'life-wealth');
    coming.image = null;
    expect(renderCard(coming, ctx(d))).toContain('class="card-image placeholder"');
    const html = renderCard(find(d, 'city-chase'), ctx(d));
    expect(html).toContain('<img class="card-image" src="/images/city-chase.webp" width="800" height="420"');
    expect(html).toContain('loading="lazy"');
  });

  it('does not lazy-load the featured image', () => {
    const d = data();
    const app = find(d, 'tameru');
    app.image = 'images/tameru.webp';
    expect(renderCard(app, ctx(d))).not.toContain('loading="lazy"');
  });
});

describe('T-06 news', () => {
  it('shows the newest `show` items, newest first', () => {
    const items = [
      { date: '2026-10-08', appId: null, text: { ja: 'a' } },
      { date: '2026-11-11', appId: null, text: { ja: 'd' } },
      { date: '2026-10-26', appId: null, text: { ja: 'c' } },
      { date: '2026-10-18', appId: null, text: { ja: 'b' } },
    ];
    expect(latestNews(items, 3).map((i) => i.text.ja)).toEqual(['d', 'c', 'b']);
  });

  it('formats the date', () => {
    const { body } = renderPage(data(), build);
    expect(body).toContain('<time datetime="2026-10-26">2026/10/26</time>');
  });
});

describe('footer', () => {
  it('fills year and X handle into the copyright', () => {
    const { body } = renderPage(data(), build);
    expect(body).toContain('© 2026 Ted（@shooojp19）');
    expect(body).toContain('このサイトで紹介しているツール・ゲームは、投資助言ではありません。');
  });

  it('has no GitHub link', () => {
    expect(renderPage(data(), build).body).not.toContain('github.com');
  });
});

describe('T-09 referrer', () => {
  it('no link drops the referrer or opens a new tab', () => {
    const { head, body } = renderPage(data(), build);
    expect(head + body).not.toContain('noreferrer');
    expect(head + body).not.toContain('no-referrer');
    expect(body).not.toContain('target=');
  });
});

describe('escaping and placeholders', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  it('escapes data text in the page', () => {
    const d = data();
    find(d, 'city-chase').tagline.ja = '<script>';
    expect(renderPage(d, build).body).toContain('&lt;script&gt;');
  });

  it('t() leaves unknown placeholders', () => {
    expect(t('{a}-{b}', { a: 1 })).toBe('1-{b}');
  });
});

describe('profile avatar', () => {
  it('shows the X icon when site.json has one', () => {
    const d = data();
    d.site.author.avatar = 'images/avatar.webp';
    expect(renderProfile(ctx(d))).toContain('<img class="avatar" src="/images/avatar.webp" width="56" height="56" alt="">');
  });

  it('falls back to the first letter of the display name', () => {
    const d = data();
    d.site.author.avatar = null;
    expect(renderProfile(ctx(d))).toContain('<span class="avatar avatar--fallback" aria-hidden="true">T</span>');
  });
});
