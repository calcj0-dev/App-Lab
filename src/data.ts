// Typed access to src/data/*.json (設計書 4章).
// The shape is enforced at build time by scripts/validate-data.ts, so the casts here are safe.
import appsJson from './data/apps.json' with { type: 'json' };
import newsJson from './data/news.json' with { type: 'json' };
import siteJson from './data/site.json' with { type: 'json' };
import jaJson from './data/i18n/ja.json' with { type: 'json' };

export type Lang = 'ja';
export const DEFAULT_LANG: Lang = 'ja';

/** Text kept per language: { "ja": "..." }. */
export type Localized<T = string> = { ja: T } & Partial<Record<string, T>>;

export interface Note {
  title: Localized;
  url: string;
}

export type AppStatus = 'public' | 'coming';

export interface App {
  id: string;
  category: string;
  featured: boolean;
  status: AppStatus;
  order: number;
  url: string | null;
  image: string | null;
  name: Localized;
  shortName?: Localized;
  tagline: Localized;
  description: Localized;
  tags: Localized<string[]>;
  notice: Localized | null;
  notes: Note[];
  imageAlt: Localized;
}

export interface NewsItem {
  date: string;
  appId: string | null;
  text: Localized;
}

export interface News {
  show: number;
  items: NewsItem[];
}

export interface Category {
  id: string;
  order: number;
}

export interface Site {
  author: {
    displayName: string;
    xHandle: string;
    xUrl: string;
    noteUrl: string;
    avatar: string | null;
  };
  categories: Category[];
  utm: { source: string; medium: string; campaign: string };
  ogImage: string;
  themeColor: string;
}

export type Messages = typeof jaJson;

export interface PortalData {
  apps: App[];
  news: News;
  site: Site;
  messages: Messages;
}

export function loadData(): PortalData {
  return {
    apps: (appsJson as unknown as { apps: App[] }).apps,
    news: newsJson as unknown as News,
    site: siteJson as unknown as Site,
    messages: jaJson,
  };
}
