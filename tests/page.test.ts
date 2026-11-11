import { describe, expect, it } from 'vitest';
import { escapeHtml, renderPage } from '../src/render/page';

describe('renderPage', () => {
  it('shows the site name and version in the header', () => {
    const { body } = renderPage({ siteName: 'Ted App Lab', version: '0.1.0' });
    expect(body).toContain('<h1 class="site-name">Ted App Lab</h1>');
    expect(body).toContain('<span class="site-version">v0.1.0</span>');
  });

  it('puts the site name in the title', () => {
    const { head } = renderPage({ siteName: 'Ted App Lab', version: '0.1.0' });
    expect(head).toBe('<title>Ted App Lab</title>');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});
