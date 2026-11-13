// Render Inspect (Layout, or Show details with --details) from a fixed orbit camera, to check a build
// without switching to Walk. Coordinates are turned-frame metres, as the game uses.
//   node scripts/shoot_inspect.cjs <name> <x,z,distance,pitchDeg,bearingDeg> [<name> <x,z,...> ...] [--details] [--both] [--pool=main] [--out=dir] [--size=1600x1000]
// --both renders each view in Layout and with Show details.
// Writes <out>/<name>-layout.png or <name>-details.png (default out: layout-checks.local/inspect).
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--")), rest = args.filter((a) => !a.startsWith("--"));
  if (rest.length < 2 || rest.length % 2) throw new Error("usage: shoot_inspect.cjs <name> <x,z,distance,pitchDeg,bearingDeg> [--details]");
  const flag = (k, d) => flags.find((f) => f.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
  const pool = flag("pool", "north,middle,south,main"), out = flag("out", path.join("layout-checks.local", "inspect"));
  const [w, h] = flag("size", "1600x1000").split("x").map(Number), modes = flags.includes("--both") ? [false, true] : [flags.includes("--details")];
  const { createServer } = await import("vite");
  const server = await createServer({ cacheDir: `node_modules/.vite-inspect-${process.pid}`, server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "error" });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    fs.mkdirSync(out, { recursive: true });
    for (const details of modes) for (let i = 0; i < rest.length; i += 2) {
      const [name, at] = [rest[i], rest[i + 1]];
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/slice.html?pool=${pool}&view=overview&inspect=${at}${details ? "&details=1" : ""}`, { timeout: 180000 });
      await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true", null, { timeout: 300000 });
      await page.addStyleTag({ content: "body > *:not(canvas):not(#scene):not(:has(#scene)){visibility:hidden !important}" });
      await page.waitForTimeout(1500);
      const file = path.join(out, `${name}-${details ? "details" : "layout"}.png`);
      await page.screenshot({ path: file, timeout: 120000 });
      console.log(file, errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    }
  } finally { await browser.close(); await server.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
