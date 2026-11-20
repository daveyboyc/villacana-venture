const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({cacheDir:`node_modules/.vite-patio-${process.pid}`,server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const site=`http://127.0.0.1:${server.httpServer.address().port}`;
 const wall='cervantes_north_patios.json:cervantes-north-partition-east';
 await page.goto(site+'/?view=map&walls=1&wall='+encodeURIComponent(wall));
 await page.waitForSelector('#patio-wall-detail h3');
 assert.match(await page.locator('#patio-wall-detail').innerText(),/3.50 m long/);
 assert.match(await page.locator('#patio-wall-detail').innerText(),/Terrain screening/);
 await page.reload();await page.waitForSelector('#patio-wall-detail h3');
 await page.getByRole('button',{name:'Inspect wall guides here',exact:true}).click();
 assert.match(await page.locator('#resort-scene').getAttribute('src'),/focus=/);
 assert.match(await page.locator('#resort-scene').getAttribute('src'),/wallGuides=1/);
 assert.equal(new URL(await page.locator('#resort-scene').getAttribute('src')).searchParams.get('wall'),wall);
 assert.match(page.url(),/view=overview/);
 await page.getByRole('button',{name:'Map & photos',exact:true}).click();

 await page.getByRole('button',{name:'Photo IMG_2368.jpg',exact:true}).click();
 await page.waitForSelector('#photo-detail h2');assert.equal(await page.locator('#patio-walls').isVisible(),false);
 assert.match(page.url(),/photo=IMG_2368/);
 for(const [width,height] of [[390,844],[320,568],[844,390]]){
 await page.setViewportSize({width,height});await page.goto(site+'/?view=map&walls=1');await page.waitForSelector('#patio-walls:not([hidden])');
 const box=await page.locator('#patio-walls').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y>=50&&box.y+box.height<=height);
 await page.getByRole('combobox',{name:'Wall marking type'}).selectOption('enclosure');
 assert.equal(await page.locator('#patio-wall-results button').count(),23);
 await page.locator('#patio-wall-results button').first().click();assert.doesNotMatch(await page.locator('#patio-wall-detail').innerText(),/m²/);
 await page.locator('#patio-walls').getByRole('button',{name:'Close',exact:true}).click();assert.equal(await page.locator('#patio-walls').isVisible(),false);
 }
 assert.deepEqual(errors,[]);console.log('Patio wall deep links, estimates, photo navigation, unknown outlines and mobile layouts PASS');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
