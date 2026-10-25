const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({cacheDir:`node_modules/.vite-inventory-${process.pid}`,server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox']});
 const site=`http://127.0.0.1:${server.httpServer.address().port}`;
 fs.mkdirSync('layout-checks.local',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(site+'/?view=map&network=1&feature=path-observation:elena:T03');await page.waitForSelector('#network-detail h3');
  assert.match(await page.locator('#network-detail').innerText(),/Photo-pixel observation/);
  assert.equal(await page.locator('#path-network-overlay [data-feature-id="elena:T03"]').count(),0,'unregistered source observation has no map pin');
  const comparison=page.getByRole('link',{name:'Compare photo → drawing → current game'});const [viewer]=await Promise.all([page.waitForEvent('popup'),comparison.click()]);
  viewer.on('pageerror',e=>errors.push(e.message));await viewer.waitForSelector('#feature option',{state:'attached'});
  assert.equal(await viewer.locator('#feature').inputValue(),'elena:T03');
  await viewer.waitForFunction(()=>document.querySelector('#image').naturalWidth>=600);
  assert.ok(await viewer.locator('#trace polyline').count()>0);
  assert.match(await viewer.locator('#observation').innerText(),/ceiling/i);
  assert.equal(await viewer.locator('#plan').getAttribute('data'),'plan.svg');
  await viewer.selectOption('#drawing','tunnel-section.svg');assert.equal(await viewer.locator('#plan').getAttribute('data'),'tunnel-section.svg');
  await viewer.waitForFunction(()=>[...document.querySelectorAll('#comparison img')].some(i=>i.naturalWidth>=320));
  await viewer.screenshot({path:'layout-checks.local/elena-inventory-desktop.png'});
  for(const [width,height] of [[390,844],[320,568],[844,390]]){
   await viewer.setViewportSize({width,height});
   if(width<=760){
    const feature=await viewer.locator('#feature').inputValue(),source=await viewer.locator('#source').inputValue();
    for(const tab of ['drawing','game','photo']){
     await viewer.locator(`[data-tab="${tab}"]`).click();
     assert.equal(await viewer.locator(`[data-view="${tab}"]`).isVisible(),true);
     assert.equal(await viewer.locator('#feature').inputValue(),feature);
     assert.equal(await viewer.locator('#source').inputValue(),source);
    }
   }
   assert.equal(await viewer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await viewer.screenshot({path:`layout-checks.local/elena-inventory-${width}x${height}.png`});
  }
  await viewer.setViewportSize({width:1440,height:1000});await viewer.selectOption('#feature','elena:A01');
  const sources=JSON.parse(fs.readFileSync('public/path-network/elena/inventory.json')).sources;
  const privateSource=sources.find(s=>s.private);assert.ok(privateSource);
  await viewer.selectOption('#source',privateSource.id);
  assert.equal(await viewer.locator('#image').isVisible(),false,'private image pixels are never published');
  assert.match(await viewer.locator('#source-limitations').innerText(),/./);
  await viewer.reload();await viewer.waitForSelector('#feature option',{state:'attached'});
  assert.equal(await viewer.locator('#feature').inputValue(),'elena:A01','source-relative selection survives reload');
  assert.deepEqual(errors,[]);
  console.log('Elena source traces, comparison drawings, pinned game views, private metadata, deep links and three mobile viewports PASS');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
