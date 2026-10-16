// Photo map page (photos.html): loads, a check and a note save on this browser, a pin moves,
// the full-size photo opens, and "Send checks" hands over the reviews.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/photos.html`);
    await page.waitForSelector('#rvRight');
    const pins = await page.locator('g.pin').count();
    assert.ok(pins > 140, 'every placed photo has a pin: ' + pins);
    assert.ok(await page.locator('#thumbs .thumb').count() > 140, 'thumbnails listed');
    await page.click('#rvRight');
    await page.fill('#rvNote', 'test note');
    await page.click('#rvSave');
    await page.waitForFunction(() => document.querySelector('#rvSaved')?.textContent === 'Saved.');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('villacana-photo-checks-v1')));
    const first = Object.values(stored)[0];
    assert.equal(first.verdict, 'correct');
    assert.equal(first.note, 'test note');
    // Move the pin: where I stood, then where it points.
    await page.click('#rvMove');
    const box = await page.locator('#map').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2 + 30, box.y + box.height / 2 - 30);
    await page.click('#bnSave');
    await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('villacana-photo-checks-v1')))[0].verdict === 'moved');
    const moved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('villacana-photo-checks-v1')))[0]);
    assert.ok(Number.isFinite(moved.x) && Number.isFinite(moved.z) && Number.isFinite(moved.heading), 'moved pin has a position and heading');
    // Full-size photo.
    await page.click('#openPhoto');
    await page.waitForFunction(() => !document.querySelector('#lightbox').hidden && document.querySelector('#lbImg').naturalWidth > 600);
    await page.click('#lbClose');
    // Checks survive a reload and can be sent.
    await page.reload();
    await page.waitForSelector('#sendChecks:not([hidden])');
    await page.click('#sendChecks');
    const sent = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(sent.startsWith('Villacana photo checks:') && sent.includes('"verdict": "moved"'), 'checks copied for Claude');
    assert.deepEqual(errors, []);
    console.log(`Photo map: ${pins} pins, check, note, moved pin, full photo and send PASS`);
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
