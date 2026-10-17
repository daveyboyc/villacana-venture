// Render the game from where reference photos were taken, to compare by eye.
//   node scripts/review_door_sills.cjs IMG_2260 IMG_2283 --details [--root=/baseline/worktree] [--out=docs/reviews/door-sills/before]
// Stands the player at each photo's camera pin, facing its compass heading, and writes
// layout-checks.local/views/<photo>.png. The game camera is third-person at walking height,
// so a roof or upper-floor photo is matched in position and direction only (use --high to
// look down from above instead). GPS pins are good to a few metres.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--")), photos = args.filter((a) => !a.startsWith("--"));
  const root=path.resolve((flags.find(f=>f.startsWith("--root="))??"--root=.").slice(7));
  const pool = (flags.find((f) => f.startsWith("--pool=")) ?? "--pool=north,middle,south,main").slice(7);
  const manifest = JSON.parse(fs.readFileSync(path.join(root,"public/photos-ref/manifest.json"), "utf8"));
  // Aim at the photo's subject point when the catalogue has one (refs/catalog.json, looksAt).
  const catalog = fs.existsSync(path.join(root,"refs/catalog.json")) ? JSON.parse(fs.readFileSync(path.join(root,"refs/catalog.json"), "utf8")) : [];
  const subject = (file) => catalog.find((e) => e.id === file)?.looksAt;
  // Explicit estimated cameras supplement the fixed source-pin comparisons.
  const featureViews={
    "feature-south-approach":{file:"feature-south-approach.jpg",x:-121,z:218.4,look:[-116.2,215.5],eye:[-123,4.5,221],target:[-118,1,217]},
    "feature-dali-bands":{file:"feature-dali-bands.jpg",x:-170,z:136,look:[-163,135],eye:[-168.5,4.5,138],target:[-163,1.2,135]},
    "feature-elena-sills":{file:"feature-elena-sills.jpg",x:-153,z:74,look:[-146.7,70.7],eye:[-143.5,8.5,72],target:[-146.7,1.2,70.7]},
  };
  const turn = (JSON.parse(fs.readFileSync(path.join(root,"public/map/skeleton.json"), "utf8")).viewRotation * Math.PI) / 180;
  const turned = (x, z) => `${(x * Math.cos(turn) - z * Math.sin(turn)).toFixed(2)},${(x * Math.sin(turn) + z * Math.cos(turn)).toFixed(2)}`;
  const { createServer } = await import("vite");
  const server = await createServer({root, plugins:[{name:"review-scene-ready",transform(code,id){if(id.endsWith("/src/slice.ts")){const marker="renderer.render(scene, camera);";if(!code.includes(marker))throw Error("Scene render readiness hook missing");const viewHook='const reviewEye=new URLSearchParams(location.search).get("reviewEye"),reviewTarget=new URLSearchParams(location.search).get("reviewTarget");if(reviewEye&&reviewTarget){const a=reviewEye.split(",").map(Number),b=reviewTarget.split(",").map(Number);camera.position.set(a[0],a[1],a[2]);camera.lookAt(b[0],b[1],b[2]);camera.updateMatrixWorld(true);}';return code.replace(/addDoorSills\(scene,\s*!layoutOnly\);/,"addDoorSills(scene,true);").replace(marker,viewHook+marker+'renderer.domElement.dataset.sceneReady="true";renderer.domElement.dataset.reviewFeatureCount=String(scene.children.filter(o=>o.userData.doorSillFeature).length);');}}}], server: { host: "127.0.0.1", port: 20000 + Math.floor(Math.random() * 20000), strictPort: false }, logLevel: "error" });
  await server.listen();
  const site = "http://127.0.0.1:" + server.httpServer.address().port, out = (flags.find(f=>f.startsWith("--out="))??"--out=layout-checks.local/views").slice(6);
  fs.mkdirSync(out, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
  for (const name of photos) {
    const photo = featureViews[name]??manifest.find((p) => p.file === name || p.file === name + ".jpg");
    if (!photo || photo.x === undefined) { console.log(name, "no camera pin"); continue; }
    const h = ((photo.heading ?? 0) * Math.PI) / 180;
    const look = photo.look??subject(photo.file) ?? [photo.x + Math.sin(h) * 12, photo.z - Math.cos(h) * 12];
    const extraView=featureViews[name]?`&reviewEye=${photo.eye.join(",")}&reviewTarget=${photo.target.join(",")}`:"";
    const query = `pool=${pool}&at=${turned(photo.x, photo.z)}&look=${turned(look[0], look[1])}${flags.includes("--details")&&!featureViews[name] ? "&details=1" : ""}${extraView}`;
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } }), errors = [];
    await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>setTimeout(()=>cb(t),1000));});
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(site + "/slice.html?" + query);
    await page.waitForSelector('canvas[data-scene-ready="true"]',{timeout:180000});
    const featureCount=await page.locator("canvas").getAttribute("data-review-feature-count");
    if(featureViews[name]&&root===process.cwd()&&Number(featureCount)<100)throw Error("New feature Details isolation hook did not render all meshes: "+featureCount);
    await page.waitForTimeout(6000);
    if (flags.includes("--high")) {
      await page.mouse.move(600, 450); await page.mouse.down(); await page.mouse.move(600, 700, { steps: 10 }); await page.mouse.up();
      for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 100);
    }
    await page.waitForTimeout(2000);
    await page.evaluate(()=>{const c=document.querySelector("canvas"),gl=c.getContext("webgl2")??c.getContext("webgl");gl?.finish();});
    const file = path.join(out, photo.file.replace(/\.jpg$/, ".png"));
    await page.screenshot({ path: file, timeout: 180000 });
    console.log(file, query,"feature meshes="+featureCount,featureViews[name]?"isolated Layout + new feature Details":"source pin", errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    await page.close();
  }
  } finally { await browser.close(); await server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
