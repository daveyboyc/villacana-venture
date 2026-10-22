// Reproducible close view through the actual app, using its existing camera controls.
// REVIEW_ROOT selects a baseline checkout; --as=before|after writes a paired artifact.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const root = process.env.REVIEW_ROOT || process.cwd();
  const label = process.argv.find(a => a.startsWith('--as='))?.slice(5) || 'after';
  if (!['before','after'].includes(label)) throw Error('Use --as=before|after');
  const gate = JSON.parse(fs.readFileSync(path.join(root,'data/middle_pool_south_gate.json')));
  const skeleton = JSON.parse(fs.readFileSync(path.join(root,'public/map/skeleton.json')));
  const at = (a,c) => [gate.center[0]+gate.forward[0]*a-gate.forward[1]*c,gate.center[1]+gate.forward[1]*a+gate.forward[0]*c];
  const turn = skeleton.viewRotation*Math.PI/180;
  const rotated = ([x,z]) => `${x*Math.cos(turn)-z*Math.sin(turn)},${x*Math.sin(turn)+z*Math.cos(turn)}`;
  const query = `pool=middle&at=${rotated(at(2,0))}&look=${rotated(at(8.5,1.5))}&details=1`;
  const { createServer } = await import('vite');
  const server = await createServer({ root, server:{host:'127.0.0.1',port:0},logLevel:'error' });
  await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:900}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?${query}`);
    await page.waitForTimeout(6500);
    await page.mouse.move(600,450);await page.mouse.wheel(0,-1200);await page.waitForTimeout(1200);
    await page.mouse.down();await page.mouse.move(600,360,{steps:6});await page.mouse.up();
    await page.waitForTimeout(1800);
    const out=path.join(process.cwd(),'docs/reviews/middle-pool-south-lane-planters');fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,`lane-close-${label}.png`)});
    console.log(JSON.stringify({label,query,viewport:[1200,900],controls:'wheel -1200, drag [600,450] to [600,360]',errors}));
    if(errors.length)throw Error(errors.join('; '));
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
