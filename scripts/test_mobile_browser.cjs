const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

// Exercise real touch events and compiled WebGL materials, not device-name flags.
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ cacheDir: `node_modules/.vite-mobile-${process.pid}`, server: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  await server.listen();
  const threeUrl = '/' + require('node:path').relative(process.cwd(), server.config.cacheDir).replaceAll('\\', '/') + '/deps/three.js';
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const site = `http://127.0.0.1:${server.httpServer.address().port}`;
  const errors = [];
  const watch = page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  };
  fs.mkdirSync('layout-checks.local', { recursive: true });
  try {
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    watch(mobile);
    mobile.setDefaultTimeout(120000);
    await mobile.goto(site + '/slice.html?pool=north,middle,south,main');
    await mobile.waitForFunction(() => Number(document.querySelector('#overview-controls').dataset.distance) > 0);
    const distance = () => mobile.locator('#overview-controls').getAttribute('data-distance').then(Number);
    const waitDistance = value => mobile.waitForFunction(v => Number(document.querySelector('#overview-controls').dataset.distance) !== v, value);
    assert.equal(await mobile.locator('#overview-controls').isHidden(), true, 'camera buttons are hidden on a phone');
    assert.equal(await mobile.locator('#layout-details').isHidden(), true, 'details toggle is hidden on a phone');
    assert.equal(await mobile.locator('.reference-tools').isHidden(), true, 'label editing buttons are hidden on a phone');
    assert.equal(await mobile.locator('#walk-camera').isHidden(), true, 'walk controls stay shelved');
    assert.equal(await mobile.evaluate(() => document.body.dataset.details), '1', 'a phone opens in details');
    assert.equal(await mobile.locator('#inspection-area').inputValue(), 'whole-resort');
    assert.equal(await mobile.locator('.reference-layer').first().isHidden(), true, 'place and photo labels stay off on a phone');
    assert.equal(await mobile.locator('#overview-photo-labels').getAttribute('aria-pressed'), 'false', 'photo labels stay off');
    const resort = async () => {
      await mobile.locator('#inspection-area').selectOption('north-pool');
      await mobile.locator('#inspection-area').selectOption('whole-resort');
      await mobile.waitForFunction(() => document.querySelector('#overview-controls').dataset.area === 'whole-resort' && document.querySelector('#overview-controls').dataset.bearing === '0');
    };
    const centreText = () => mobile.locator('#overview-controls').getAttribute('data-centre');
    const readCentre = () => centreText().then(s => s.split(',').map(Number));
    // A pinch must zoom the model rather than start a walk.
    const cdp = await mobile.context().newCDPSession(mobile);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id,x,y]) => ({id,x,y,radiusX:4,radiusY:4,force:1})) });
    const clearSpot = (x0, y0, x1, y1) => mobile.evaluate(({x0,y0,x1,y1}) => {
      const boxes = [...document.querySelectorAll('.reference-pin, #inspection-jump')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden' && !el.hidden)
        .map(el => el.getBoundingClientRect()).filter(b => b.width > 2 && b.height > 2);
      const free = (x, y) => x > 8 && y > 8 && x < innerWidth - 8 && y < innerHeight - 8 && !boxes.some(b => x > b.left - 16 && x < b.right + 16 && y > b.top - 16 && y < b.bottom + 16);
      for (let y = y0; y <= y1; y += 24) for (let x = x0; x <= x1; x += 24) if (free(x, y)) return [x, y];
      return [x0, y0];
    }, {x0, y0, x1, y1});
    let before = await distance();
    await touch('touchStart', [[1,100,200]]);
    await touch('touchStart', [[1,100,200],[2,290,200]]);
    await touch('touchMove', [[1,140,200],[2,250,200]]);
    await waitDistance(before);
    assert(await distance() > before, 'cross-screen pinch must zoom the model');
    await touch('touchCancel', []);
    console.log('Inspect pinch zoom PASS');
    await resort();
    const originText = await centreText();
    const origin = originText.split(',').map(Number);
    const pitch = Number(await mobile.locator('#overview-controls').getAttribute('data-pitch'));
    const orbitFrom = await clearSpot(40, 220, 160, 520);
    await touch('touchStart', [[1, ...orbitFrom]]);
    await touch('touchMove', [[1, orbitFrom[0] + 90, orbitFrom[1] - 70]]);
    await touch('touchEnd', []);
    await mobile.waitForFunction(before => Number(document.querySelector('#overview-controls').dataset.pitch) !== before || document.querySelector('#overview-controls').dataset.bearing !== '0', pitch);
    assert.equal(await centreText(), originText, 'one finger orbits without panning');
    await resort();
    await mobile.waitForFunction(c => document.querySelector('#overview-controls').dataset.centre === c, originText);
    const left = await clearSpot(24, 240, 120, 640);
    const right = await clearSpot(220, left[1] - 40, 360, left[1] + 40);
    await touch('touchStart', [[1, ...left], [2, ...right]]);
    await touch('touchMove', [[1, left[0], left[1] - 110], [2, right[0], right[1] - 110]]);
    await touch('touchEnd', []);
    await mobile.waitForFunction(c => document.querySelector('#overview-controls').dataset.centre !== c, originText);
    const upward = await readCentre();
    assert(upward[1] > origin[1], 'two fingers moving up move forward into the scene');
    await resort();
    await mobile.waitForFunction(c => document.querySelector('#overview-controls').dataset.centre === c, originText);
    const distanceBeforeSlide = await distance();
    const downLeft = await clearSpot(24, 180, 120, 520);
    const downRight = await clearSpot(220, downLeft[1] - 40, 360, downLeft[1] + 40);
    await touch('touchStart', [[1, ...downLeft], [2, ...downRight]]);
    await touch('touchMove', [[1, downLeft[0], downLeft[1] + 110], [2, downRight[0], downRight[1] + 110]]);
    await touch('touchEnd', []);
    await mobile.waitForFunction(c => document.querySelector('#overview-controls').dataset.centre !== c, originText);
    const downward = await readCentre();
    assert(downward[1] < origin[1], 'two fingers moving down move back');
    assert(Math.abs(await distance() - distanceBeforeSlide) < 1, 'a parallel two-finger drag does not zoom');
    const bearing = await mobile.locator('#overview-controls').getAttribute('data-bearing');
    await touch('touchStart', [[1,120,400],[2,270,400]]);
    await touch('touchMove', [[1,147,343],[2,243,457]]);
    await touch('touchEnd', []);
    await mobile.waitForFunction(b => document.querySelector('#overview-controls').dataset.bearing !== b, bearing);
    await resort();
    await mobile.waitForFunction(() => document.querySelector('#overview-controls').dataset.bearing === '0');
    console.log('Phone details, hidden labels, one-finger orbit and two-finger pan PASS');
    before = await distance();
    await touch('touchStart', [[1,100,200],[2,290,200]]);
    await touch('touchMove', [[1,140,200],[2,250,200]]);
    await waitDistance(before);
    assert(await distance() > before, 'overview pinch must zoom out beyond fit');
    await touch('touchEnd', []);
    await resort();
    console.log('Overview zoom, pan and whole resort PASS');
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      await mobile.setViewportSize(viewport);
      const jump = await mobile.locator('#inspection-jump').boundingBox();
      assert(jump && jump.x >= 0 && jump.x + jump.width <= viewport.width && jump.y >= 0 && jump.y + jump.height <= viewport.height, `area jump fits ${viewport.width}x${viewport.height}`);
      assert.equal(await mobile.locator('#overview-controls').isHidden(), true);
      assert.equal(await mobile.locator('#overview-pan').isHidden(), true);
      assert.equal(await mobile.locator('#jump').isHidden(), true, 'Jump must not obscure the model');
      console.log('Capturing', viewport);
      await mobile.screenshot({path:`layout-checks.local/mobile-${viewport.width}x${viewport.height}.png`});
    }
    console.log('Mobile viewport controls PASS');
    await mobile.setViewportSize({width:390,height:844});
    const bearingBefore = await mobile.locator('#overview-controls').getAttribute('data-bearing');
    const turnFrom = await clearSpot(40, 280, 160, 640);
    await touch('touchStart', [[1, ...turnFrom]]);
    await touch('touchMove', [[1, turnFrom[0] + 140, turnFrom[1]]]);
    await touch('touchEnd', []);
    await mobile.waitForFunction(b => document.querySelector('#overview-controls').dataset.bearing !== b, bearingBefore);
    await resort();
    await mobile.waitForFunction(() => document.querySelector('#overview-controls').dataset.bearing === '0');
    await mobile.goto(site + '/slice.html?pool=north,middle,south,main&view=walk');
    await mobile.waitForFunction(() => document.querySelector('#scene').dataset.cameraView !== 'overview');
    assert.equal(await mobile.locator('#walk-camera').isVisible(), true, 'direct walk link still opens the shelved walker');
    // 2D fit is visible next to zoom, without scrolling through the options bar.
    await mobile.goto(site + '/blueprint.html');
    await mobile.waitForSelector('#coastal-gate-boundary');
    const fit2d = await mobile.locator('#reset').boundingBox();
    assert(fit2d.x >= 0 && fit2d.x + fit2d.width <= 390 && fit2d.height >= 44);
    const original = await mobile.locator('#map').getAttribute('viewBox');
    await mobile.locator('#map-zoom-in').tap();
    assert.notEqual(await mobile.locator('#map').getAttribute('viewBox'), original);
    await mobile.locator('#reset').tap();
    assert.equal(await mobile.locator('#map').getAttribute('viewBox'), original);
    await mobile.screenshot({path:'layout-checks.local/map-mobile.png'});

    // Render the production ground material. Left half is lawn, right is paving.
    // A white turf sample is the control for mask isolation and visible variation.
    const renderTurf = page => page.evaluate(async (threeUrl) => {
      const THREE = await import(threeUrl);
      const { groundMaterial, surfaceTexture } = await import('/src/materials.ts');
      const renderer = new THREE.WebGLRenderer({antialias:false});
      renderer.setSize(128,128);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff,2));
      const camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
      const paint=document.createElement('canvas');paint.width=paint.height=16;
      const g=paint.getContext('2d');g.fillStyle='#718658';g.fillRect(0,0,16,16);
      const mask=document.createElement('canvas');mask.width=mask.height=16;
      const m=mask.getContext('2d');m.fillStyle='black';m.fillRect(0,0,16,16);m.fillStyle='white';m.fillRect(0,0,8,16);
      const material=groundMaterial(new THREE.CanvasTexture(paint),mask,1.6);
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);scene.add(mesh);
      const target=new THREE.WebGLRenderTarget(128,128);renderer.setRenderTarget(target);
      renderer.render(scene,camera);
      const pixels=new Uint8Array(128*128*4);renderer.readRenderTargetPixels(target,0,0,128,128,pixels);
      // Use the same ground map with standard rendering as an independent control.
      mesh.material=new THREE.MeshStandardMaterial({map:material.map,roughness:.95,alphaTest:.5});
      renderer.render(scene,camera);
      const control=new Uint8Array(pixels.length);renderer.readRenderTargetPixels(target,0,0,128,128,control);
      let changed=0,pavingChanges=0,opaque=true,min=255,max=0;
      for(let y=8;y<120;y++)for(let x=8;x<120;x++) {
        const k=(y*128+x)*4;opaque&&=pixels[k+3]===255;
        if(x<56){min=Math.min(min,pixels[k]);max=Math.max(max,pixels[k]);if(pixels[k]!==control[k])changed++;}
        if(x>72&&pixels[k]!==control[k])pavingChanges++;
      }
      const turf=surfaceTexture('turf');
      const result={changed,pavingChanges,opaque,range:max-min,sample:Array.from(pixels),size:turf.image.width};
      renderer.setRenderTarget(null);target.dispose();renderer.dispose();return result;
    }, threeUrl);
    console.log('Mobile rotation and 2D fit PASS');
    const mobileTurf=await renderTurf(mobile);
    assert(mobileTurf.changed>1000 && mobileTurf.range>15, 'grass must have visible rendered detail');
    assert.equal(mobileTurf.pavingChanges,0,'grass detail must stay inside the lawn mask');
    assert(mobileTurf.opaque,'ground must remain opaque');
    assert(mobileTurf.size<=512,'grass detail must not require a large texture');
    const desktop=await browser.newPage({viewport:{width:1400,height:1000}});watch(desktop);
    await desktop.goto(site+'/blueprint.html');await desktop.waitForSelector('#coastal-gate-boundary');
    const desktopTurf=await renderTurf(desktop);
    assert.deepEqual(mobileTurf.sample,desktopTurf.sample,'mobile and desktop use identical material output');
    assert.deepEqual(errors,[]);
    console.log('Mobile portrait/landscape controls, cross-screen pinch, cancel, pan, fit, 2D fit and compiled grass material parity PASS');
  } finally { await browser.close();await server.close(); }
})().catch(e => { console.error(e);process.exitCode=1; });
