// Reproduce Inspect comparisons. --before uses the original middle-pool renderer from origin/main.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
(async () => {
  const before = process.argv.includes('--before'), out = 'docs/reviews/middle-pool-photo-details';
  const { createServer } = await import('vite');
  const original = before ? execFileSync('git', ['show', '866e166ee1fabee68b6ba4bc2fc9bba325f90b61:src/middle-pool.ts'], { encoding: 'utf8' }) : null;
  const server = await createServer({ server: { host: '127.0.0.1', port: 20000 + Math.floor(Math.random() * 20000), strictPort: false }, logLevel: 'error', plugins: before ? [{ name: 'original-middle-pool-review', enforce: 'pre', load(id) { if (id.endsWith('/src/middle-pool.ts')) return original; } }] : [] });
  await server.listen();
  const site = 'http://127.0.0.1:' + server.httpServer.address().port;
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    fs.mkdirSync(out, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1000, height: 740 } });
    page.setDefaultNavigationTimeout(180000);
    page.setDefaultTimeout(180000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const views = before ? [['surfaces', '-136,93,8,65,80', 1], ['inspect', '-129,92,27,45,130', 1], ['west', '-136,93,8,35,260', 1], ['east', '-121.7,90.4,8,25,90', 1], ['gate', '-115.5,81.5,8,20,120', 1]] : [['surfaces', '-136,93,8,65,80', 1], ['inspect', '-129,92,27,45,130', 1], ['west', '-136,93,8,35,260', 1], ['east', '-121.7,90.4,8,25,90', 1], ['gate', '-115.5,81.5,8,20,120', 1], ['layout', '-129,92,27,45,130', 0]];
    for (const [name, inspect, details] of views) {
      const selected = process.argv.find(a => a.startsWith('--views='))?.slice(8).split(',');
      if (selected && !selected.includes(name)) continue;
      await page.goto(`${site}/slice.html?pool=middle&view=overview&details=${details}&ao=0&export=model&inspect=${inspect}`);
      await page.waitForFunction(() => document.querySelector('#scene')?.dataset.ready === 'true', null, { timeout: 240000 });
      assert.equal(await page.locator('#scene').getAttribute('data-avatar-visible'), 'false', 'Inspect has no avatar');
      const fittingIds = await page.evaluate(() => window.villacanaModel.features.map(f => f.id));
      for (const id of ['middle-pool-shower', 'middle-pool-west-path-drain', 'middle-pool-west-deck-cap']) {
        assert.equal(fittingIds.includes(id), !before && !!details, `${id}: present only in current Details`);
      }
      await page.locator('#scene').screenshot({ path: path.join(out, `${name}-${before ? 'before' : 'after'}.png`), timeout: 120000 });
      console.log(`${name}: Inspect ${before ? 'before' : details ? 'Details' : 'Layout'} PASS`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
