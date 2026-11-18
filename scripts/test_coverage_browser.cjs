// The photo coverage layer on the map (src/coverage.ts, public/photo-coverage.json, docs/PHOTO_COVERAGE_PRD.md slice 2):
// features coloured by grade side by side, the photo requests as numbered spots with look arrows, and the dialogs.
//   node scripts/test_coverage_browser.cjs        writes layout-checks.local/coverage-*.png
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ cacheDir: `node_modules/.vite-coverage-${process.pid}`, server: { strictPort: false, host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const site = `http://127.0.0.1:${server.httpServer.address().port}`;
  fs.mkdirSync('layout-checks.local', { recursive: true });
  const coverage = JSON.parse(fs.readFileSync('public/photo-coverage.json', 'utf8'));
  const shown = coverage.requests.filter((r) => r.status !== 'superseded');
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(site + '/?view=map&coverage=1&coverageArea=');
    await page.waitForSelector('.coverage-legend input[data-grade="requests"]');
    await page.waitForFunction(() => document.querySelectorAll('.coverage-layer [data-request]').length > 0);
    assert.equal(await page.locator('#coverage-toggle').getAttribute('aria-pressed'), 'true');
    // Every request outside superseded ones is drawn, with an arrow where it has a look point (some may be off screen).
    const requests = await page.locator('.coverage-layer [data-request]').evaluateAll((els) => els.map((e) => ({ id: e.dataset.request, arrow: e.querySelectorAll('path').length })));
    assert.ok(requests.length > 0 && requests.length <= shown.length, `${requests.length} request spots of ${shown.length}`);
    for (const r of requests) assert.equal(r.arrow > 0, !!shown.find((q) => q.id === r.id).look, r.id);
    // Choose the Elena area: its card says whether it has enough photos, and only its spots stay.
    await page.selectOption('#coverage-area', 'elena');
    await page.waitForFunction(() => document.querySelector('.coverage-legend .area-card')?.dataset.enough === 'false');
    const elenaShown = shown.filter((r) => r.area === 'elena').map((r) => r.id);
    await page.waitForFunction((ids) => [...document.querySelectorAll('.coverage-layer [data-request]')].every((e) => ids.includes(e.dataset.request)), elenaShown);
    const elenaSpots = await page.locator('.coverage-layer [data-request]').evaluateAll((els) => els.map((e) => e.dataset.request));
    assert.ok(elenaSpots.length > 0, 'Elena spots drawn');
    for (const id of elenaSpots) assert.ok(elenaShown.includes(id), `${id} is an Elena request`);
    // Zoom the map to the junction: the near lawn's north side is drawn in a lower grade than its other sides.
    const box = await page.locator('[data-feature="frontage_divisions.json:cervantes-elena-lawn-1"][data-part="north side"]').first().boundingBox();
    assert.ok(box, 'the lawn\'s north side is drawn');
    const north = await page.locator('[data-feature="frontage_divisions.json:cervantes-elena-lawn-1"][data-part="north side"]').first().getAttribute('data-grade');
    const east = await page.locator('[data-feature="frontage_divisions.json:cervantes-elena-lawn-1"][data-part="east side"]').first().getAttribute('data-grade');
    assert.notEqual(north, east, 'the hidden north side shows in its own grade');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -300);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#photo-spots [data-request]').first().evaluate((e) => getComputedStyle(e).display), 'none', 'scorecard pins give way');
    await page.screenshot({ path: 'layout-checks.local/coverage-elena.png' });
    // A feature dialog explains its grade per side.
    await page.locator('[data-feature="lane_walls.json:elena-south-cypress-wall"]').first().dispatchEvent('click');
    await page.waitForSelector('.coverage-dialog[open]');
    const text = await page.locator('.coverage-dialog').innerText();
    assert.match(text, /Seen|Located|Unseen/);
    assert.match(text, /elena-south-cypress-wall-gate/, 'the dialog links the request that settles it');
    await page.screenshot({ path: 'layout-checks.local/coverage-dialog.png' });
    await page.locator('.coverage-dialog a', { hasText: 'elena-south-cypress-wall-gate' }).click();
    assert.match(await page.locator('.coverage-dialog').innerText(), /Photos needed/);
    await page.locator('.coverage-dialog button', { hasText: 'Close' }).click();
    // Hiding a grade removes its outlines; switching the layer off hides it all.
    await page.locator('.coverage-legend input[data-grade="seen"]').uncheck();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.coverage-layer [data-grade="seen"][data-feature="lane_walls.json:elena-south-cypress-wall"]').count(), 0);
    await page.locator('.coverage-legend input[data-grade="seen"]').check();
    await page.click('#coverage-toggle');
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.coverage-layer').evaluate((e) => getComputedStyle(e).display), 'none');
    // Phone width: the legend fits on screen.
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await phone.goto(site + '/?view=map&coverage=1&coverageArea=elena');
    await phone.waitForSelector('.coverage-legend summary');
    const legend = await phone.locator('.coverage-legend').boundingBox();
    assert.ok(legend.x >= 0 && legend.x + legend.width <= 390, 'legend fits a phone');
    await phone.screenshot({ path: 'layout-checks.local/coverage-phone.png' });
    assert.deepEqual(errors, []);
    console.log(`coverage layer ok: ${requests.length} request spots, Elena north side ${north} vs east ${east}`);
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
