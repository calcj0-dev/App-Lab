// データの検査（設計書 9.1）。ビルドの前に動き、間違いがあればビルドを止める。
// Run directly with Node (type stripping): node scripts/validate-data.ts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** データの形の版（設計書 4章）。項目の名前や型を変えたときだけ上げる。 */
export const DATA_VERSION = 1;

export const LIMITS = {
  tagline: 30,
  description: 90,
  shortName: 12,
  tagCount: 3,
  tag: 8,
  notice: 50,
  newsText: 40,
} as const;

export const MAX_IMAGE_BYTES = 80 * 1024;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** i18n の文言で必ず要るもの（categories.<id> は site.json から足す）。 */
export const REQUIRED_MESSAGES = [
  'site.name',
  'site.title',
  'site.description',
  'site.ogTitle',
  'site.ogDescription',
  'site.version',
  'profile.intro',
  'profile.follow',
  'profile.note',
  'card.public',
  'card.coming',
  'card.open',
  'card.openFeatured',
  'card.noteLink',
  'card.comingAction',
  'news.heading',
  'news.date',
  'footer.disclaimer',
  'footer.copyright',
] as const;

export interface RawData {
  apps: unknown;
  news: unknown;
  site: unknown;
  messages: unknown;
}

export interface ValidateOptions {
  /** public/ からの場所を受け取り、ファイルの大きさ（バイト）を返す。ないときは null。 */
  fileSize: (publicPath: string) => number | null;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const charCount = (s: string): number => [...s].length;
const isHttpsUrl = (v: unknown): v is string => {
  if (typeof v !== 'string' || !v.startsWith('https://')) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

export function validateData(raw: RawData, options: ValidateOptions): string[] {
  const errors: string[] = [];
  const err = (file: string, where: string, message: string) =>
    errors.push(`${file} ${where}: ${message}`);

  const checkVersion = (file: string, data: Obj) => {
    if (data.version !== DATA_VERSION) {
      err(file, 'version', `データの形の版は ${DATA_VERSION} にしてください（今は ${JSON.stringify(data.version)}）`);
    }
  };

  const checkImage = (file: string, where: string, value: unknown) => {
    if (value === null) return;
    if (typeof value !== 'string' || value === '' || value.startsWith('/')) {
      err(file, where, 'null か、public/ からの場所（例 "images/tameru.webp"、先頭に / を付けない）にしてください');
      return;
    }
    const size = options.fileSize(value);
    if (size === null) {
      err(file, where, `public/${value} がありません。画像を置いてから書くか、null にしてください`);
    } else if (size > MAX_IMAGE_BYTES) {
      err(file, where, `画像が大きすぎます（${Math.ceil(size / 1024)}KB）。${MAX_IMAGE_BYTES / 1024}KB 以下にしてください`);
    }
  };

  /** 言語ごとの文字列（{ "ja": "…" }）。 */
  const checkText = (file: string, where: string, value: unknown, max?: number) => {
    if (!isObj(value)) {
      err(file, where, '{ "ja": "…" } の形で書いてください');
      return;
    }
    if (typeof value.ja !== 'string' || value.ja.trim() === '') {
      err(file, where, '"ja" の文章がありません');
    }
    for (const [lang, text] of Object.entries(value)) {
      if (typeof text !== 'string') {
        err(file, `${where}.${lang}`, '文字列にしてください');
      } else if (max !== undefined && charCount(text) > max) {
        err(file, `${where}.${lang}`, `${max}字以内にしてください（今は${charCount(text)}字）`);
      }
    }
  };

  // ---- site.json ----
  const categoryIds = new Set<string>();
  const site = raw.site;
  if (!isObj(site)) {
    err('site.json', '', '読み込めません');
  } else {
    checkVersion('site.json', site);
    const author = site.author;
    if (!isObj(author)) {
      err('site.json', 'author', '必須の項目がありません');
    } else {
      if (typeof author.displayName !== 'string' || author.displayName === '') {
        err('site.json', 'author.displayName', '表示名を書いてください');
      }
      if (typeof author.xHandle !== 'string' || !author.xHandle.startsWith('@')) {
        err('site.json', 'author.xHandle', '「@」で始まる X のアカウント名にしてください');
      }
      if (!isHttpsUrl(author.xUrl)) err('site.json', 'author.xUrl', 'https:// で始まる URL にしてください');
      if (!isHttpsUrl(author.noteUrl)) err('site.json', 'author.noteUrl', 'https:// で始まる URL にしてください');
      checkImage('site.json', 'author.avatar', author.avatar);
    }
    if (!Array.isArray(site.categories) || site.categories.length === 0) {
      err('site.json', 'categories', '分類を1つ以上書いてください');
    } else {
      const orders = new Set<number>();
      site.categories.forEach((c, i) => {
        if (!isObj(c) || typeof c.id !== 'string' || !ID_PATTERN.test(c.id) || !isInt(c.order)) {
          err('site.json', `categories[${i}]`, '{ "id": "英小文字", "order": 数 } の形にしてください');
          return;
        }
        if (categoryIds.has(c.id)) err('site.json', `categories[${i}]`, `id「${c.id}」が重なっています`);
        if (orders.has(c.order)) err('site.json', `categories[${i}]`, `order ${c.order} が重なっています`);
        categoryIds.add(c.id);
        orders.add(c.order);
      });
    }
    const utm = site.utm;
    if (!isObj(utm) || !['source', 'medium', 'campaign'].every((k) => typeof utm[k] === 'string' && utm[k] !== '')) {
      err('site.json', 'utm', 'source・medium・campaign を書いてください');
    }
    if (typeof site.ogImage !== 'string' || site.ogImage === '') err('site.json', 'ogImage', 'OGP 画像の場所を書いてください');
    if (typeof site.themeColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(site.themeColor)) {
      err('site.json', 'themeColor', '#0d9488 の形の色にしてください');
    }
  }

  // ---- apps.json ----
  const appIds = new Set<string>();
  const apps = raw.apps;
  if (!isObj(apps)) {
    err('apps.json', '', '読み込めません');
  } else {
    checkVersion('apps.json', apps);
    if (!Array.isArray(apps.apps) || apps.apps.length === 0) {
      err('apps.json', 'apps', 'アプリを1つ以上書いてください');
    } else {
      let featuredCount = 0;
      const orderByCategory = new Map<string, Set<number>>();
      apps.apps.forEach((app, i) => {
        if (!isObj(app)) {
          err('apps.json', `apps[${i}]`, '{ … } の形で書いてください');
          return;
        }
        const label = typeof app.id === 'string' && app.id !== '' ? app.id : `apps[${i}]`;
        const f = (field: string) => `${label} の ${field}`;

        if (typeof app.id !== 'string' || !ID_PATTERN.test(app.id)) {
          err('apps.json', f('id'), '英小文字・数字・ハイフンだけにしてください（例 "city-chase"）');
        } else if (appIds.has(app.id)) {
          err('apps.json', f('id'), `「${app.id}」がほかのアプリと重なっています`);
        } else {
          appIds.add(app.id);
        }

        if (typeof app.category !== 'string' || !categoryIds.has(app.category)) {
          err('apps.json', f('category'), `site.json の categories のどれか（${[...categoryIds].join('／')}）にしてください`);
        }

        if (typeof app.featured !== 'boolean') {
          err('apps.json', f('featured'), 'true か false にしてください');
        } else if (app.featured) {
          featuredCount++;
        }

        if (app.status !== 'public' && app.status !== 'coming') {
          err('apps.json', f('status'), '"public"（公開中）か "coming"（準備中）にしてください');
        } else if (app.status === 'public' && !isHttpsUrl(app.url)) {
          err('apps.json', f('url'), '公開中のアプリには https:// で始まる URL を書いてください');
        } else if (app.status === 'coming' && app.url !== null) {
          err('apps.json', f('url'), '準備中のアプリは null にしてください');
        }

        if (!isInt(app.order) || app.order < 1) {
          err('apps.json', f('order'), '1 以上の整数にしてください');
        } else if (typeof app.category === 'string') {
          const used = orderByCategory.get(app.category) ?? new Set<number>();
          if (used.has(app.order)) {
            err('apps.json', f('order'), `同じ分類の中で order ${app.order} が重なっています`);
          }
          used.add(app.order);
          orderByCategory.set(app.category, used);
        }

        checkImage('apps.json', f('image'), app.image);
        checkText('apps.json', f('name'), app.name);
        if (app.shortName !== undefined) checkText('apps.json', f('shortName'), app.shortName, LIMITS.shortName);
        checkText('apps.json', f('tagline'), app.tagline, LIMITS.tagline);
        checkText('apps.json', f('description'), app.description, LIMITS.description);
        checkText('apps.json', f('imageAlt'), app.imageAlt);
        if (app.notice !== null) checkText('apps.json', f('notice'), app.notice, LIMITS.notice);

        const tags = app.tags;
        if (!isObj(tags) || !Array.isArray(tags.ja)) {
          err('apps.json', f('tags'), '{ "ja": ["…", "…"] } の形で書いてください');
        } else {
          for (const [lang, list] of Object.entries(tags)) {
            if (!Array.isArray(list)) {
              err('apps.json', f(`tags.${lang}`), '一覧（[ ]）にしてください');
              continue;
            }
            if (list.length > LIMITS.tagCount) {
              err('apps.json', f(`tags.${lang}`), `タグは${LIMITS.tagCount}つまでにしてください（今は${list.length}つ）`);
            }
            for (const tag of list) {
              if (typeof tag !== 'string' || tag === '') {
                err('apps.json', f(`tags.${lang}`), '空のタグがあります');
              } else if (charCount(tag) > LIMITS.tag) {
                err('apps.json', f(`tags.${lang}`), `「${tag}」を${LIMITS.tag}字以内にしてください（今は${charCount(tag)}字）`);
              }
            }
          }
        }

        if (!Array.isArray(app.notes)) {
          err('apps.json', f('notes'), '一覧（[ ]）にしてください。記事がなければ []');
        } else {
          app.notes.forEach((note, n) => {
            if (!isObj(note)) {
              err('apps.json', f(`notes[${n}]`), '{ "title": { "ja": "…" }, "url": "…" } の形にしてください');
              return;
            }
            checkText('apps.json', f(`notes[${n}].title`), note.title);
            if (typeof note.url !== 'string' || !note.url.startsWith('https://note.com/')) {
              err('apps.json', f(`notes[${n}].url`), 'https://note.com/ で始まる URL にしてください');
            }
          });
        }
      });
      if (featuredCount !== 1) {
        err('apps.json', 'featured', `大きいカード（"featured": true）はちょうど1つにしてください（今は${featuredCount}つ）`);
      }
    }
  }

  // ---- news.json ----
  const news = raw.news;
  if (!isObj(news)) {
    err('news.json', '', '読み込めません');
  } else {
    checkVersion('news.json', news);
    if (!isInt(news.show) || news.show < 1) err('news.json', 'show', '1 以上の整数にしてください');
    if (!Array.isArray(news.items)) {
      err('news.json', 'items', '一覧（[ ]）にしてください');
    } else {
      news.items.forEach((item, i) => {
        const where = `items[${i}]`;
        if (!isObj(item)) {
          err('news.json', where, '{ "date": …, "appId": …, "text": … } の形にしてください');
          return;
        }
        const m = typeof item.date === 'string' ? DATE_PATTERN.exec(item.date) : null;
        const validDate =
          m !== null &&
          (() => {
            const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
            return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
          })();
        if (!validDate) err('news.json', `${where}.date`, '"2026-10-26" の形の、ある日付にしてください');
        if (item.appId !== null && (typeof item.appId !== 'string' || !appIds.has(item.appId))) {
          err('news.json', `${where}.appId`, `apps.json にある id か null にしてください（今は ${JSON.stringify(item.appId)}）`);
        }
        checkText('news.json', `${where}.text`, item.text, LIMITS.newsText);
      });
    }
  }

  // ---- i18n/ja.json ----
  const messages = raw.messages;
  if (!isObj(messages)) {
    err('i18n/ja.json', '', '読み込めません');
  } else {
    const keys = [...REQUIRED_MESSAGES, ...[...categoryIds].map((id) => `categories.${id}`)];
    for (const key of keys) {
      const value = key.split('.').reduce<unknown>((o, k) => (isObj(o) ? o[k] : undefined), messages);
      if (typeof value !== 'string' || value === '') err('i18n/ja.json', key, '文言がありません');
    }
  }

  return errors;
}

// ---- コマンドとして動かしたとき ----
function main(): void {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const dataDir = join(root, 'src', 'data');
  const files = { apps: 'apps.json', news: 'news.json', site: 'site.json', messages: 'i18n/ja.json' } as const;

  const raw: Partial<RawData> = {};
  const parseErrors: string[] = [];
  for (const [key, file] of Object.entries(files) as [keyof RawData, string][]) {
    try {
      raw[key] = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
    } catch (e) {
      parseErrors.push(`${file}: JSON として読めません（${(e as Error).message}）`);
      raw[key] = undefined;
    }
  }

  const errors = [
    ...parseErrors,
    ...validateData(raw as RawData, {
      fileSize: (p) => {
        const path = join(root, 'public', p);
        return existsSync(path) ? statSync(path).size : null;
      },
    }),
  ];

  if (errors.length > 0) {
    console.error(`データの検査：間違いが ${errors.length} 件あります（src/data/）`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const count = isObj(raw.apps) && Array.isArray(raw.apps.apps) ? raw.apps.apps.length : 0;
  console.log(`データの検査：問題なし（アプリ ${count} 件）`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
