import type { App, Category, NewsItem } from '../data.ts';

export interface CategoryGroup {
  category: Category;
  apps: App[];
}

/**
 * Groups apps by category (site.json order), then within a category:
 * public before coming, each by `order` (設計書 5.1).
 * Categories with no apps are left out.
 */
export function groupApps(apps: App[], categories: Category[]): CategoryGroup[] {
  const statusRank = (a: App) => (a.status === 'public' ? 0 : 1);
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      category,
      apps: apps
        .filter((a) => a.category === category.id)
        .sort((a, b) => statusRank(a) - statusRank(b) || a.order - b.order),
    }))
    .filter((g) => g.apps.length > 0);
}

/** Newest first, at most `show` items (設計書 3.4). */
export function latestNews(items: NewsItem[], show: number): NewsItem[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, show);
}
