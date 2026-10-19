// The canonical application: source discovery, stable links, legacy links, reviews and modes.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ cacheDir:`node_modules/.vite-photo-${process.pid}`, server: { strictPort:false, host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const site = `http://127.0.0.1:${server.httpServer.address().port}`;
  fs.mkdirSync('layout-checks.local', { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const index = JSON.parse(fs.readFileSync('public/reference-index.json'));
    await page.goto(site + '/'); await page.waitForSelector('.photo-result');
    assert.equal(await page.locator('.photo-result').count(), index.references.length, 'all references including private/unplaced are discoverable');
    assert.equal(await page.locator('.photo-map-pin').count(), index.references.filter(r => r.camera).length, 'camera pins remain distinct from subjects');
    assert.equal(await page.locator('#photo-labels').isChecked(), true, 'photo IDs visible by default');
    await page.screenshot({path:'layout-checks.local/unified-map-desktop.png'});
    await page.fill('#photo-search', 'Barraka beach boat');
    assert.deepEqual(await page.locator('.photo-result').evaluateAll(rows => rows.map(r => r.dataset.referenceId)), ['IMG_2223.jpg', 'IMG_2346.jpg', 'IMG_2347.jpg']);
    await page.locator('.photo-result').first().click();
    assert.ok(page.url().includes('photo=IMG_2223.jpg'));
    await page.click('#copy-agent-reference');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.includes('public/photos-ref/IMG_2223.jpg') && copied.includes('Camera is not subject') && copied.includes('4 m uncertainty'));
    assert.equal(await page.locator('[data-subject-label]').count(), 1, 'reviewed boat subject separate from raw camera pin');
    await page.click('#openPhoto'); await page.waitForFunction(() => document.querySelector('#photo-full img').naturalWidth > 600);
    await page.locator('#photo-full button').click();
    await page.locator('#photo-detail summary', {hasText:'Label and camera review'}).click();
    await page.fill('#rvNote', 'test camera note'); await page.click('#rvRight');
    let review = await page.evaluate(() => JSON.parse(localStorage.getItem('villacana-photo-checks-v1')).IMG_2223);
    assert.equal(review.verdict, 'correct'); assert.equal(review.note, 'test camera note');
    await page.click('#rvMove'); await page.mouse.click(400,350); await page.mouse.click(430,320); await page.click('#bnSave');
    review = await page.evaluate(() => JSON.parse(localStorage.getItem('villacana-photo-checks-v1')).IMG_2223);
    assert.equal(review.verdict,'moved'); assert.ok(Number.isFinite(review.x) && Number.isFinite(review.z) && Number.isFinite(review.heading));
    await page.click('#sendChecks');
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).includes('"verdict": "moved"'));
    await page.getByRole('textbox',{name:'Photo label',exact:true}).fill('Local boat caption');
    await page.getByRole('button',{name:'Save draft label'}).click();
    // A later object-map save must preserve the label in its original storage key.
    await page.evaluate(() => { document.querySelector('#map-options').open=true; });
    await page.click('#edit');
    const label = await page.evaluate(() => JSON.parse(localStorage.getItem('villacana-map-edits')).labels['IMG_2223.jpg']);
    assert.equal(label,'Local boat caption');
    await page.reload(); await page.waitForSelector('#photo-detail h2');
    assert.equal(await page.locator('#photo-detail h2').textContent(),'Local boat caption');
    console.log("Discovery, full photo, local reviews and caption persistence PASS");
    // Canonical aliases preserve the photo ID rather than create another map.
    await page.goto(site + '/photos.html?photo=IMG_2347&view=walk#test'); await page.waitForSelector('#photo-detail h2');
    assert.ok(new URL(page.url()).pathname === '/' && page.url().includes('view=map') && page.url().endsWith('#test'));
    assert.ok((await page.locator('#photo-detail h2').textContent()).includes('barbecue boat'));
    assert.ok((await page.locator('#photo-detail').textContent()).includes('Placement disputed: BARRAKA BEACH'),'actual planter discrepancy shown beside its source');
    assert.ok(!(await page.locator('#photo-detail').textContent()).includes('Camera overlaps a solid registry footprint'),'non-standing registry parts cannot imply a solid camera obstruction');
    await page.click('#copy-agent-reference');
    assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('barraka-planter-position'),'copied evidence carries the blocker');
    await page.click('#view-overview');
    const scene=page.frameLocator('#resort-scene'); await scene.locator('#overview-photo-labels').waitFor({state:'attached'});
    await scene.locator('.photo-overview-labels [data-photo-id="IMG_2347.jpg"]').waitFor();
    assert.equal(await scene.locator('#areas').isVisible(),false,'embedded navigation consolidated');
    await scene.locator('[data-photo-id="IMG_2347.jpg"]').click();
    await page.waitForFunction(() => document.body.dataset.appView === 'map');
    assert.ok(page.url().includes('photo=IMG_2347.jpg'));
    console.log("Stable alias and overview photo navigation PASS");
    // Private reference: source path/link, never private image pixels.
    const privateRef=index.references.find(r=>r.private);
    await page.fill('#photo-search',privateRef.id); await page.locator('.photo-result').click();
    assert.equal(await page.locator('#photo-detail img').count(),0);
    assert.ok(await page.locator('#photo-detail a').getAttribute('href').then(h=>h.includes('villacana-reference')));
    assert.equal(await page.locator('.photo-map-pin[display=""]').count(),0);
    const unplaced=index.references.find(r=>!r.private&&!r.camera);
    await page.fill('#photo-search',unplaced.id); await page.locator('.photo-result').click();
    assert.ok((await page.locator('#photo-detail').textContent()).includes('No camera position'));
    await page.goto(site+'/blueprint.html?photo=IMG_2223.jpg'); await page.waitForSelector('#photo-detail h2');
    await page.screenshot({path:'layout-checks.local/unified-map-boat.png'});
    console.log("Private and unplaced source discovery PASS");
    // Mobile portrait and small landscape: search, card, full image, mode controls.
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      await page.fill('#photo-search','boat'); await page.locator('.photo-result').first().click();
      const nav=await page.locator('#app-nav button').evaluateAll(buttons=>buttons.map(b=>({left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right})));
      assert.ok(nav.every(b=>b.left>=0&&b.right<=viewport.width),'every mode and Find photo remain reachable on narrow screens');
      if(viewport.width<=760) {
        const target=await page.locator('[data-subject-label]').evaluate(e=>{const p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y};});
        const panel=await page.locator('#photo-library').boundingBox();
        assert.ok(target.x>=0&&target.x<=viewport.width&&target.y>104&&target.y<panel.y,'located subject stays in visible map above the selected photo card');
      }
      const box=await page.locator('#photo-library').boundingBox();
      assert.ok(box.x>=0&&box.y>=52&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height,'library within viewport');
      if(viewport.width<=760)assert.equal(await page.locator('body>.reference-tools').isVisible(),false,'photo card gets priority over annotation tools');
      await page.click('#openPhoto'); await page.locator('#photo-full button').click();
      await page.screenshot({path:`layout-checks.local/unified-map-${viewport.width}x${viewport.height}.png`});
    }
    assert.deepEqual(errors,[]);
    console.log(`Unified map: ${index.references.length} sources, boat search, camera/subject separation, full photo, links, private/unplaced sources, local reviews and mobile PASS`);
  } catch(error) { const page=browser.contexts()[0]?.pages()[0];if(page)await page.screenshot({path:"layout-checks.local/unified-map-failure.png"}).catch(()=>{});throw error; } finally { await browser.close(); await server.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
