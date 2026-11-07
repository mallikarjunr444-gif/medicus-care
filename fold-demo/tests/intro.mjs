// Usage: node tests/intro.mjs <outdir>   (needs `python3 -m http.server 8766` in the repo root)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const out = process.argv[2] || 'shots'; mkdirSync(out, { recursive: true });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 800) }, hasTouch: true });
const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
await page.route('**/loaders/USDLoader.js', r => r.fulfill({ contentType: 'text/javascript', body: readFileSync('tests/stub-usd-loader.js') }));
await page.route('**/assets/ui/*', r => r.fulfill({ contentType: 'image/png', body: png }));
await page.goto('http://127.0.0.1:8766/');
await page.waitForFunction(() => window.__intro, null, { timeout: 30000 });
const state = () => page.evaluate(() => ({ cls: document.body.className, angle: document.querySelector('#angle').value, dock: getComputedStyle(document.querySelector('.control-dock')).visibility }));
console.log('start', await state());
await page.waitForTimeout(500); await page.screenshot({ path: `${out}/1-closed.png` });
// real swipe-up gesture: drag upward with the mouse
const cx = +(process.env.W || 1280) / 2, by = +(process.env.H || 800) - 100; await page.mouse.move(cx, by); await page.mouse.down(); await page.mouse.move(cx, by - 60, { steps: 4 }); await page.mouse.move(cx, by - 140, { steps: 4 }); await page.mouse.up();
console.log('after swipe', await state());
for (const [i, t] of [[2, 900], [3, 900], [4, 1500]]) { await page.waitForTimeout(t); console.log('t+', i, (await state()).angle); await page.screenshot({ path: `${out}/${i}-opening.png` }); }
await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 90000 });
await page.waitForTimeout(900); await page.screenshot({ path: `${out}/5-open.png` });
console.log('end', await state(), 'errors:', errors);
await browser.close();
