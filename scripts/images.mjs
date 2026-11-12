// 画像の変換（設計書 6.2）。npm run images
// assets-src/<id>.png（jpg・webp も可）→ public/images/<id>.webp（800×420、80KB 以下）
// assets-src/avatar.png → public/images/avatar.webp（112×112。表示は56pxの丸）
// 変換したあとで、apps.json の image（avatar は site.json の author.avatar）に場所を書く。
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'assets-src');
const outDir = join(root, 'public', 'images');

const MAX_BYTES = 80 * 1024;
const CARD = { width: 800, height: 420 };
const AVATAR = { width: 112, height: 112 };
const INPUT_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/** 切り抜く位置を変えたい画像だけ書く（sharp の position。既定は中央）。 */
const POSITION = {
  // 'example-app': 'top',
};

/**
 * 元の画像の一部だけを使う画像（左上からの位置と大きさ、px）。縮小・切り抜きの前に切り出す。
 * 永田町ポリティクス：ゲーム画面の右側（ロゴ入りのカードの裏面）だけ。政党名と人物を入れないため（要件定義書 U18）。
 */
const EXTRACT = {
  'nagatacho-politics': { left: 400, top: 150, width: 464, height: 244 },
};

async function convert(file) {
  const id = basename(file, extname(file));
  const size = id === 'avatar' ? AVATAR : CARD;
  const out = join(outDir, `${id}.webp`);

  // Lower the quality step by step until the file fits the size limit.
  for (let quality = 82; quality >= 40; quality -= 6) {
    let image = sharp(join(srcDir, file));
    if (EXTRACT[id]) image = image.extract(EXTRACT[id]);
    const info = await image
      .resize({ ...size, fit: 'cover', position: POSITION[id] ?? 'centre' })
      .webp({ quality, effort: 6 })
      .toFile(out);
    if (info.size <= MAX_BYTES) {
      const where = id === 'avatar' ? 'site.json author.avatar' : `apps.json ${id} の image`;
      console.log(`${file} → public/images/${id}.webp（${Math.ceil(info.size / 1024)}KB、品質 ${quality}）… ${where} に "images/${id}.webp"`);
      return true;
    }
  }
  console.error(`${file}: 80KB 以下にできませんでした。元の画像を小さくしてください`);
  return false;
}

/** assets-src/favicon.svg → public/favicon.svg・icon-192.png・apple-touch-icon.png */
async function icons() {
  const svg = join(srcDir, 'favicon.svg');
  if (!existsSync(svg)) return;
  const publicDir = join(root, 'public');
  copyFileSync(svg, join(publicDir, 'favicon.svg'));
  for (const [name, px] of [
    ['icon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ]) {
    await sharp(svg, { density: 300 }).resize(px, px).png({ compressionLevel: 9 }).toFile(join(publicDir, name));
  }
  console.log('favicon.svg → public/favicon.svg・icon-192.png・apple-touch-icon.png');
}

mkdirSync(outDir, { recursive: true });
const files = readdirSync(srcDir).filter(
  (f) => INPUT_EXT.has(extname(f).toLowerCase()) && statSync(join(srcDir, f)).isFile(),
);
if (files.length === 0) console.log('assets-src/ に画像がありません');

let ok = true;
for (const file of files) ok = (await convert(file)) && ok;
await icons();
if (!ok) process.exit(1);
