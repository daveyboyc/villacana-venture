// Same model-context cameras before/after; these are not calibrated photo cameras.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const phase=process.argv.includes('--before')?'before':'after';
 const {createServer}=await import('vite');
 // Local harness changes only the camera, leaving production geometry/materials intact.
 const server=await createServer({root:process.env.ELENA_REVIEW_ROOT??process.cwd(),server:{host:'127.0.0.1',port:20000+Math.floor(Math.random()*20000),strictPort:false},logLevel:'error',plugins:[{name:'elena-review-camera',transform(code,id){
  if(!id.endsWith('/src/slice.ts'))return;
  return code.replace('camera.updateMatrixWorld();',`if(window.__elenaReviewCamera){const c=window.__elenaReviewCamera;camera.position.set(...c.eye);camera.lookAt(...c.target);player.group.visible=false;}camera.updateMatrixWorld();`);
 }}]});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const dir='docs/reviews/elena-patio-wall-correction';fs.mkdirSync(dir,{recursive:true});
 const skeleton=JSON.parse(fs.readFileSync('public/map/skeleton.json')),r=skeleton.viewRotation*Math.PI/180;
 const turned=([x,z])=>[x*Math.cos(r)-z*Math.sin(r),x*Math.sin(r)+z*Math.cos(r)].map(v=>v.toFixed(3)).join(',');
 let views=[['north-patio',[-157.55,30.5],[-154.2,30.4]],['north-join',[-154.9,35.7],[-152.7,35.6]],['garden-door',[-149.15,49.4],[-144.63,46.79]],['cervantes-corner',[-139.5,51.2],[-145,44]],['elevated-patios',[-159,36],[-153,30]],['south-crosspath',[-146.5,69.5],[-153,70]]];
 if(process.argv.includes('--elevated-only'))views=views.filter(v=>v[0]==='elevated-patios');
 if(process.argv.includes('--south-only'))views=views.filter(v=>v[0]==='south-crosspath');
 const records=[];
 try{
  for(const [id,at,look]of views){
   const page=await browser.newPage({viewport:{width:1000,height:750}});page.setDefaultTimeout(120000);
   const errors=[];const handler=e=>errors.push(e.message);page.on('pageerror',handler);
   const camera=id==='elevated-patios'?{eye:[-160,17,29],target:[-153,1.8,30]}:id==='south-crosspath'?{eye:[-142,9,72],target:[-150.5,1,69.5]}:null;
   if(camera)await page.addInitScript(c=>{window.__elenaReviewCamera=c;},camera);
   const start=Date.now();await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?view=walk&camera=first&at=${turned(at)}&look=${turned(look)}`,{waitUntil:'domcontentloaded'});
   await page.frameLocator('#resort-scene').locator('canvas[data-ready=true]').waitFor();
   await page.screenshot({path:`${dir}/${id}-${phase}.png`,timeout:120000});
   records.push({id,at,look,camera:camera?'uncalibrated elevated model-context; local harness camera override': 'uncalibrated model-context first person',...(camera??{}),elapsedMs:Date.now()-start,errors});page.off('pageerror',handler);
   console.log(id,phase,records.at(-1).elapsedMs,errors);
   if(errors.length)throw Error(JSON.stringify(errors));
   await page.close();
  }
  const file=`${dir}/capture-${phase}.json`,old=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):[];
  fs.writeFileSync(file,JSON.stringify([...old.filter(r=>!records.some(n=>n.id===r.id)),...records],null,2)+'\n');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
