const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { preview } = await import('vite');
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: Number(process.env.VILLACANA_TEST_DEVICE_SCALE || 1) });
    page.setDefaultTimeout(240000); // Full detail startup on software WebGL, as in shoot_views.cjs.
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
    // Google Maps arrangement. A plain drag grabs the ground and pans; it never moves the shelved walker.
    const centreOf = async () => (await controls.getAttribute('data-centre')).split(',').map(Number);
    const moved = (before, metres = 1) => page.waitForFunction(({before, metres}) => {
      const [x, z] = document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.centre.split(',').map(Number);
      return Math.hypot(x - before[0], z - before[1]) > metres;
    }, {before, metres});
    assert.equal(await scene.locator('#overview-pan').getAttribute('aria-pressed'), 'true', 'a drag pans by default');
    assert.equal(await controls.getAttribute('data-bearing'), '0');
    const dragStart = await centreOf();
    await page.mouse.move(880, 620); await page.mouse.down(); await page.mouse.move(1040, 620, {steps:4}); await page.mouse.up();
    await moved(dragStart);
    assert((await centreOf())[0] < dragStart[0], 'dragging right pulls the ground right, so the view moves west');
    assert.equal(await controls.getAttribute('data-bearing'), '0', 'a plain drag pans without turning');
    assert.equal(await canvas.getAttribute('data-player'), beforePlayer);
    // The drag focused the scene, so the arrow keys move it: up is forward (north at bearing 0).
    const keyStart = await centreOf();
    await page.keyboard.down('ArrowUp'); await moved(keyStart, 2); await page.keyboard.up('ArrowUp');
    assert((await centreOf())[1] < keyStart[1], 'the up arrow moves forward');
    // With focus on the page around the scene the keys still reach it.
    await page.evaluate(() => { document.activeElement?.blur?.(); window.focus(); });
    const backStart = await centreOf();
    await page.keyboard.down('ArrowDown'); await moved(backStart, 2); await page.keyboard.up('ArrowDown');
    assert((await centreOf())[1] > backStart[1], 'the down arrow moves back, even from the page outside the scene');
    console.log('Drag pan and arrow-key forward/back PASS');
    // A scroll zooms towards the pointer, whether it is a mouse notch or a trackpad scroll.
    const zoomStart = await centreOf(), distanceBeforeZoom = Number(await controls.getAttribute('data-distance'));
    await scene.locator('#scene').evaluate(node => {
      for (let i = 0; i < 4; i++) node.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, deltaMode: 0, clientX: node.clientWidth * 0.85, clientY: node.clientHeight / 2 }));
    });
    await page.waitForFunction(before => Number(document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.distance) < before, distanceBeforeZoom);
    await moved(zoomStart, 0.5);
    assert((await centreOf())[0] > zoomStart[0], 'scrolling in on the right of the screen zooms towards the right');
    const distanceBeforeScroll = Number(await controls.getAttribute('data-distance'));
    await scene.locator('#scene').evaluate(node => {
      for (let i = 0; i < 6; i++) node.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 3, deltaY: 24.5, deltaMode: 0, clientX: node.clientWidth / 2, clientY: node.clientHeight / 2 }));
    });
    await page.waitForFunction(before => Number(document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.distance) > before, distanceBeforeScroll);
    const beforeTrackpadPinch = Number(await controls.getAttribute('data-distance'));
    await scene.locator('#scene').evaluate(node => {
      for (let i = 0; i < 8; i++) node.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -12, deltaMode: 0, ctrlKey: true, clientX: node.clientWidth / 2, clientY: node.clientHeight / 2 }));
    });
    await page.waitForFunction(before => Number(document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.distance) < before * 0.85, beforeTrackpadPinch);
    console.log('Scroll and pinch zoom towards the pointer PASS');
    // Right-drag rotates about the point under the pointer: at the screen centre the centre stays put...
    const box = await page.locator('#resort-scene').boundingBox();
    const middle = [box.x + box.width / 2, box.y + box.height / 2];
    const turnStart = await centreOf(), bearing = await controls.getAttribute('data-bearing');
    await page.mouse.move(...middle); await page.mouse.down({ button: 'right' });
    await page.mouse.move(middle[0] + 140, middle[1], { steps: 5 }); await page.mouse.up({ button: 'right' });
    await page.waitForFunction(b => document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.bearing !== b, bearing);
    const turnEnd = await centreOf();
    assert(Math.hypot(turnEnd[0] - turnStart[0], turnEnd[1] - turnStart[1]) < 1.5, 'turning about the screen centre keeps the centre');
    // ...and off centre, Ctrl-drag turns and tilts about that point, so the centre swings round it.
    const pitch = Number(await controls.getAttribute('data-pitch')), bearing2 = await controls.getAttribute('data-bearing');
    await page.keyboard.down('Control');
    await page.mouse.move(middle[0] - 260, middle[1] + 160); await page.mouse.down();
    await page.mouse.move(middle[0] - 140, middle[1] + 110, { steps: 5 }); await page.mouse.up();
    await page.keyboard.up('Control');
    await page.waitForFunction(b => document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.bearing !== b, bearing2);
    assert(Number(await controls.getAttribute('data-pitch')) < pitch, 'dragging up tilts toward the horizon');
    await moved(turnEnd, 1);
    assert.equal(await canvas.getAttribute('data-player'), beforePlayer);
    // The Orbit button makes a plain drag rotate instead.
    await scene.locator('#overview-rotate').click();
    const bearing3 = await controls.getAttribute('data-bearing');
    await page.mouse.move(900, 750); await page.mouse.down(); await page.mouse.move(1000, 750, {steps:5}); await page.mouse.up();
    await page.waitForFunction(b => document.querySelector('#resort-scene').contentDocument.querySelector('#overview-controls').dataset.bearing !== b, bearing3);
    await scene.locator('#overview-pan').click();
    console.log('Rotate and tilt about the pointer, and the Orbit switch PASS');
    // Direct links survive reload. Walk is shelved: the nav button is not offered.
    await scene.locator('#inspection-area').selectOption('barraka-beach');
    await page.waitForURL(/area=barraka-beach/);
    await page.reload(); await scene.locator('#scene[data-ready="true"]').waitFor();
    assert.equal(await scene.locator('#inspection-area').inputValue(), 'barraka-beach');
    assert.equal(await page.locator('#view-walk').isHidden(), true, 'Walk stays shelved');
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
