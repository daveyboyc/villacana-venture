const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});await server.listen();
  const url='http://127.0.0.1:'+server.httpServer.address().port;
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const dir='docs/reviews/north-pool-shotgun';fs.mkdirSync(dir,{recursive:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[];page.setDefaultTimeout(240000);page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url+'/?view=fps&place=silvia&camera=third&at=0,0');
    const frame=page.frameLocator('#resort-scene'),canvas=frame.locator('#scene'),hud=frame.locator('#shotgun-hud');
    await frame.locator('#scene[data-ready=true]').waitFor();console.log('North pool ready');
    assert.equal(await canvas.getAttribute('data-camera-view'),'first');
    const src=new URL(await page.locator('#resort-scene').getAttribute('src'));
    assert.equal(src.searchParams.get('pool'),'north');assert.equal(src.searchParams.get('view'),'walk');assert.equal(src.searchParams.has('place'),false);assert.equal(src.searchParams.has('at'),false);
    assert.equal(await hud.getAttribute('data-shots'),'0');
    await frame.locator('#sg-start').tap();
    assert.equal(await hud.getAttribute('data-state'),'playing');
    await page.screenshot({path:dir+'/mobile-play.png'});
    // Actual multitouch: hold the joystick, turn with another finger, fire without releasing the first.
    const cdp=await context.newCDPSession(page);
    const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:2,radiusY:2,force:1}))});
    const pad=await frame.locator('#walk-pad').boundingBox(),fire=await frame.locator('#sg-fire').boundingBox();
    const x=pad.x+pad.width/2,y=pad.y+pad.height/2,fx=fire.x+fire.width/2,fy=fire.y+fire.height/2;
    const yaw=Number(await canvas.getAttribute('data-yaw'));
    await touch('touchStart',[[1,x,y]]);await touch('touchMove',[[1,x,y-32]]);
    await touch('touchStart',[[1,x,y-32],[2,275,350]]);await touch('touchMove',[[1,x,y-32],[2,300,350]]);
    await page.waitForFunction(y=>Math.abs(Number(document.querySelector('#resort-scene').contentDocument.querySelector('#scene').dataset.yaw)-y)>.05,yaw);
    await touch('touchEnd',[[1,x,y-32]]);
    await touch('touchStart',[[1,x,y-32],[3,fx,fy]]);
    await page.waitForFunction(()=>document.querySelector('#resort-scene').contentDocument.querySelector('#shotgun-hud').dataset.shots==='1');
    assert.ok(Number((await canvas.getAttribute('data-move')).split(',')[1])>.5,'Fire cancelled joystick');
    await touch('touchEnd',[]);
    await page.waitForFunction(()=>document.querySelector('#resort-scene').contentDocument.querySelector('#scene').dataset.move==='0.00,0.00');
    await frame.locator('#sg-pause').tap();
    const before=await hud.getAttribute('data-shots');
    await canvas.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF'})));
    assert.equal(await hud.getAttribute('data-shots'),before,'Fired while paused');
    await frame.locator('#sg-reset').tap();assert.equal(await hud.getAttribute('data-shots'),'0');assert.equal(await hud.getAttribute('data-hits'),'0');
    await frame.locator('#sg-start').tap();
    // Rapid events within one task must produce only one blast, even before a rendered frame.
    await frame.locator('#sg-fire').evaluate(b=>{for(let i=0;i<6;i++)b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));});
    await page.waitForFunction(()=>document.querySelector('#resort-scene').contentDocument.querySelector('#shotgun-hud').dataset.shots==='1');
    await canvas.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await hud.getAttribute('data-state'),'paused');
    await page.setViewportSize({width:844,height:390});await frame.locator('#sg-start').tap();
    await page.screenshot({path:dir+'/mobile-landscape.png'});
    // The actual hit function stops at opaque cover, including hidden originals used by batching.
    console.log('Mobile movement, firing, pause and reset passed');
    const result=await canvas.evaluate(async()=>{
      const THREE=await import('/node_modules/three/build/three.module.js');
      const {tracePellet,createShotgun}=await import('/src/shotgun.ts');
      const target=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());target.position.z=-6;target.updateMatrixWorld();
      const wall=new THREE.Mesh(new THREE.BoxGeometry(3,3,.3),new THREE.MeshBasicMaterial());wall.position.z=-3;wall.visible=false;wall.updateMatrixWorld();
      const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,0,-1),0,60);
      const occluded=tracePellet(ray,[target],[wall]).object===wall,open=tracePellet(ray,[target],[]).object===target;
      // Exercise target scoring/reset/disposal with a small scene using the same controller.
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(70,1,.1,100),canvas=document.createElement('canvas');camera.position.set(0,1.65,6);camera.lookAt(0,1.65,0);camera.updateMatrixWorld();
      const game=createShotgun({scene,camera,canvas,centre:{x:0,z:0},groundY:()=>0,ignoreObject:new THREE.Group(),available:()=>true,resetInput:()=>{},resetPlayer:()=>{}});
      const testHud=[...document.querySelectorAll('#shotgun-hud')].at(-1);game.update(.01,false);testHud.querySelector('#sg-start').click();
      testHud.querySelector('#sg-fire').dispatchEvent(new PointerEvent('pointerdown'));game.update(.01,false);
      const scored=testHud.dataset.hits==='1'&&testHud.dataset.shots==='1';
      testHud.querySelector('#sg-fire').dispatchEvent(new PointerEvent('pointerdown'));game.update(.01,false);const cooldown=testHud.dataset.shots==='1';
      testHud.querySelector('#sg-reset').click();const reset=testHud.dataset.hits==='0'&&testHud.dataset.shots==='0';
      game.dispose();const disposed=scene.children.length===0&&!testHud.isConnected;
      return {occluded,open,scored,cooldown,reset,disposed};
    });
    assert.deepEqual(result,{occluded:true,open:true,scored:true,cooldown:true,reset:true,disposed:true});
    console.log('Hit, occlusion and disposal checks passed');
    await page.evaluate(()=>{const u=new URL(location.href);u.searchParams.set('details','0');history.replaceState(null,'',u);});
    await page.locator('#view-overview').tap();await frame.locator('#scene[data-camera-view=overview]').waitFor();assert.equal(await frame.locator('#shotgun-hud').count(),0);assert.equal(await canvas.getAttribute('data-camera-view'),'overview');
    await page.locator('#view-map').tap();assert.ok(await page.locator('#map-page').isVisible());
    assert.deepEqual(errors,[]);
    fs.writeFileSync(dir+'/results.json',JSON.stringify({mobile:'390x844 and 844x390 Chromium touch emulation',routing:true,multitouch:true,pause:true,reset:true,rapidFire:true,regression:true,...result,errors},null,2)+'\n');
    console.log('Shotgun mobile, routing, hit/occlusion and lifecycle checks passed.');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
