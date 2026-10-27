const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({cacheDir:`node_modules/.vite-cervantes-${process.pid}`,server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const site=`http://127.0.0.1:${server.httpServer.address().port}`;
  await page.goto(site+'/?view=map&network=1&feature=path-observation:cervantes:T01');await page.waitForSelector('#network-detail h3');
  assert.match(await page.locator('#network-detail').innerText(),/Photo-pixel observation/);
  assert.equal(await page.locator('#path-network-overlay [data-feature-id="cervantes:T01"]').count(),0);
  const [viewer]=await Promise.all([page.waitForEvent('popup'),page.getByRole('link',{name:'Compare photo → drawing → current game'}).click()]);
  viewer.on('pageerror',e=>errors.push(e.message));await viewer.waitForSelector('#feature option',{state:'attached'});
  assert.equal(await viewer.locator('#feature').inputValue(),'cervantes:T01');
  await viewer.waitForFunction(()=>document.querySelector('#image').naturalWidth>=600);
  assert.ok(await viewer.locator('#trace polyline').count()>0);
  assert.match(await viewer.locator('#observation').innerText(),/flat/i);
  assert.equal(await viewer.locator('#comparison img').count(),0,'unlocated Miguel source must not borrow a game tunnel');
  await viewer.selectOption('#drawing','tunnel-section.svg');assert.equal(await viewer.locator('#plan').getAttribute('data'),'tunnel-section.svg');
  await viewer.selectOption('#feature','cervantes:J01');
  await viewer.waitForFunction(()=>[...document.querySelectorAll('#comparison img')].some(i=>i.naturalWidth>=320));
  assert.match(await viewer.locator('#comparison').innerText(),/83ca94d/);
  fs.mkdirSync('layout-checks.local',{recursive:true});await viewer.screenshot({path:'layout-checks.local/cervantes-inventory-desktop.png'});
  for(const [width,height] of [[390,844],[320,568],[844,390]]){
   await viewer.setViewportSize({width,height});
   const feature=await viewer.locator('#feature').inputValue(),source=await viewer.locator('#source').inputValue();
   if(width<=760)for(const tab of ['drawing','game','photo']){await viewer.locator(`[data-tab="${tab}"]`).click();assert.equal(await viewer.locator(`[data-view="${tab}"]`).isVisible(),true);assert.equal(await viewer.locator('#feature').inputValue(),feature);assert.equal(await viewer.locator('#source').inputValue(),source);}
   assert.equal(await viewer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await viewer.screenshot({path:`layout-checks.local/cervantes-inventory-${width}x${height}.png`});
  }
  await viewer.setViewportSize({width:1440,height:1000});await viewer.selectOption('#feature','cervantes:A01');
  const data=JSON.parse(fs.readFileSync('public/path-network/cervantes/inventory.json'));
  await viewer.selectOption('#source',data.sources.find(s=>s.private).id);
  assert.equal(await viewer.locator('#image').isVisible(),false);
  assert.match(await viewer.locator('#source-limitations').innerText(),/./);
  await viewer.reload();await viewer.waitForSelector('#feature option',{state:'attached'});assert.equal(await viewer.locator('#feature').inputValue(),'cervantes:A01');
  const network=JSON.parse(fs.readFileSync('public/path-network.json')),miguel=network.records.find(r=>r.id==='path-tunnel:miguel-source');
  assert.equal(miguel.location,null);assert.equal(miguel.hostIds.length,0);assert.ok(miguel.portals.every(p=>p.point===null && p.connection===null));
  await page.goto(site+'/?view=map&network=1');await page.waitForSelector('#network-search');await page.fill('#network-search','CALLE MIGUEL');
  await page.locator('[data-network-id="path-tunnel:miguel-source"]').click();assert.match(await page.locator('#network-detail').innerText(),/Location unresolved/);
  await page.reload();await page.waitForSelector('#network-detail h3');assert.match(await page.locator('#network-detail h3').innerText(),/CALLE MIGUEL/);
  assert.deepEqual(errors,[]);
  console.log('Cervantes source annotations, drawings, pinned comparisons, unlocated tunnel, private metadata and three mobile viewports PASS');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
