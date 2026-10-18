const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'layout-checks.local/north-courtyard');
 const {createServer}=await import('vite');
 const server=await createServer({root,logLevel:'error',server:{host:'127.0.0.1',port:0},plugins:[{name:'north-courtyard-review',transform(code,id){
  if(!id.endsWith('/src/slice.ts'))return;
  const marker='renderer.render(scene, camera);';
  if(!code.includes(marker))throw Error('Missing render hook');
  return code.replace(marker,'const pose=(new URLSearchParams(location.search).get("reviewPose")??"-187,82,19,-187,0,19,.899,0,-.438").split(",").map(Number);camera.up.set(pose[6],pose[7],pose[8]);camera.position.set(pose[0],pose[1],pose[2]);camera.lookAt(pose[3],pose[4],pose[5]);camera.updateMatrixWorld(true);player.group.visible=false;'+marker+'renderer.domElement.dataset.reviewReady="true";');
 }}]});
 let browser;
 try{
  await server.listen();browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});fs.mkdirSync(out,{recursive:true});
  for(const [name,pools,pose] of [['north','north','-187,82,19,-187,0,19,.899,0,-.438'],['whole','north,middle,south,main','-187,82,19,-187,0,19,.899,0,-.438'],['west-oblique','north','-180,15,12,-203,3.3,24,0,1,0']]){
   if(process.argv[4]&&process.argv[4]!==name)continue;
   const page=await browser.newPage({viewport:{width:900,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>setTimeout(()=>cb(t),1000));});
   await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=${pools}&reviewPose=${pose}`,{timeout:180000});
   await page.waitForSelector('canvas[data-review-ready="true"]',{timeout:180000});
   await page.evaluate(()=>{const c=document.querySelector('canvas');(c.getContext('webgl2')??c.getContext('webgl'))?.finish();});
   await page.screenshot({path:path.join(out,name+'.png'),timeout:180000});console.log(JSON.stringify({name,errors}));if(errors.length)throw Error(errors.join('\n'));await page.close();
  }
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
