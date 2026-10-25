const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({cacheDir:`node_modules/.vite-network-${process.pid}`,server:{host:'127.0.0.1',port:0,strictPort:false}, logLevel:'error'});
  await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});
  const site = `http://127.0.0.1:${server.httpServer.address().port}`;
  fs.mkdirSync('layout-checks.local',{recursive:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(site+'/?view=map&network=1');
    await page.waitForSelector('#path-network:not([hidden])');
    assert.equal(await page.locator('#network-area option').count(),15);
    await page.selectOption('#network-area','north-lanes');
    await page.locator('[data-network-id="path-coverage:north-lanes"]').click();
    assert.match(await page.locator('#network-detail').innerText(),/source needed/);
    await page.selectOption('#network-area','');
    await page.fill('#network-search','Jorge covered passage');
    await page.locator('[data-network-id="path-tunnel:jorge"]').click();
    assert.match(await page.locator('#network-detail').innerText(),/Location unresolved/);
    assert.equal(await page.locator('#path-network-overlay circle').count(),0);
    assert.match(page.url(),/feature=path-tunnel/);
    await page.reload();
    await page.waitForSelector('#network-detail h3');
    assert.equal(await page.locator('#network-detail h3').innerText(),'Jorge covered passage source group');
    await page.screenshot({path:'layout-checks.local/path-network-desktop.png'});
    await page.getByRole('button',{name:'Open source IMG_2185.jpg',exact:true}).click();
    await page.waitForSelector('#photo-detail h2');
    assert.equal(await page.locator('#path-network').isVisible(),false);
    assert.match(page.url(),/photo=IMG_2185/);
    // Deep-linking and viewport changes preserve unresolved selection without inventing pins.
    for (const [width,height] of [[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({width,height});
      await page.goto(site+'/?view=map&network=1&feature=path-tunnel:jorge');
      await page.waitForSelector('#network-detail h3');
      const box=await page.locator('#path-network').boundingBox();
      assert.ok(box.x>=0 && box.x+box.width<=width && box.y>=52 && box.y+box.height<=height);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:`layout-checks.local/path-network-${width}x${height}.png`});
      await page.getByRole('button',{name:'Close',exact:true}).click();
      assert.equal(await page.locator('#path-network').isVisible(),false);
      // Map camera controls still work after closing the inventory.
      const before=await page.locator('#map').getAttribute('viewBox');
      await page.locator('#map-zoom-in').click();
      assert.notEqual(await page.locator('#map').getAttribute('viewBox'),before);
    }
    assert.deepEqual(errors,[]);
    console.log('Path network discovery, unknown portals, source switching, deep links and three mobile viewports PASS');
  } finally { await browser.close();await server.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
