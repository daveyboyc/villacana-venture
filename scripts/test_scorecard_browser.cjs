// Inspect scorecard: area selection, scoped evidence flags, desktop/phone layout.
// Software WebGL is expensive: reuse one scene per device and allow full detail startup.
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
  const out = path.join('docs', 'reviews', 'area-scorecard');
  fs.mkdirSync(out, { recursive: true });
  try {
    for (const [device, options] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { ...devices['iPhone 13'] }]]) {
      const context = await browser.newContext(options);
      const page = await context.newPage(), errors = [];
      page.setDefaultTimeout(240000);
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${site}/slice.html?pool=north,middle,south,main&view=overview&area=north-pool&scorecard=1`);
      await page.locator('#scene[data-ready="true"]').waitFor();
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
        await page.screenshot({ path: path.join(out, `${device}-${area}.png`) });
        await panel.locator(':scope > summary').click();
        assert.equal(await panel.evaluate(d => d.open), false, `${device}: panel collapses`);
        console.log(`${device} ${area}: Inspect selection, evidence flags, acceptance scope and layout PASS`);
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
