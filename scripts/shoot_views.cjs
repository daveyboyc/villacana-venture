// Render the game from where reference photos were taken, to compare by eye.
//   node scripts/shoot_views.cjs IMG_2365 IMG_2286 [--pool=north,middle] [--details] [--high] [--pose [--initial]] [--task=<id> --as=before|after]
//   node scripts/shoot_views.cjs --model     only writes layout-checks.local/model.json (scripts/lidar_check.py)
//   node scripts/shoot_views.cjs --kit       only writes layout-checks.local/kit.json, the facade kit as placed (scripts/build_scorecard.py)
// Stands the player at each photo's camera pin, facing its compass heading, and writes
// layout-checks.local/views/<photo>.png. The game camera is third-person at walking height,
// so a roof or upper-floor photo is matched in position and direction only (use --high to
// look down from above instead). GPS pins are good to a few metres.
// With --task and --as the render is also saved as docs/reviews/<task>/<photo>-<as>.png, the path a
// data/photo_checks.json record points at. Set the photo's looksAt (data/reference_tags.json) first:
// without it the view follows the phone compass from the raw pin, which can face the wrong way.
// --pose looks through the photo's camera in data/photo_poses.json instead (solved, or with --initial
// its starting pose) at the photo's own size, so the render lines up with the photo pixel for pixel,
// and writes layout-checks.local/model.json for scripts/photo_pose.py. See docs/PHOTO_ALIGNMENT.md.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--")), photos = args.filter((a) => !a.startsWith("--"));
  const pool = (flags.find((f) => f.startsWith("--pool=")) ?? "--pool=north,middle,south,main").slice(7);
  const manifest = JSON.parse(fs.readFileSync("public/photos-ref/manifest.json", "utf8"));
  // Aim at the photo's subject point when the catalogue has one (refs/catalog.json, looksAt).
  const catalog = fs.existsSync("refs/catalog.json") ? JSON.parse(fs.readFileSync("refs/catalog.json", "utf8")) : [];
  const entry = (file) => catalog.find((e) => e.id === file);
  const subject = (file) => entry(file)?.looksAt;
  const task = flags.find((f) => f.startsWith("--task="))?.slice(7), as = flags.find((f) => f.startsWith("--as="))?.slice(5);
  if ((task || as) && !(task && ["before", "after"].includes(as))) throw new Error("--task=<id> needs --as=before or --as=after");
  const poses = JSON.parse(fs.readFileSync("data/photo_poses.json", "utf8")).photos;
  const turn = (JSON.parse(fs.readFileSync("public/map/skeleton.json", "utf8")).viewRotation * Math.PI) / 180;
  const turned = (x, z) => `${(x * Math.cos(turn) - z * Math.sin(turn)).toFixed(2)},${(x * Math.sin(turn) + z * Math.cos(turn)).toFixed(2)}`;
  const { createServer } = await import("vite");
  const server = await createServer({ server: { host: "127.0.0.1", port: 20000 + Math.floor(Math.random() * 20000), strictPort: false }, logLevel: "error" });
  await server.listen();
  const site = "http://127.0.0.1:" + server.httpServer.address().port, out = path.join("layout-checks.local", "views");
  fs.mkdirSync(out, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  if (flags.includes("--model")) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${site}/slice.html?pool=${pool}&export=model`);
    try { await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true", null, { timeout: 60000 }); }
    catch (error) { throw new Error(`the scene did not finish loading. ${errors.join(" | ")}`); }
    fs.writeFileSync(path.join("layout-checks.local", "model.json"), JSON.stringify(await page.evaluate(() => window.villacanaModel)));
    console.log("layout-checks.local/model.json", errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    await page.close();
  }
  if (flags.includes("--kit")) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${site}/slice.html?pool=${pool}&details=1&export=kit`);
    try { await page.waitForFunction(() => window.villacanaKit, null, { timeout: 120000 }); }
    catch (error) { throw new Error(`the facade kit did not finish loading. ${errors.join(" | ")}`); }
    fs.writeFileSync(path.join("layout-checks.local", "kit.json"), JSON.stringify(await page.evaluate(() => window.villacanaKit)));
    console.log("layout-checks.local/kit.json", errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    await page.close();
  }
  for (const name of photos) {
    const photo = manifest.find((p) => p.file === name || p.file === name + ".jpg");
    if (!photo || photo.x === undefined) { console.log(name, "no camera pin"); continue; }
    if (flags.includes("--pose")) {
      const record = poses[photo.file];
      if (!record) { console.log(name, "no camera in data/photo_poses.json: run python3 scripts/photo_pose.py init", name); continue; }
      if (!record.solved && !flags.includes("--initial")) console.log(name, "WARNING: not solved yet; rendering its starting pose");
      const page = await browser.newPage({ viewport: { width: record.image[0], height: record.image[1] } }), errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${site}/slice.html?pool=${pool}&photocam=${photo.file}&overlay=0&ao=1${flags.includes("--initial") ? "&pose=initial" : ""}${flags.includes("--details") ? "&details=1" : ""}`);
      try { await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true", null, { timeout: 60000 }); }
      catch (error) { throw new Error(`${name}: the scene did not finish loading. ${errors.join(" | ")}`); }
      await page.waitForTimeout(3000);
      fs.writeFileSync(path.join("layout-checks.local", "model.json"), JSON.stringify(await page.evaluate(() => window.villacanaModel)));
      const file = path.join(out, photo.file.replace(/\.jpg$/, ".png"));
      await page.screenshot({ path: file });
      if (task) { const dir = path.join("docs", "reviews", task); fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(file, path.join(dir, photo.file.replace(/\.jpg$/, `-${as}.png`))); }
      console.log(file, record.solved && !flags.includes("--initial") ? "solved camera" : "starting pose", errors.length ? "ERRORS " + errors.join(" | ") : "ok");
      await page.close();
      continue;
    }
    if (entry(photo.file)?.looksAtBasis !== "reviewed") console.log(name, "WARNING: no reviewed looksAt; aiming along the phone heading from the pin. Set looksAt/subject in data/reference_tags.json and rebuild refs before recording a photo check.");
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
    if (task) { const dir = path.join("docs", "reviews", task); fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(file, path.join(dir, photo.file.replace(/\.jpg$/, `-${as}.png`))); }
    console.log(file, query, errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    await page.close();
  }
  await browser.close();
  await server.close();
})();
