// Render the game from where reference photos were taken, to compare by eye.
//   node scripts/shoot_views.cjs IMG_2365 IMG_2286 [--pool=north,middle] [--details] [--high]
// Stands the player at each photo's camera pin, facing its compass heading, and writes
// layout-checks.local/views/<photo>.png. The game camera is third-person at walking height,
// so a roof or upper-floor photo is matched in position and direction only (use --high to
// look down from above instead). GPS pins are good to a few metres.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--")), photos = args.filter((a) => !a.startsWith("--"));
  const pool = (flags.find((f) => f.startsWith("--pool=")) ?? "--pool=north,middle,south,main").slice(7);
  const manifest = JSON.parse(fs.readFileSync("public/photos-ref/manifest.json", "utf8"));
  // Aim at the photo's subject point when the catalogue has one (refs/catalog.json, looksAt).
  const catalog = fs.existsSync("refs/catalog.json") ? JSON.parse(fs.readFileSync("refs/catalog.json", "utf8")) : [];
  const subject = (file) => catalog.find((e) => e.id === file)?.looksAt;
  const turn = (JSON.parse(fs.readFileSync("public/map/skeleton.json", "utf8")).viewRotation * Math.PI) / 180;
  const turned = (x, z) => `${(x * Math.cos(turn) - z * Math.sin(turn)).toFixed(2)},${(x * Math.sin(turn) + z * Math.cos(turn)).toFixed(2)}`;
  const { createServer } = await import("vite");
  const server = await createServer({ server: { host: "127.0.0.1", port: 20000 + Math.floor(Math.random() * 20000), strictPort: false }, logLevel: "error" });
  await server.listen();
  const site = "http://127.0.0.1:" + server.httpServer.address().port, out = path.join("layout-checks.local", "views");
  fs.mkdirSync(out, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const name of photos) {
    const photo = manifest.find((p) => p.file === name || p.file === name + ".jpg");
    if (!photo || photo.x === undefined) { console.log(name, "no camera pin"); continue; }
    const h = ((photo.heading ?? 0) * Math.PI) / 180;
    const look = subject(photo.file) ?? [photo.x + Math.sin(h) * 12, photo.z - Math.cos(h) * 12];
    const query = `pool=${pool}&at=${turned(photo.x, photo.z)}&look=${turned(look[0], look[1])}${flags.includes("--details") ? "&details=1" : ""}`;
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(site + "/slice.html?" + query);
    await page.waitForTimeout(6000);
    if (flags.includes("--high")) {
      await page.mouse.move(600, 450); await page.mouse.down(); await page.mouse.move(600, 700, { steps: 10 }); await page.mouse.up();
      for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 100);
    }
    await page.waitForTimeout(2000);
    const file = path.join(out, photo.file.replace(/\.jpg$/, ".png"));
    await page.screenshot({ path: file });
    console.log(file, query, errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    await page.close();
  }
  await browser.close();
  await server.close();
})();
