const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({cacheDir:`node_modules/.vite-elena-${process.pid}`,server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?view=map`);await page.waitForSelector('[data-elena-paving]');
  const threeUrl='/'+require('node:path').relative(process.cwd(),server.config.cacheDir).replaceAll('\\','/')+'/deps/three.js';
  const result=await page.evaluate(async(threeUrl)=>{
   const paving=await import('/src/elena-lane-paving.ts');const THREE=await import(threeUrl);
   for(const angle of [0,.37,1.04,Math.PI/2]){
    const t=[Math.cos(angle),Math.sin(angle)],n=[-t[1],t[0]],a=[-10,12],road={id:'elena-north',width:1.2,points:[a,[a[0]+t[0]*20,a[1]+t[1]*20]]};
    const values=[0,1,2].map(col=>{const c=((col+.5)/3-.5)*road.width;return paving.elenaPavingUv(road,a[0]+t[0]*7+n[0]*c,a[1]+t[1]*7+n[1]*c);});
    if(values.some((uv,i)=>Math.abs(uv[0]-(i+.5)/3)>1e-6||Math.abs(uv[1]-values[0][1])>1e-6))throw Error('Grid not aligned to rotated path');
    const one=paving.elenaPavingUv(road,a[0]+t[0]*7,a[1]+t[1]*7),two=paving.elenaPavingUv(road,a[0]+t[0]*7.4,a[1]+t[1]*7.4);
    if(Math.abs(two[1]-one[1]-1/3)>1e-6)throw Error('Tile pitch differs along/across');
   }
   if(paving.elenaPavingFor({id:'silvia-north'})||paving.elenaPavingFor({id:'cervantes'}))throw Error('Local correction leaked to other streets');
   const canvas=paving.elenaPavingTexture().image,g=canvas.getContext('2d'),unit=canvas.width/3;
   for(const x of [0,unit,unit*2,canvas.width-1]){const p=g.getImageData(x,unit/2,1,1).data;if(p[0]-p[1]>=20)throw Error('Missing three-column grout boundary');}
   const geometry=new THREE.PlaneGeometry(1,1);const original=Array.from(geometry.getAttribute('position').array);paving.applyElenaPavingUv(geometry,{points:[[0,0],[4,2]],width:1.2});
   if(original.some((v,i)=>v!==geometry.getAttribute('position').array[i]))throw Error('Material correction moved geometry');
   const scene=new THREE.Scene();scene.userData.layoutOnly=true;const elena=await import('/src/elena-north.ts');elena.addElenaNorth(scene);const model=await fetch('/map/skeleton.json').then(r=>r.json());const lane=model.boundaryReference.roads.find(r=>r.id==='elena-north');const spur=scene.getObjectByName(elena.elenaGardenPath.id),positions=spur.geometry.getAttribute('position'),uvs=spur.geometry.getAttribute('uv');
   for(let i=0;i<positions.count;i++){const expected=paving.elenaPavingUv(lane,positions.getX(i),positions.getZ(i));if(Math.abs(expected[0]-uvs.getX(i))>1e-4||Math.abs(expected[1]-uvs.getY(i))>1e-4)throw Error('Garden spur joints reset from lane phase');}
   const frontages=await import('/src/frontages.ts'),frontageScene=new THREE.Scene();frontageScene.userData.layoutOnly=true;frontages.addFrontageDivisions(frontageScene);
   const crossPath=frontageScene.getObjectByName('cervantes-lawn-door-path'),south=model.boundaryReference.roads.find(r=>r.id==='elena-south'),crossPositions=crossPath.geometry.getAttribute('position'),crossUv=crossPath.geometry.getAttribute('uv');
   for(let i=0;i<crossPositions.count;i++){const expected=paving.elenaPavingUv(south,crossPositions.getX(i),crossPositions.getZ(i));if(Math.abs(expected[0]-crossUv.getX(i))>1e-4||Math.abs(expected[1]-crossUv.getY(i))>1e-4)throw Error('South cross-lawn path resets tile orientation or phase');}
   if(crossPath.material.map!==paving.elenaPavingTexture()||crossPath.material.color.getHexString()!=='ffffff')throw Error('South cross-lawn path uses a different tile field');
   return {rotationCases:4,columns:3,geometryUnchanged:true};
  },threeUrl);
  assert.equal(result.columns,3);assert.ok(await page.locator('[data-elena-paving="elena-north"]').count()>2);assert.ok(await page.locator('[data-elena-paving="elena-south"]').count()>2);
  assert.match(await page.locator('[data-frontage-id="cervantes-lawn-door-path"]').getAttribute('fill'),/elena-south-spur-grid/);
  console.log('Elena three-column grout, path-relative rotation, square pitch, unchanged positions and canonical map joints PASS');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
