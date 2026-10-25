// node scripts/kit_views.cjs <outdir> : Details view of the whole-resort overview and walking views at the middle pool and on Cervantes (desktop and phone), with draw calls and frame time per frame. Frame time under the headless software renderer is only a relative measure.
const { chromium } = require("playwright"); const fs = require("fs"), path = require("path");
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const sk = JSON.parse(fs.readFileSync("public/map/skeleton.json", "utf8")), t = sk.viewRotation * Math.PI / 180;
  const turned = (x, z) => `${(x * Math.cos(t) - z * Math.sin(t)).toFixed(2)},${(x * Math.sin(t) + z * Math.cos(t)).toFixed(2)}`;
  const cerv = sk.boundaryReference.roads.find((r) => /Cervantes/.test(r.name || "")).points;
  const along = (a, b, d) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]; };
  const c0 = along(cerv[0], cerv[1], 30), c1 = along(cerv[0], cerv[1], 60);
  const views = {
    overview: "view=overview",
    "middle-pool": `at=${turned(-128, 106)}&look=${turned(-128, 70)}&camera=first`,
    cervantes: `at=${turned(...c0)}&look=${turned(...c1)}&camera=first`,
    "cervantes-phone": `at=${turned(...c0)}&look=${turned(...c1)}&camera=first`,
  };
  const { createServer } = await import("vite");
  const server = await createServer({ server: { host: "127.0.0.1", port: 30000 + Math.floor(Math.random() * 9000) }, logLevel: "error" });
  await server.listen(); const site = "http://127.0.0.1:" + server.httpServer.address().port;
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const result = {};
  for (const [name, q] of Object.entries(views)) {
    const page = await browser.newPage({ viewport: name.endsWith('-phone') ? { width: 390, height: 844 } : { width: 1280, height: 800 } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.__calls = 0;
      for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) for (const m of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const f = C.prototype[m]; if (!f) continue; C.prototype[m] = function (...a) { window.__calls++; return f.apply(this, a); };
      }
    });
    await page.goto(`${site}/slice.html?pool=north,middle,south,main&details=1&${q}`);
    await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true", null, { timeout: 90000 });
    await page.waitForTimeout(8000);
    const m = await page.evaluate(() => new Promise((done) => { const start = performance.now(), c0 = window.__calls; let frames = 0;
      const tick = () => { frames++; if (performance.now() - start < 5000) requestAnimationFrame(tick); else done({ frames, ms: (performance.now() - start) / frames, calls: (window.__calls - c0) / frames }); }; requestAnimationFrame(tick); }));
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    result[name] = { msPerFrame: +m.ms.toFixed(1), drawCallsPerFrame: Math.round(m.calls), errors };
    console.log(name, JSON.stringify(result[name]));
    await page.close();
  }
  fs.writeFileSync(path.join(out, "perf.json"), JSON.stringify(result, null, 1));
  await browser.close(); await server.close();
})();
