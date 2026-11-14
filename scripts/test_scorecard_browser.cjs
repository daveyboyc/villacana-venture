// Inspect scorecard: area selection, scoped evidence flags, desktop/phone layout.
// Exercise the real scorecard module in the actual slice shell. Stub the renderer host;
// rendering the whole scene is covered separately by test_inspection_browser.cjs.
const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ cacheDir: `node_modules/.vite-check-${process.pid}`, server: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const site = `http://127.0.0.1:${server.httpServer.address().port}`;
  const harnessOut = path.join('layout-checks.local', 'loop-scorecard');
  fs.mkdirSync(harnessOut, { recursive: true });
  const skeleton = JSON.parse(fs.readFileSync('public/map/skeleton.json', 'utf8'));
  const ring = skeleton.pools.find(p => p.id === 'north').ring;
  const points = { 'north-pool': [ring.reduce((sum, p) => sum + p[0], 0) / ring.length + 9,
    ring.reduce((sum, p) => sum + p[1], 0) / ring.length], 'elena-north': [-158.8, 41.2] };
  try {
    for (const [device, options] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 }]]) {
      const context = await browser.newContext(options);
      const page = await context.newPage(), errors = [];
      page.setDefaultTimeout(30000);
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/src/slice.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
        import { areaScorecard } from '/src/scorecard.ts';
        const positions = ${JSON.stringify(points)};
        if (navigator.maxTouchPoints > 0) document.body.classList.add('mobile-inspect');
        document.body.dataset.details = '0';
        const selector = document.querySelector('#inspection-area');
        for (const id of Object.keys(positions)) selector.append(new Option(id, id));
        selector.value = 'north-pool';
        const card = areaScorecard();
        const update = () => card.update(...positions[selector.value]);
        selector.addEventListener('change', update);
        setInterval(update, 50);
        document.querySelector('#scene').dataset.ready = 'true';
        window.loopScorecardHarness = true;
      ` }));
      await page.goto(`${site}/slice.html?pool=north&view=overview&area=north-pool&scorecard=1&details=0`);
      await page.locator('#scene[data-ready="true"]').waitFor();
      assert.equal(await page.evaluate(() => window.loopScorecardHarness), true, 'renderer isolation is explicit');
      for (const [target, area] of [['north-pool', 'north-pool'], ['elena-north', 'elena']]) {
        await page.selectOption('#inspection-area', target);
        await page.waitForFunction(id => document.querySelector('#scorecard')?.dataset.area === id, area);
        const panel = page.locator('#scorecard');
        const isOpen = await panel.evaluate(d => d.open);
        if (!isOpen) await panel.locator(':scope > summary').click();
        const text = await panel.textContent();
        assert(text.includes('Area brief') && text.includes('Placement:'), `${device}: status and source links`);
        assert(text.includes('Build and evidence loop'), `${device}: loop report link`);
        if (area === 'north-pool') {
          assert(text.includes('Needed map (open)') && text.includes('ground-wall corners'), `${device}: actionable map request`);
          assert(text.includes('tracked findings accepted') && text.includes('not whole-area acceptance'), `${device}: acceptance scope`);
          assert(text.includes('tiled stair') && text.includes('top looking down'), `${device}: existing photo spot instructions retained`);
        }
        const fits = await panel.evaluate(d => {
          const box = d.getBoundingClientRect(), jump = document.querySelector('#inspection-jump')?.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && (!jump?.height || box.top >= jump.bottom || box.bottom <= jump.top);
        });
        assert(fits, `${device}: panel fits viewport without covering Inspect selector`);
        await page.screenshot({ path: path.join(harnessOut, `${device}-${area}.png`) });
        await panel.locator(':scope > summary').click();
        assert.equal(await panel.evaluate(d => d.open), false, `${device}: panel collapses`);
        console.log(`${device} ${area}: scorecard selection, evidence flags, acceptance scope and layout PASS`);
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
    fs.rmSync(server.config.cacheDir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
