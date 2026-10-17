// Diagnostic roof-camera renders for issue #89. Local Vite transform changes only the review camera.
// node scripts/review_cervantes_east_south.cjs before /workspace/issue89-before
// node scripts/review_cervantes_east_south.cjs after
// Positions/targets are map metres; 7.2 m local eye elevation and roof-edge camera corrections are estimated, not photogrammetry.
// IMG_2360 moved 2.5 m south from pin (reported accuracy 2.8 m); IMG_2366 moved 3 m south (accuracy 3.9 m).
// These content-based camera corrections clear the modeled roof; catalogue pins are not changed.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const label=process.argv[2]||'after',root=process.argv[3]||process.cwd(),out=path.resolve('docs/reviews/issue-89');fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');
 const server=await createServer({root,plugins:[{name:'issue89-roof-review',enforce:'pre',transform(code,id){
  if(!id.endsWith('/src/slice.ts'))return;
  return code.replace('camera.lookAt(target);',`if(new URLSearchParams(location.search).has('roofReview')){const raw=new URLSearchParams(location.search).get('roofReview').split(',').map(Number);camera.position.set(raw[0],raw[1],raw[2]);camera.lookAt(raw[3],raw[4],raw[5]);player.group.visible=false;}else camera.lookAt(target);`);
 }}],server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [id,position,target] of [['IMG_2360',[-154.419,7.2,52.247],[-135,1.7,48.2]],['IMG_2366',[-150.664,7.2,50.177],[-139,1.7,51.5]]]){
   const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>setTimeout(()=>cb(t),1000));});
   await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=north,middle&roofReview=${[...position,...target].join(',')}`,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>document.querySelector('#walk-camera')&&document.querySelector('canvas'),{timeout:180000});
   await page.waitForTimeout(12000);
   await page.screenshot({path:path.join(out,`${label}-${id}.png`),timeout:180000});
   console.log(`${label}-${id}: ${errors.length?errors.join(' | '):'ok'}`);if(errors.length)throw Error(errors.join(' | '));await page.close();
  }
 }finally{await browser.close();await server.close();}
})();
