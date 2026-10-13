const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=north,middle,south,main&view=overview`);
    const state = () => page.locator('#overview-controls');
    await page.waitForFunction(() => Number(document.querySelector('#overview-controls').dataset.distance) > 0);
    const initial = Number(await state().getAttribute('data-distance'));
    await page.click('#overview-in');
    await page.waitForFunction(d => Number(document.querySelector('#overview-controls').dataset.distance) < d, initial);
    await page.click('#overview-right');
    await page.waitForFunction(() => document.querySelector('#overview-controls').dataset.bearing !== '0');
    await page.locator('#overview-rotation').evaluate(e => { e.value = '90'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => document.querySelector('#overview-bearing').textContent === '90°');
    await page.click('#overview-north');
    await page.waitForFunction(() => document.querySelector('#overview-bearing').textContent === '0°');
    await page.click('#alignment-platform');
    await page.waitForFunction(() => Number(document.querySelector('#overview-controls').dataset.distance) === 85);
    fs.mkdirSync('layout-checks.local', { recursive: true });
    await page.screenshot({ path: 'layout-checks.local/platform-check.png' });
    await page.click('#overview-fit');
    await page.waitForFunction(d => Number(document.querySelector('#overview-controls').dataset.distance) === d, initial);
    await page.screenshot({ path: 'layout-checks.local/overview-check.png' });
    await page.click('#overview-check');
    await page.waitForFunction(() => document.querySelector('#alignment-notes').hidden);
    await page.click('#overview-check');
    await page.click('#overview-rotate');
    assert.equal(await page.locator('#overview-rotate').getAttribute('aria-pressed'), 'true');
    await page.click('#overview');
    await page.waitForFunction(() => document.querySelector('#alignment-notes').hidden && document.querySelector('#overview-controls').hidden);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#overview');
    await page.waitForFunction(() => !document.querySelector('#overview-controls').hidden);
    const box = await state().boundingBox();
    assert(box.x >= 0 && box.x + box.width <= 390);
    await page.reload();
    await page.waitForFunction(() => !document.querySelector('#overview-controls').hidden);
    assert.equal(await page.locator('#alignment-details').getAttribute('open'), null);
    await page.screenshot({ path: 'layout-checks.local/overview-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('Overview zoom, rotation, north reset, focus notes, overlay toggle, walk visibility and mobile toolbar PASS');
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
