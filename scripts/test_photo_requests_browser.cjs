const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const { preview } = await import('vite');
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/ungoogled-chromium/chrome',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const site = `http://127.0.0.1:${server.httpServer.address().port}`;
  const outDir = '/workspace/vil1-shots';
  fs.mkdirSync(outDir, { recursive: true });
  const errors = [];

  try {
    // 1. Phone Map view (390x844): simplified request list + tap detail
    const mapCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const mapPage = await mapCtx.newPage();
    mapPage.setDefaultTimeout(60000);
    mapPage.on('pageerror', e => errors.push(`map: ${e.message}`));
    await mapPage.goto(site + '/?view=map&coverage=1&coverageArea=&area=elena');
    await mapPage.waitForSelector('.coverage-legend .coverage-req-row', { state: 'attached' });

    // Collapse photo finder and tap Photo coverage summary to open the request list on phone
    const finderToggle = mapPage.locator('#photo-finder-toggle');
    if (await finderToggle.isVisible()) {
      const expanded = await finderToggle.getAttribute('aria-expanded');
      if (expanded === 'true') await finderToggle.tap();
    }
    await mapPage.locator('.coverage-legend > summary').tap();
    await mapPage.waitForSelector('.coverage-legend .coverage-req-row');
    await mapPage.waitForTimeout(250);

    // Check grouping & priority sorting & hidden answered toggle
    const listCheck = await mapPage.evaluate(() => {
      const leg = document.querySelector('.coverage-legend');
      const box = leg.getBoundingClientRect();
      const firstHead = leg.querySelector('.coverage-area-head')?.textContent || '';
      const rows = [...leg.querySelectorAll('.coverage-req-row')];
      const doneBefore = leg.querySelectorAll('.coverage-req-row.is-done').length;
      const singleLine = rows.slice(0, 10).every(r => r.getBoundingClientRect().height <= 48 && r.getBoundingClientRect().right <= 390);
      return { x: box.x, right: box.right, firstHead, count: rows.length, doneBefore, singleLine };
    });
    assert.ok(listCheck.x >= 0 && listCheck.right <= 390, `map legend fits 390px: ${JSON.stringify(listCheck)}`);
    assert.match(listCheck.firstHead, /Elena/i, `current area Elena comes first: ${listCheck.firstHead}`);
    assert.equal(listCheck.doneBefore, 0, 'answered/done hidden by default');
    assert.ok(listCheck.singleLine, 'request rows are compact single-line');

    await mapPage.screenshot({ path: path.join(outDir, 'map-request-list-phone.png') });

    // Toggle answered/done on and verify done rows appear
    await mapPage.locator('#coverage-show-done').check();
    await mapPage.waitForFunction(() => document.querySelectorAll('.coverage-req-row.is-done').length > 0);
    const doneAfter = await mapPage.locator('.coverage-req-row.is-done').count();
    assert.ok(doneAfter >= 4, `answered/done rows shown when toggled: ${doneAfter}`);
    await mapPage.locator('#coverage-show-done').uncheck();

    // Tap first request row -> opens detail dialog with Why
    await mapPage.locator('.coverage-req-row').first().click();
    await mapPage.waitForSelector('.coverage-dialog[open]');
    const dialogText = await mapPage.locator('.coverage-dialog').innerText();
    assert.match(dialogText, /Why:/);
    assert.match(dialogText, /Show on map/);
    await mapPage.screenshot({ path: path.join(outDir, 'map-request-detail-phone.png') });
    await mapPage.locator('.coverage-dialog button', { hasText: 'Close' }).click();
    await mapCtx.close();
    console.log('Map phone list & detail PASS');

    // 2. Phone Inspect view (390x844): 3D spots + mobile Requests button + tap 3D spot
    const inspCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const inspPage = await inspCtx.newPage();
    inspPage.setDefaultTimeout(240000);
    inspPage.on('pageerror', e => errors.push(`inspect: ${e.message}`));
    await inspPage.goto(site + '/?view=overview&area=elena-north');
    const frame = inspPage.frameLocator('#resort-scene');
    await frame.locator('#overview-controls[data-distance]').waitFor({ state: 'attached' });
    await inspPage.waitForFunction(() => Number(document.querySelector('#resort-scene')?.contentDocument?.querySelector('#overview-controls')?.dataset?.distance) > 0);

    // Verify Requests button is visible in mobile inspect and toggle it on
    const reqBtn = frame.locator('#mobile-requests');
    assert.equal(await reqBtn.isVisible(), true, '#mobile-requests visible on mobile inspect');
    await reqBtn.tap();
    await frame.locator('.coverage-legend .coverage-req-row').first().waitFor();
    await inspPage.waitForTimeout(400);

    // Check legend fits bottom of phone screen cleanly
    const inspLayout = await frame.locator('.coverage-legend').evaluate(el => {
      const b = el.getBoundingClientRect();
      return { open: el.open, x: b.x, right: b.right, y: b.y, bottom: b.bottom, h: b.height };
    });
    assert.equal(inspLayout.open, true);
    assert.ok(inspLayout.x >= 0 && inspLayout.right <= 390 && inspLayout.bottom <= 844, `inspect legend fits phone: ${JSON.stringify(inspLayout)}`);

    // Screenshot 1: Inspect view with 3D spots + simplified list
    await inspPage.screenshot({ path: path.join(outDir, 'inspect-spots-and-list-phone.png') });

    // Collapse list to show 3D spots cleanly, and focus first Elena spot using "Look here in 3D"
    await frame.locator('.coverage-req-row').first().tap();
    await frame.locator('.coverage-dialog[open]').waitFor();
    await frame.locator('.coverage-dialog button.primary').tap();
    await inspPage.waitForTimeout(500);

    // Screenshot 2: Close-up 3D Inspect view showing ground ring, numbered billboard, and look arrow
    await inspPage.screenshot({ path: path.join(outDir, 'inspect-3d-spots-phone.png') });

    // Test tapping directly on the 3D spot in the canvas (find its projected sprite / ground centre in the scene)
    const sceneEl = await inspPage.locator('#resort-scene').boundingBox();
    // Since we just clicked "Look here in 3D", the camera target is centered right on that spot!
    // Tap near the centre of the iframe where the 3D spot's pin & ring sit:
    const spotScreen = await frame.locator('body').evaluate(() => {
      // Return center of canvas slightly below/at center where the pin stands
      return { x: innerWidth / 2, y: innerHeight / 2 };
    });
    await inspPage.touchscreen.tap(sceneEl.x + spotScreen.x, sceneEl.y + spotScreen.y);
    await frame.locator('.coverage-dialog[open]').waitFor();
    const tappedText = await frame.locator('.coverage-dialog').innerText();
    assert.match(tappedText, /Why:/, 'tapping 3D spot on canvas opens its ask & why dialog');
    await inspPage.screenshot({ path: path.join(outDir, 'inspect-spot-tapped-phone.png') });
    await frame.locator('.coverage-dialog button', { hasText: 'Close' }).tap();
    await inspCtx.close();
    console.log('Inspect phone 3D spots & tap PASS');

    // 3. Desktop Inspect (1280x800): verify #requests-toggle in .reference-tools
    const deskCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const deskPage = await deskCtx.newPage();
    deskPage.setDefaultTimeout(240000);
    deskPage.on('pageerror', e => errors.push(`desktop: ${e.message}`));
    await deskPage.goto(site + '/?view=overview&area=elena&requests=1');
    const deskFrame = deskPage.frameLocator('#resort-scene');
    await deskPage.waitForFunction(() => Number(document.querySelector('#resort-scene')?.contentDocument?.querySelector('#overview-controls')?.dataset?.distance) > 0);
    await deskFrame.locator('.coverage-legend .coverage-req-row').first().waitFor();
    assert.equal(await deskFrame.locator('#requests-toggle').getAttribute('aria-pressed'), 'true');
    assert.equal(await deskFrame.locator('body').evaluate(() => document.body.classList.contains('coverage-requests-on')), true);
    await deskFrame.locator('#requests-toggle').click();
    assert.equal(await deskFrame.locator('#requests-toggle').getAttribute('aria-pressed'), 'false');
    assert.equal(await deskFrame.locator('body').evaluate(() => document.body.classList.contains('coverage-requests-on')), false);
    await deskCtx.close();
    console.log('Desktop Inspect requests toggle PASS');

    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
