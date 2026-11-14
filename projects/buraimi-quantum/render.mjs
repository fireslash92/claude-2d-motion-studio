// Frame-by-frame renderer: headless Chrome draws each frame of preview.html, ffmpeg encodes them.
//   node render.mjs <from> <to> <step> <outDir> [--local <fontDir>] [--frames 120,480,...]
// Needs `playwright` (npm i playwright && npx playwright install chromium) or a system Chrome via CHROME_PATH.
import fs from 'node:fs'; import path from 'node:path';
const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { chromium } = pw.chromium ? pw : pw.default;
const [from, to, step, outDir] = [+process.argv[2] || 0, +process.argv[3] || 3600, +process.argv[4] || 1, process.argv[5] || 'frames'];
const li = process.argv.indexOf('--local'), localFonts = li > 0 ? process.argv[li + 1] : null;
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json' };
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.route('**/*', r => {
  const u = new URL(r.request().url());
  if (u.hostname !== 'film') return r.abort();
  const rel = decodeURIComponent(u.pathname), file = rel.startsWith('/localfonts/') && localFonts ? path.join(localFonts, rel.slice(12)) : path.join(ROOT, rel);
  if (!fs.existsSync(file)) return r.fulfill({ status: 404, body: '' });
  r.fulfill({ status: 200, contentType: TYPES[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
});
await page.goto(`http://film/preview.html?export=1${localFonts ? '&local=1' : ''}`);
await page.waitForFunction(() => window.filmReady === true, null, { timeout: 60000 });
await page.evaluate(async () => { window.renderAt(600); await Promise.all([document.fonts.load('400 40px Tajawal', 'ﺑﻤ ب'), document.fonts.load('700 40px Tajawal', 'ب'), document.fonts.load('700 40px Lat', '1')]); await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
const fi = process.argv.indexOf('--frames');
const list = fi > 0 ? process.argv[fi + 1].split(',').map(Number) : Array.from({ length: Math.ceil((to - from) / step) }, (_, k) => from + k * step);
const t0 = Date.now();
for (const f of list) {
  await page.evaluate(n => window.renderAt(n), f);
  await page.screenshot({ path: path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}
console.log(`rendered ${list.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
