// Issue #36 diagnostic: retained #54 pool-ring camera fit for IMG_2204.
// 7.8 m eye, approximate heading342/pitch17; estimated camera, not surveyed dimensions.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const label=process.argv[2]||'after',root=process.argv[3]||process.cwd(),out=path.resolve('docs/reviews/issue-36');fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');
 const server=await createServer({root,plugins:[{name:'issue36-roof-review',enforce:'pre',transform(code,id){
  if(!id.endsWith('/src/slice.ts'))return;
  return code.replace('camera.lookAt(target);',`if(new URLSearchParams(location.search).has('roofReview')){const raw=new URLSearchParams(location.search).get('roofReview').split(',').map(Number);camera.position.set(raw[0],raw[1],raw[2]);camera.lookAt(raw[3],raw[4],raw[5]);player.group.visible=false;}else camera.lookAt(target);`);
 }}],server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [id,position,target] of [['IMG_2204',[-173.5,7.8,36.6],[-181.2,.5,12.8]]]){
   const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>setTimeout(()=>cb(t),1000));});
   await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=north&roofReview=${[...position,...target].join(',')}`,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>document.querySelector('#walk-camera')&&document.querySelector('canvas'),{timeout:180000});
   await page.waitForTimeout(12000);
   await page.screenshot({path:path.join(out,`${label}-${id}.png`),timeout:180000});
   console.log(`${label}-${id}: ${errors.length?errors.join(' | '):'ok'}`);if(errors.length)throw Error(errors.join(' | '));await page.close();
  }
 }finally{await browser.close();await server.close();}
})();
