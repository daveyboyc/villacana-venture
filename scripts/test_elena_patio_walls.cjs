const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({cacheDir:`node_modules/.vite-elena-walls-${process.pid}`,server:{host:'127.0.0.1',port:24000+Math.floor(Math.random()*10000),strictPort:false},logLevel:'error'});await server.listen();
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?view=map`);await page.waitForSelector('[data-elena-id="elena-north-patio-divider"]');
  const threeUrl='/'+require('node:path').relative(process.cwd(),server.config.cacheDir).replaceAll('\\','/')+'/deps/three.js';
  const result=await page.evaluate(async(threeUrl)=>{
   const THREE=await import(threeUrl),north=await import('/src/elena-north.ts'),east=await import('/src/elena-east-patios.ts'),terrain=await import('/src/terrain.ts');
   const d=(await import('/data/elena_north.json')).default,e=(await import('/data/elena_east_patios.json')).default;
   const scene=new THREE.Scene();scene.userData.layoutOnly=true;north.addElenaNorth(scene);east.addElenaEastPatios(scene);
   const fixed=scene.children.filter(o=>o.userData.noDrape),original=fixed.map(o=>({position:o.position.toArray(),vertices:Array.from(o.geometry.getAttribute('position').array)}));
   terrain.drapeScene(scene,[]);scene.updateMatrixWorld(true);
   fixed.forEach((o,i)=>{if(o.position.toArray().some((v,k)=>v!==original[i].position[k])||Array.from(o.geometry.getAttribute('position').array).some((v,k)=>v!==original[i].vertices[k]))throw Error('Connected wall was draped twice');});
   const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});const ray=new THREE.Raycaster();
   const samples=[];
   for(const wall of [...d.walls,...e.walls]){
    const a=wall.points[0],b=wall.points.at(-1),p=[a[0]*.63+b[0]*.37,a[1]*.63+b[1]*.37];
    ray.set(new THREE.Vector3(p[0],terrain.siteY(...p)+5,p[1]),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects(meshes.filter(m=>m.name===wall.id),false)[0];
    if(!hit||Math.abs(hit.point.y-terrain.siteY(...p)-wall.height)>.012)throw Error('Wall/coping disconnected from shared ground: '+wall.id);
    samples.push({id:wall.id,relativeTop:hit.point.y-terrain.siteY(...p)});
   }
   const joins=[d.walls[0].points[0],d.walls[0].points[1],d.walls[1].points[0],d.walls[1].points[1],e.walls[0].points[1],d.walls.at(-1).points[0]];
   // Sample either side of the joint, allowing 2mm for Float32 box endpoints.
   // A right-angle butt join occupies three of the four cardinal directions.
   for(const p of joins){let solid=0;for(const [dx,dz]of [[.002,0],[-.002,0],[0,.002],[0,-.002]]){const q=[p[0]+dx,p[1]+dz];ray.set(new THREE.Vector3(q[0],terrain.siteY(...q)+5,q[1]),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(meshes,false)[0];if(hit&&hit.point.y-terrain.siteY(...q)>=1.75)solid++;}if(solid<3)throw Error('Open seam in privacy walls '+JSON.stringify({p,solid}));}
   for(const wall of d.walls)for(const door of wall.doors){
    const a=wall.points[0],b=wall.points[1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),n=[-(b[1]-a[1])/l,(b[0]-a[0])/l];
    ray.set(new THREE.Vector3(door.at[0]+n[0],terrain.siteY(...door.at)+door.height*.55,door.at[1]+n[1]),new THREE.Vector3(-n[0],0,-n[1]));
    const hit=ray.intersectObjects(meshes,false)[0];if(hit?.object.name!=='elena-timber-door')throw Error('Timber door buried in wall');
   }
   const patio=scene.getObjectByName(d.frontPatioFloor.id);if(!patio?.userData.noDrape)throw Error('Visible patio floor missing or draped twice');
   const delta=d.walls[0].height-1.15;if(delta<.5||d.walls[0].doors[0].height<1.7)throw Error('Privacy wall/door still waist high');
   return {samples,joinedVertices:joins.length,doorsVisible:true,sharedGroundAppliedOnce:true,visiblePatioFloor:true};
  },threeUrl);
  assert.equal(result.joinedVertices,6);assert.ok(result.doorsVisible);assert.match(await page.locator('[data-elena-id="elena-north-visible-patio-floor"]').getAttribute('fill'),/url/);
  fs.mkdirSync('docs/reviews/elena-patio-wall-correction',{recursive:true});fs.writeFileSync('docs/reviews/elena-patio-wall-correction/mesh-checks.json',JSON.stringify(result,null,2)+'\n');
  console.log('Elena shared-ground wall tops, six joins, visible full-height doors, bounded patio and map grid PASS');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
