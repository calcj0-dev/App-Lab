import type { Lang, Messages, Site } from '../data.ts';

/** What every render function needs besides its own data. */
export interface RenderContext {
  lang: Lang;
  site: Site;
  messages: Messages;
}
