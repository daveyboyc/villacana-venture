const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { preview } = await import('vite');
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    page.setDefaultTimeout(90000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const site = `http://127.0.0.1:${server.httpServer.address().port}`;
    await page.goto(site + '/');
    const scene = page.frameLocator('#resort-scene');
    const canvas = scene.locator('#scene'), controls = scene.locator('#overview-controls');
    await scene.locator('#scene[data-ready="true"]').waitFor();
    assert.equal(await page.locator('#view-overview').getAttribute('aria-pressed'), 'true', 'Inspect opens by default');
    assert.equal(await canvas.getAttribute('data-avatar-visible'), 'false', 'inspection has no character');
    assert.equal(await scene.locator('#walk-pad').isVisible(), false);
    assert.equal(await scene.locator('#overview-rotate').isVisible(), true, 'orbit is discoverable');
    fs.mkdirSync('layout-checks.local', {recursive:true});
    await page.screenshot({path:'layout-checks.local/inspection-default.png'});
    const waitArea=id=>page.waitForFunction(id=>document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.area===id,id);
    const initial = Number(await controls.getAttribute('data-distance'));
    for (let i=0;i<7;i++) await scene.locator('#overview-out').click();
    assert(Number(await controls.getAttribute('data-distance')) > initial*3, 'camera zooms beyond the old limit');
    console.log('Default Inspect, avatar hidden and wide zoom PASS');
    await scene.locator('#overview-fit').click();
    await scene.locator('#inspection-area').selectOption('paseo-west');
    await page.waitForURL(/area=paseo-west/); await waitArea('paseo-west');
    const west = await controls.getAttribute('data-centre');
    const beforePlayer = await canvas.getAttribute('data-player');
    assert(Number(await controls.getAttribute('data-distance')) < initial, 'named jump frames the west paseo');
    assert.equal(await canvas.getAttribute('data-avatar-visible'), 'false');
    // A jump moves the camera without navigating or respawning the scene.
    const source = await page.locator('#resort-scene').getAttribute('src');
    await scene.locator('#inspection-area').selectOption('elena-north');
    await page.waitForURL(/area=elena-north/); await waitArea('elena-north');
    assert.equal(await page.locator('#resort-scene').getAttribute('src'), source);
    assert.equal(await canvas.getAttribute('data-player'), beforePlayer);
    assert.notEqual(await controls.getAttribute('data-centre'), west);
    console.log('Named camera jumps without iframe reload or character movement PASS');
    // Pointer drag pans in inspection; it never moves the walking character.
    const beforePan = await controls.getAttribute('data-centre');
    await page.mouse.move(900, 750); await page.mouse.down(); await page.mouse.move(1020, 700, {steps:5}); await page.mouse.up();
    await page.waitForFunction(before => document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.centre !== before, beforePan);
    assert.equal(await canvas.getAttribute('data-player'), beforePlayer);
    await scene.locator('#overview-rotate').click();
    const pitch = Number(await controls.getAttribute('data-pitch'));
    await page.mouse.move(900,750); await page.mouse.down(); await page.mouse.move(980,680,{steps:5}); await page.mouse.up();
    await page.waitForFunction(before => Number(document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.pitch) < before, pitch);
    assert.notEqual(await controls.getAttribute('data-bearing'), '0');
    console.log('Mouse pan/orbit PASS');
    // Direct links survive reload, and Walk remains independently available.
    await scene.locator('#inspection-area').selectOption('barraka-beach');
    await page.waitForURL(/area=barraka-beach/);
    await page.reload(); await scene.locator('#scene[data-ready="true"]').waitFor();
    assert.equal(await scene.locator('#inspection-area').inputValue(), 'barraka-beach');
    await page.locator('#view-walk').click();
    await scene.locator('#walk-camera').waitFor();
    assert.notEqual(await canvas.getAttribute('data-camera-view'), 'overview');
    await scene.locator('#inspection-area').selectOption('coastal-gate');
    await page.waitForURL(/view=overview.*area=coastal-gate|area=coastal-gate.*view=overview/);
    await controls.waitFor(); await waitArea('coastal-gate');
    assert.equal(await canvas.getAttribute('data-avatar-visible'), 'false');
    fs.mkdirSync('layout-checks.local', {recursive:true});
    await page.screenshot({path:'layout-checks.local/inspection-desktop.png'});
    console.log('Refresh/deep link and separate Walk PASS');
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      for (const selector of ['#inspection-jump','#overview-controls']) {
        const box=await scene.locator(selector).boundingBox();
        assert(box.x>=0 && box.x+box.width<=viewport.width && box.y>=52 && box.y+box.height<=viewport.height, `${selector} fits ${viewport.width}x${viewport.height}`);
      }
      await scene.locator('#inspection-area').selectOption('paseo-west');
      await page.screenshot({path:`layout-checks.local/inspection-${viewport.width}x${viewport.height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    const beforePinch=Number(await controls.getAttribute('data-distance'));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:600,id:1},{x:240,y:600,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:600,id:1},{x:290,y:600,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(before=>Number(document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.distance)<before,beforePinch);
    assert.equal(await canvas.getAttribute('data-avatar-visible'),'false');
    assert.deepEqual(errors, []);
    console.log('Default inspection, wide zoom, area jumps/deep links, avatar-free pointer pan/orbit, separate Walk mobile controls and touch pinch PASS');
  } finally { await browser.close(); await new Promise(resolve => server.httpServer.close(resolve)); }
})().catch(error => {console.error(error);process.exitCode=1;});
