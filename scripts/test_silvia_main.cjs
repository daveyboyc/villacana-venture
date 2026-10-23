const {chromium}=require('playwright');const fs=require('fs');const assert=require('assert/strict');
(async()=>{const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});await server.listen();const site='http://127.0.0.1:'+server.httpServer.address().port;const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const dir='docs/reviews/silvia-main-integration';fs.mkdirSync(dir,{recursive:true});try{
const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(site+'/?view=map');await page.locator('#silvia-main-map').waitFor();assert.equal(await page.locator('#silvia-main-map path').count()>10,true);
await page.locator('#visit-silvia').click();assert.ok(!page.url().includes('study='));assert.ok(page.url().includes('place=silvia'));
const frame=page.frameLocator('#resort-scene');await frame.locator('canvas[data-ready=true]').waitFor({timeout:120000});await page.screenshot({path:dir+'/main-entrance-after.png'});
// Deterministic cameras in the canonical app; route movement is separately checked with the actual Player/Solids.
const pos=(z)=>{const x=-121.79-.854121*z,y=118.12+.520074*z,r=26*Math.PI/180;return [(x*Math.cos(r)-y*Math.sin(r)).toFixed(3),(x*Math.sin(r)+y*Math.cos(r)).toFixed(3)].join(',')};
for(const [name,z] of [['interior',3.2],['courtyard',7.55],['courtyard-camera',11]]){
 await page.goto(site+'/?view=walk&place=silvia&details=1&at='+pos(z)+'&look='+pos(z+4));await frame.locator('canvas[data-ready=true]').waitFor({timeout:120000});
 const actual=(await frame.locator('canvas').getAttribute('data-player')).split(',').map(Number);assert.ok(Math.hypot(actual[0]-(-121.79-.854121*z),actual[1]-(118.12+.520074*z))<.1);
 assert.equal(await frame.locator('canvas').getAttribute('data-close-camera'),'true');await page.screenshot({path:dir+'/main-'+name+'-after.png'});
}
await page.setViewportSize({width:390,height:844});await page.goto(site+'/?view=walk&place=silvia&details=1');await frame.locator('canvas[data-ready=true]').waitFor({timeout:120000});await page.screenshot({path:dir+'/main-mobile-after.png'});
assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/main-browser-results.json',JSON.stringify({errors,mainScene:true,studyParameter:false},null,2)+'\n');console.log('Normal main-map entry, map overlay, desktop/mobile renders passed.');
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1)});
