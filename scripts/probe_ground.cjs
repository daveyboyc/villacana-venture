// Name the surfaces under given points: casts a ray straight down at each world x,z and lists every mesh
// it meets, top first, with its height and the names of it and its parents. For finding which module
// draws a stray surface seen in Inspect.
//   node scripts/probe_ground.cjs x,z [x,z ...] [--pool=main] [--details]
const { chromium } = require("playwright");
(async () => {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--")), pts = args.filter((a) => !a.startsWith("--")).map((p) => p.split(",").map(Number));
  const pool = (flags.find((f) => f.startsWith("--pool=")) ?? "--pool=main").slice(7);
  const { createServer } = await import("vite");
  const server = await createServer({ cacheDir: `node_modules/.vite-probe-${process.pid}`, server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "error" });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=${pool}&view=overview&debugScene=1&batch=0${flags.includes("--details") ? "&details=1" : ""}`);
    await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true" && window.villacanaScene, null, { timeout: 300000 });
    const threeUrl = await page.evaluate(() => [...document.scripts].map((s) => s.src).find(Boolean));
    const out = await page.evaluate(async (pts) => {
      const scene = window.villacanaScene;
      const THREE = await import("/node_modules/.vite/deps/three.js").catch(() => null);
      const name = (o) => { const n = []; for (let p = o; p; p = p.parent) if (p.name) n.push(p.name); return n.join(" < ") || `${o.type}#${o.id}`; };
      scene.updateMatrixWorld(true);
      const R = THREE ? new THREE.Raycaster() : null;
      return pts.map(([x, z]) => {
        R.set(new THREE.Vector3(x, 60, z), new THREE.Vector3(0, -1, 0)); R.far = 120;
        const hits = R.intersectObjects(scene.children, true).filter((h) => h.object.visible && h.object.isMesh);
        return { at: [x, z], hits: hits.slice(0, 6).map((h) => ({ y: +h.point.y.toFixed(2), mesh: name(h.object), material: h.object.material?.color?.getHexString?.() })) };
      });
    }, pts);
    for (const p of out) { console.log(p.at.join(",")); for (const h of p.hits) console.log("   ", h.y, h.mesh, h.material ?? ""); }
  } finally { await browser.close(); await server.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
