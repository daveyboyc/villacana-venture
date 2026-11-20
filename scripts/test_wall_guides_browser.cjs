const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {preview}=await import('vite');const server=await preview({preview:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1200,height:850}});page.setDefaultTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 const wall='cervantes_north_patios.json:cervantes-north-partition-east';
 const url=base+'/slice.html?pool=north,middle&view=overview&wallGuides=1&wall='+encodeURIComponent(wall)+'&debugScene=1';
 await page.goto(url);await page.waitForFunction(()=>window.villacanaScene?.getObjectByName('patio-wall-guides')?.userData.ready);
 await page.waitForSelector('#scene[data-ready="true"]');
 const state=await page.evaluate(async wall=>{
   const data=await (await fetch('./patio-walls.json')).json();const group=window.villacanaScene.getObjectByName('patio-wall-guides');
   const row=data.records.find(r=>r.id===wall),line=group.getObjectByName(wall);
   const a=line.geometry.attributes.instanceStart;
   return {count:group.children.length,expected:data.records.filter(r=>['wall','kerb','enclosure'].includes(r.kind)&&r.points.length>1).length,visible:group.visible,noDrape:group.userData.noDrape,dynamic:group.userData.dynamic,
     first:[a.getX(0),a.getZ(0)],expectedFirst:row.points[0],selected:line.material.color.getHexString(),width:line.material.linewidth,
     context:group.children.some(l=>['gap','context'].includes(l.userData.kind)),dashed:group.children.filter(l=>l.userData.kind==='enclosure').every(l=>l.material.dashed)};
 },wall);
 assert.equal(state.count,state.expected);assert(state.visible&&state.noDrape&&state.dynamic&&state.dashed);assert.equal(state.context,false);assert.equal(state.selected,'ff36b4');assert.equal(state.width,5);
 state.first.forEach((v,i)=>assert(Math.abs(v-state.expectedFirst[i])<.0001,'guide keeps original map coordinates'));
 fs.mkdirSync('layout-checks.local',{recursive:true});await page.screenshot({path:'layout-checks.local/wall-guides-layout.png'});
 await page.getByLabel('Show untraced enclosure edges').uncheck();
 assert(await page.evaluate(()=>window.villacanaScene.getObjectByName('patio-wall-guides').children.filter(l=>l.userData.kind==='enclosure').every(l=>!l.visible)));
 await page.locator('#wall-guides-toggle').click();await page.waitForFunction(()=>!window.villacanaScene.getObjectByName('patio-wall-guides').visible);
 await page.locator('#wall-guides-toggle').click();await page.waitForFunction(()=>window.villacanaScene.getObjectByName('patio-wall-guides').visible);
 await page.setViewportSize({width:390,height:844});
 const box=await page.locator('#wall-guides-toggle').boundingBox();assert(box.x>=0&&box.x+box.width<=390);await page.screenshot({path:'layout-checks.local/wall-guides-mobile.png'});
 await page.setViewportSize({width:1200,height:850});await page.locator('#layout-details').click();
 await page.waitForFunction(()=>window.villacanaScene?.getObjectByName('patio-wall-guides')?.userData.ready);await page.waitForSelector('#scene[data-ready="true"]');
 assert.match(page.url(),/details=1/);assert.equal(await page.locator('#wall-guides-toggle').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:'layout-checks.local/wall-guides-details.png'});
 assert.deepEqual(errors,[]);console.log('Wall guides: source coordinates, selection, uncertain edges, toggle, mobile and Details persistence PASS');
 }finally{await browser.close();await server.httpServer.close();}
})().catch(e=>{console.error(e);process.exit(1)});
