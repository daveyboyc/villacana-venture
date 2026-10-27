// The area scorecard panel in the game: shown with ?scorecard=1 (automated browsers leave it off
// otherwise), names the area the player stands in at two spots, follows the overview's centre and
// toggles open and closed. Desktop and phone screenshots go to docs/reviews/area-scorecard/.
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node scripts/test_scorecard_browser.cjs
const { chromium, devices } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const { createServer } = await import("vite");
  const server = await createServer({ cacheDir: `node_modules/.vite-check-${process.pid}`, server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "error" });
  await server.listen();
  const site = "http://127.0.0.1:" + server.httpServer.address().port;
  const out = path.join("docs", "reviews", "area-scorecard");
  fs.mkdirSync(out, { recursive: true });
  const skeleton = JSON.parse(fs.readFileSync("public/map/skeleton.json", "utf8"));
  const turn = (skeleton.viewRotation * Math.PI) / 180;
  const turned = ([x, z]) => `${(x * Math.cos(turn) - z * Math.sin(turn)).toFixed(2)},${(x * Math.sin(turn) + z * Math.cos(turn)).toFixed(2)}`;
  const ring = skeleton.pools.find((p) => p.id === "north").ring;
  const spots = { elena: [-158.8, 41.2], "north-pool": [ring.reduce((s, p) => s + p[0], 0) / ring.length + 9, ring.reduce((s, p) => s + p[1], 0) / ring.length] };
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const failures = [];
  const expect = (ok, message) => { if (!ok) failures.push(message); console.log(ok ? "ok  " : "FAIL", message); };
  const open = async (context, query) => {
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(90000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${site}/slice.html?pool=north,middle,south,main&${query}`);
    await page.waitForFunction(() => document.querySelector("#scene")?.dataset.ready === "true");
    return { page, errors };
  };
  const area = (page) => page.evaluate(() => document.querySelector("#scorecard")?.dataset.area ?? null);
  const waitArea = (page, id) => page.waitForFunction((id) => document.querySelector("#scorecard")?.dataset.area === id, id, { timeout: 15000 }).catch(() => {});

  // Off in automated renders unless asked for.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const { page } = await open(context, `at=${turned(spots.elena)}`);
    expect(!(await page.$("#scorecard")), "no panel in an automated browser without ?scorecard=1");
    await context.close();
  }
  for (const [kind, options] of [["desktop", { viewport: { width: 1280, height: 800 } }], ["phone", { ...devices["iPhone 13"] }]]) {
    for (const [id, spot] of Object.entries(spots)) {
      const context = await browser.newContext(options);
      const { page, errors } = await open(context, `at=${turned(spot)}&look=${turned([spot[0] + 5, spot[1]])}&scorecard=1`);
      await waitArea(page, id);
      expect((await area(page)) === id, `${kind}: standing at ${spot.join(", ")} the panel shows ${id} (got ${await area(page)})`);
      const wasOpen = await page.$eval("#scorecard", (d) => d.open);
      expect(wasOpen === (kind === "desktop"), `${kind}: panel starts ${kind === "desktop" ? "open" : "collapsed"}`);
      if (!wasOpen) await page.click("#scorecard > summary");
      expect(await page.$eval("#scorecard", (d) => d.open && d.querySelector(".body").getBoundingClientRect().height > 40), `${kind}: panel opens with figures`);
      const text = await page.$eval("#scorecard", (d) => d.textContent);
      expect(text.includes("Area brief") && text.includes("Placement:"), `${kind}: panel has the status lines and the brief link`);
      const light = await page.$eval("#scorecard", (d) => d.dataset.light);
      expect(["red", "amber", "green"].includes(light), `${kind}: panel shows the area's colour (${light})`);
      if (light === "red") expect(await page.$$eval("#scorecard ol li .where", (els) => els.length > 0 && els.every((e) => /m (north|south|east|west)|you are here/.test(e.textContent))), `${kind}: red panel lists photo spots with distance and direction`);
      expect(await page.evaluate(() => { const b = document.querySelector("#scorecard > summary").getBoundingClientRect(), j = document.querySelector("#inspection-jump")?.getBoundingClientRect();
        return !j || !j.height || b.top >= j.bottom || b.bottom <= j.top; }), `${kind}: panel header clear of the inspection box`);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(out, `${kind}-${id}.png`) });
      await page.click("#scorecard > summary");
      expect(!(await page.$eval("#scorecard", (d) => d.open)), `${kind}: panel collapses again`);
      if (kind === "desktop" && id === "elena") {
        // The overview's centre (the whole resort) replaces the player's area.
        await page.click("#overview");
        await page.waitForFunction(() => document.querySelector("#scorecard")?.dataset.area !== "elena", null, { timeout: 15000 }).catch(() => {});
        expect((await area(page)) !== "elena", `overview: the panel follows the overview centre (now ${await area(page)})`);
      }
      expect(!errors.length, `${kind} ${id}: no page errors ${errors.join(" | ")}`);
      await context.close();
    }
  }
  await browser.close();
  await server.close();
  fs.rmSync(server.config.cacheDir, { recursive: true, force: true });
  if (failures.length) { console.error(`${failures.length} failed`); process.exit(1); }
  console.log("scorecard browser test passed");
})().catch((error) => { console.error(error); process.exit(1); });
