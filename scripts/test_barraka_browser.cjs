// Tests actual THREE geometry in both modes and rejects furniture by its full envelope.
const { chromium } = require('playwright');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({cacheDir:`node_modules/.vite-barraka-${process.pid}`,server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'}); await server.listen();
  const threeUrl='/'+require('node:path').relative(process.cwd(),server.config.cacheDir).replaceAll('\\','/')+'/deps/three.js';
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/blueprint.html`);
    await page.waitForSelector('#paseo-wall');
    const result = await page.evaluate(async (threeUrl) => {
      const THREE = await import(threeUrl);
      const {addBarrakaBoardwalk,barrakaAccess,barrakaSign} = await import('/src/barraka-boardwalk.ts');
      const {makeSeaside} = await import('/src/seaside.ts');
      const s = await (await fetch('/map/skeleton.json')).json(), seaside = makeSeaside(s.seafront,s.viewRotation);
      const make = (layoutOnly, protectedRoutes=[]) => {const scene = new THREE.Scene();scene.userData={layoutOnly,protectedRoutes};addBarrakaBoardwalk(scene,(x,z)=>seaside.y(x,z));return scene;};
      const layout=make(true),details=make(false),blocked=make(false,[{id:'blocked',name:'test clearance',points:[[10,120],[50,150]],width:100}]);
      if(layout.getObjectByName('barraka-details'))throw Error('Layout contains furniture');
      if(details.getObjectByName('barraka-details').children.length!==4)throw Error('Expected one sign and three guarded parasol/bed groups');
      if(blocked.getObjectByName('barraka-details').children.length)throw Error('Visible furniture envelope not guarded');
      const sign=details.getObjectByName('barraka-sign-planter');
      const direction=new THREE.Vector3(barrakaAccess.points[1][0]-barrakaAccess.points[0][0],0,barrakaAccess.points[1][1]-barrakaAccess.points[0][1]).normalize();
      const face=new THREE.Vector3(0,0,1).applyQuaternion(sign.quaternion);
      const width=new THREE.Vector3(1,0,0).applyQuaternion(sign.quaternion);
      if(face.dot(direction)>-.99 || Math.abs(width.dot(direction))>.02)throw Error('Lettered face must look inland across the aisle, not along its side');
      const marker=document.querySelector('#barraka-sign-planter-marker');
      if(Number(marker.getAttribute('cx'))!==sign.position.x || Number(marker.getAttribute('cy'))!==sign.position.z)throw Error('Map sign marker and actual Details group disagree');
      if(sign.position.x!==barrakaSign.point[0]||sign.position.z!==barrakaSign.point[1])throw Error('Shared sign anchor disagreement');
      let vertices=0;
      layout.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const gap=p.getY(i)-seaside.y(p.getX(i),p.getZ(i));if(Math.abs(gap-.065)>.001)throw Error('Plank does not follow existing ground');vertices++;}});
      if(vertices<300)throw Error('Missing timber access geometry');
      if(!layout.getObjectByName('barraka-boardwalk').userData.noDrape)throw Error('Ground-following geometry will be draped twice');
      // The roped lounge garden and the painted crossing (data/barraka_frontage.json): Details only, guarded, flush where painted.
      const {addBarrakaFrontage,loungeCentre,crossingAt} = await import('/src/barraka-frontage.ts');
      const paseoRoute={id:'paseo-test',name:'paseo',points:s.seafront.paseo.points,width:s.seafront.paseo.width};
      const front=(layoutOnly,protectedRoutes)=>{const scene=new THREE.Scene();scene.userData={layoutOnly,protectedRoutes};addBarrakaFrontage(scene,(x,z)=>seaside.y(x,z));return scene;};
      if(front(true,[paseoRoute]).getObjectByName('barraka-frontage'))throw Error('Layout contains Barraka furniture');
      const frontage=front(false,[paseoRoute]),count=(name)=>{let n=0;frontage.traverse(o=>{if(o.name===name)n++;});return n;};
      if(count('barraka-lounge-garden-sofa')!==2||count('barraka-lounge-garden-pod')!==4||count('barraka-lounge-garden-parasol')!==1)throw Error('Lounge seating differs from the photographed 2 sofas, 4 pods and one parasol');
      if(count('barraka-lounge-garden-pot')!==3||count('barraka-lounge-garden-menu-stand')!==1||count('barraka-lounge-garden-easel-sign')!==1)throw Error('Lounge props missing');
      const rope=frontage.getObjectByName('barraka-lounge-rope');
      if(rope.children.filter(o=>o.geometry.type==='BoxGeometry').length!==7||rope.children.filter(o=>o.geometry.type==='TubeGeometry').length!==6)throw Error('Rope should have 7 posts and 6 swags');
      const crossing=frontage.getObjectByName('paseo-painted-crossing');
      if(!crossing.userData.flushRouteSurface||crossing.children.length!==8)throw Error('Crossing must be eight flush bars');
      crossing.children.forEach(bar=>{const gap=bar.position.y-seaside.y(bar.position.x,bar.position.z);if(Math.abs(gap-.05)>.001)throw Error('Crossing bar is not flush on the paving');});
      const fullyBlocked=front(false,[{id:'blocked',name:'test clearance',points:[[-20,100],[60,160]],width:200}]);
      let blockedParts=0;fullyBlocked.traverse(o=>{if(o.name.startsWith('barraka-lounge-garden-'))blockedParts++;});
      if(blockedParts)throw Error('Lounge furniture ignores the route guard');
      if(Math.hypot(loungeCentre[0]-crossingAt[0],loungeCentre[1]-crossingAt[1])<5)throw Error('Anchors unexpectedly overlap');
      return {vertices,width:barrakaAccess.width,details:4,blocked:0,signFacesInland:true,mapMarkerAgrees:true,loungeParts:{sofas:2,pods:4,posts:7},crossingBars:8};
    },threeUrl);
    console.log('Barraka browser PASS',JSON.stringify(result));
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
