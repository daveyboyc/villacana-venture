// Fixed estimated camera for the local asphalt/kerb contact correction.
// node scripts/review_threshold_contact.cjs --root=/baseline --out=/output/before.png
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const arg = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
  const root = path.resolve(arg('root', '.'));
  const out = path.resolve(arg('out', 'layout-checks.local/threshold-contact.png'));
  const { createServer } = await import('vite');
  const server = await createServer({root, logLevel:'error', server:{host:'127.0.0.1',port:0}, plugins:[{
    name:'threshold-contact-camera', transform(code,id) {
      if (!id.endsWith('/src/slice.ts')) return;
      const marker = 'renderer.render(scene, camera);';
      if (!code.includes(marker)) throw Error('Missing scene render hook');
      return code.replace(marker, 'camera.position.set(-170,10,157);camera.lookAt(-160,0.7,148);camera.updateMatrixWorld(true);'+marker+'renderer.domElement.dataset.contactReady="true";');
    }
  }]});
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page = await browser.newPage({viewport:{width:1000,height:700}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>setTimeout(()=>cb(t),1000));});
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=middle`);
    await page.waitForSelector('canvas[data-contact-ready="true"]',{timeout:180000});
    await page.evaluate(()=>{const c=document.querySelector('canvas');(c.getContext('webgl2')??c.getContext('webgl'))?.finish();});
    fs.mkdirSync(path.dirname(out),{recursive:true});
    await page.screenshot({path:out,timeout:180000});
    if(errors.length)throw Error(errors.join('\n'));
    console.log(JSON.stringify({out,eye:[-170,10,157],target:[-160,.7,148],errors}));
  } finally {await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
