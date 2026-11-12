import type { Site } from '../data.ts';

/** Where on the page the link was clicked (utm_content, 設計書 7.1). */
export type UtmContent = 'featured' | 'card';

/** Adds the portal UTM parameters to an app URL, keeping any existing query or hash. */
export function withUtm(url: string, utm: Site['utm'], content: UtmContent): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', utm.source);
  u.searchParams.set('utm_medium', utm.medium);
  u.searchParams.set('utm_campaign', utm.campaign);
  u.searchParams.set('utm_content', content);
  return u.toString();
}
