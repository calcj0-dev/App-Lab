// サイトの OGP 画像を作る（設計書 6.1）。npm run og
// scripts/og/og.html を、パソコンに入っている Chrome で 1200×630 の public/og.png にする。
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'public', 'og.png');

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(here, 'og.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: 'png' });
  console.log(`public/og.png を作りました（1200×630）`);
} finally {
  await browser.close();
}
