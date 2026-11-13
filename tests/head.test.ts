// T-07: title, description, canonical, OGP, twitter:card, JSON-LD (設計書 9.2), plus sitemap / robots.
import { describe, expect, it } from 'vitest';
import { loadData, type PortalData } from '../src/data.ts';
import { renderHead, robotsTxt, sitemapXml, structuredData } from '../src/render/head.ts';

const SITE = 'https://app-lab-rust.vercel.app/';
const data = (): PortalData => structuredClone(loadData());

describe('T-07 head', () => {
  const head = renderHead(data(), { siteUrl: SITE });

  it.each([
    '<title>Ted App Lab｜資産管理ツールと無料ブラウザゲーム</title>',
    '<meta name="description" content="FIREを目指す会社員 Ted が作った、',
    `<link rel="canonical" href="${SITE}">`,
    '<meta property="og:title" content="Ted App Lab">',
    '<meta property="og:description" content="FIREを目指す会社員 Ted が作った資産管理ツールと、無料のブラウザゲームのまとめ">',
    `<meta property="og:image" content="${SITE}og.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:url" content="${SITE}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="ja_JP">',
    '<meta property="og:site_name" content="Ted App Lab">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<script type="application/ld+json">',
  ])('contains %s', (tag) => {
    expect(head).toContain(tag);
  });

  it('adds the Search Console tag only when a value is given', () => {
    expect(head).not.toContain('google-site-verification');
    expect(renderHead(data(), { siteUrl: SITE, gscVerification: 'abc' })).toContain(
      '<meta name="google-site-verification" content="abc">',
    );
  });

  it('JSON-LD lists only public apps, with clean URLs and categories', () => {
    const [website, list] = structuredData(data(), SITE) as any[];
    expect(website['@type']).toBe('WebSite');
    expect(website.url).toBe(SITE);
    const items = list.itemListElement.map((e: any) => e.item);
    expect(items.map((i: any) => i.name)).toEqual([
      'TAMERU（タメル）',
      '積立投資を超えろ！',
      'シティチェイス（City Chase）',
      '永田町ポリティクス',
      '金塊、ちっさ！',
    ]);
    expect(items[0].applicationCategory).toBe('FinanceApplication');
    expect(items[1].applicationCategory).toBe('GameApplication');
    expect(items.every((i: any) => !String(i.url).includes('utm_'))).toBe(true);
    expect(JSON.stringify(list)).not.toContain('LIFE & WEALTH');
  });

  it('JSON-LD cannot break out of its script tag', () => {
    const d = data();
    d.apps[0].description.ja = '</script><script>alert(1)</script>';
    const html = renderHead(d, { siteUrl: SITE });
    expect(html).not.toContain('</script><script>alert(1)');
  });
});

describe('sitemap and robots', () => {
  it('sitemap has the top page', () => {
    expect(sitemapXml(SITE, '2026-11-12')).toContain(`<loc>${SITE}</loc><lastmod>2026-11-12</lastmod>`);
  });

  it('robots allows all and points to the sitemap', () => {
    expect(robotsTxt(SITE)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
  });
});
