// T-01: the data check passes on the real data and stops on broken data (設計書 9.2).
import { describe, expect, it } from 'vitest';
import appsJson from '../src/data/apps.json' with { type: 'json' };
import newsJson from '../src/data/news.json' with { type: 'json' };
import siteJson from '../src/data/site.json' with { type: 'json' };
import jaJson from '../src/data/i18n/ja.json' with { type: 'json' };
import { MAX_IMAGE_BYTES, validateData, type RawData } from '../scripts/validate-data.ts';

type AnyObj = Record<string, any>;

function fresh(): { apps: AnyObj; news: AnyObj; site: AnyObj; messages: AnyObj } {
  return structuredClone({ apps: appsJson, news: newsJson, site: siteJson, messages: jaJson }) as any;
}

const files: Record<string, number> = {
  'images/ok.webp': 10_000,
  'images/big.webp': MAX_IMAGE_BYTES + 1,
};
const options = { fileSize: (p: string) => files[p] ?? null };

function run(mutate: (d: ReturnType<typeof fresh>) => void): string[] {
  const d = fresh();
  mutate(d);
  return validateData(d as RawData, options);
}

const app = (d: ReturnType<typeof fresh>, id: string): AnyObj => d.apps.apps.find((a: AnyObj) => a.id === id);

describe('validateData', () => {
  it('passes on the real data', () => {
    expect(run(() => {})).toEqual([]);
  });

  it.each<[string, (d: ReturnType<typeof fresh>) => void, string]>([
    ['duplicate id', (d) => (app(d, 'city-chase').id = 'tameru'), 'tameru の id'],
    ['bad id characters', (d) => (app(d, 'city-chase').id = 'City_Chase'), 'の id'],
    ['two featured apps', (d) => (app(d, 'city-chase').featured = true), '今は2つ'],
    ['no featured app', (d) => (app(d, 'tameru').featured = false), '今は0つ'],
    ['public without url', (d) => (app(d, 'city-chase').url = null), 'city-chase の url'],
    ['public with http url', (d) => (app(d, 'city-chase').url = 'http://example.com'), 'city-chase の url'],
    ['coming with url', (d) => (app(d, 'life-wealth').url = 'https://example.com'), 'life-wealth の url'],
    ['unknown status', (d) => (app(d, 'city-chase').status = 'beta'), 'city-chase の status'],
    ['unknown category', (d) => (app(d, 'city-chase').category = 'tools'), 'city-chase の category'],
    ['duplicate order in category', (d) => (app(d, 'city-chase').order = 1), 'city-chase の order'],
    ['missing image file', (d) => (app(d, 'tameru').image = 'images/tameru.webp'), 'public/images/tameru.webp がありません'],
    ['image too large', (d) => (app(d, 'tameru').image = 'images/big.webp'), '画像が大きすぎます'],
    ['missing avatar file', (d) => (d.site.author.avatar = 'images/avatar.webp'), 'author.avatar'],
    ['tagline too long', (d) => (app(d, 'tameru').tagline.ja = 'あ'.repeat(31)), '30字以内'],
    ['description too long', (d) => (app(d, 'tameru').description.ja = 'あ'.repeat(91)), '90字以内'],
    ['shortName too long', (d) => (app(d, 'tameru').shortName.ja = 'あ'.repeat(13)), '12字以内'],
    ['too many tags', (d) => (app(d, 'tameru').tags.ja = ['a', 'b', 'c', 'd']), '3つまで'],
    ['tag too long', (d) => (app(d, 'tameru').tags.ja = ['あ'.repeat(9)]), '8字以内'],
    ['notice too long', (d) => (app(d, 'city-chase').notice = { ja: 'あ'.repeat(51) }), '50字以内'],
    ['missing ja text', (d) => (app(d, 'tameru').name = { en: 'TAMERU' }), '"ja" の文章がありません'],
    ['note url not on note.com', (d) => (app(d, 'tameru').notes = [{ title: { ja: 'x' }, url: 'https://example.com/' }]), 'note.com'],
    ['bad news date', (d) => (d.news.items[0].date = '2026-02-30'), 'items[0].date'],
    ['unknown news appId', (d) => (d.news.items[0].appId = 'nope'), 'items[0].appId'],
    ['news text too long', (d) => (d.news.items[0].text.ja = 'あ'.repeat(41)), '40字以内'],
    ['missing message', (d) => delete d.messages.card.open, 'card.open'],
    ['missing category heading', (d) => delete d.messages.categories.game, 'categories.game'],
    ['wrong data version', (d) => (d.apps.version = 2), 'apps.json version'],
  ])('stops on %s', (_name, mutate, expected) => {
    const errors = run(mutate);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join('\n')).toContain(expected);
  });

  it('accepts an image that exists and is small enough', () => {
    expect(run((d) => (app(d, 'tameru').image = 'images/ok.webp'))).toEqual([]);
  });

  it('counts characters, not UTF-16 units (emoji)', () => {
    expect(run((d) => (app(d, 'tameru').tagline.ja = '🔥'.repeat(30)))).toEqual([]);
  });
});
