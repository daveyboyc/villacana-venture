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
    mobile.setDefaultTimeout(60000);
    await mobile.goto(site + '/slice.html?pool=north,middle,south,main');
    await mobile.waitForFunction(() => Number(document.querySelector('#overview-controls').dataset.distance) > 0);
    const distance = () => mobile.locator('#overview-controls').getAttribute('data-distance').then(Number);
    const waitDistance = value => mobile.waitForFunction(v => Number(document.querySelector('#overview-controls').dataset.distance) !== v, value);
    await mobile.locator('.camera-out').tap();
    await mobile.waitForFunction(() => Number(document.querySelector('#overview-controls').dataset.distance) > 6);
    // A pinch with the first finger on the walking side must zoom rather than walk/look.
    const cdp = await mobile.context().newCDPSession(mobile);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id,x,y]) => ({id,x,y,radiusX:4,radiusY:4,force:1})) });
    let before = await distance();
    await touch('touchStart', [[1,100,200]]);
    await touch('touchStart', [[1,100,200],[2,290,200]]);
    await touch('touchMove', [[1,140,200],[2,250,200]]);
    await waitDistance(before);
    assert(await distance() > before, 'cross-screen pinch must zoom out while walking');
    await touch('touchCancel', []);
    await mobile.locator('.camera-fit').tap();
    await mobile.waitForFunction(() => !document.querySelector('#overview-controls').hidden);
    console.log('Walking zoom and cross-screen pinch PASS');
    const fit = await distance();
    await mobile.locator('#overview-out').tap();
    await mobile.waitForFunction(d => Number(document.querySelector('#overview-controls').dataset.distance) > d, fit);
    await mobile.locator('#overview-fit').tap();
    await mobile.waitForFunction(d => Number(document.querySelector('#overview-controls').dataset.distance) === d, fit);
    // One-finger pan still works after a cancelled pinch.
    const centre = await mobile.locator('#overview-controls').getAttribute('data-centre');
    await touch('touchStart', [[1,195,200]]);
    await touch('touchMove', [[1,225,220]]);
    await touch('touchEnd', []);
    await mobile.waitForFunction(c => document.querySelector('#overview-controls').dataset.centre !== c, centre);
    await mobile.locator('#overview-fit').tap();
    await mobile.waitForFunction(c => document.querySelector('#overview-controls').dataset.centre === c, centre);
    before = await distance();
    await touch('touchStart', [[1,100,200],[2,290,200]]);
    await touch('touchMove', [[1,140,200],[2,250,200]]);
    await waitDistance(before);
    assert(await distance() > before, 'overview pinch must zoom out beyond fit');
    await touch('touchEnd', []);
    await mobile.locator('#overview-fit').tap();
    console.log('Overview zoom, pan and fit PASS');
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      await mobile.setViewportSize(viewport);
      await mobile.locator('#overview-fit').tap();
      const boxes = await mobile.evaluate(() => {
        const rect = id => {const {x,y,width,height}=document.getElementById(id).getBoundingClientRect();return {x,y,width,height};};
        return {primary:rect('overview-controls'),walk:rect('overview'),buttons:['overview-in','overview-out','overview-fit'].map(rect)};
      });
      assert(boxes.primary.x >= 0 && boxes.primary.x + boxes.primary.width <= boxes.walk.x - 4, 'primary controls must not overlap Walk');
      assert(boxes.primary.y + boxes.primary.height <= viewport.height && boxes.primary.height <= 48, 'primary camera controls stay on one row');
      for (const box of boxes.buttons) assert(box.height >= 44 && box.width >= 44, 'camera touch target');
      assert(await mobile.locator('#jump').isHidden(), 'Jump must not obscure overview controls');
      console.log('Capturing', viewport);
      await mobile.screenshot({path:`layout-checks.local/mobile-${viewport.width}x${viewport.height}.png`});
    }
    console.log('Mobile viewport controls PASS');
    await mobile.setViewportSize({width:390,height:844});
    await mobile.locator('#overview-more summary').tap();
    await mobile.locator('#overview-right').tap();
    await mobile.waitForFunction(() => document.querySelector('#overview-controls').dataset.bearing !== '0');
    await mobile.locator('#overview-north').tap();
    await mobile.locator('#overview-more summary').tap();
    await mobile.locator('#overview').tap();
    await mobile.waitForFunction(() => document.querySelector('#overview-controls').hidden);
    assert(await mobile.locator('#walk-camera').isVisible());
    before = await distance();
    await mobile.locator('.camera-in').tap();
    await waitDistance(before);
    assert(await distance() < before);
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
