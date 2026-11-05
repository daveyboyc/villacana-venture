// Render the Silvia 2-20 / 22-44 ramp-passage study from the photo-relative cameras in src/silvia-ramp-study.ts.
//   node scripts/shoot_silvia_ramp.cjs [IMG_2669 ...] [--out=docs/reviews/silvia-ramp-passages] [--suffix=after]
// Uncalibrated study cameras, not solved photo poses: the renders are diagnostics, not a placement measurement.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--"));
  const photos = args.filter((a) => !a.startsWith("--"));
  const list = photos.length ? photos : ["IMG_2669", "IMG_2670", "IMG_2656", "IMG_2657", "IMG_2574"];
  const out = (flags.find((f) => f.startsWith("--out=")) ?? "--out=docs/reviews/silvia-ramp-passages").slice(6);
  const suffix = (flags.find((f) => f.startsWith("--suffix=")) ?? "--suffix=after").slice(9);
  fs.mkdirSync(out, { recursive: true });
  const { createServer } = await import("vite");
  const server = await createServer({ server: { host: "127.0.0.1", port: 20000 + Math.floor(Math.random() * 20000) }, logLevel: "error" });
  await server.listen();
  const site = "http://127.0.0.1:" + server.httpServer.address().port;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const results = [];
  for (const name of list) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${site}/silvia-ramp.html?preset=${name}&shot=1&w=900&h=1200`);
    try { await page.waitForFunction(() => document.querySelector("#scene")?.dataset.studyReady === "true", null, { timeout: 60000 }); }
    catch (e) { throw new Error(`${name}: study did not load. ${errors.join(" | ")}`); }
    const file = path.join(out, `${name}-${suffix}.png`);
    await page.locator("#scene").screenshot({ path: file });
    results.push({ photo: name, file, errors });
    console.log(file, errors.length ? "ERRORS " + errors.join(" | ") : "ok");
    await page.close();
  }
  await browser.close();
  await server.close();
  if (results.some((r) => r.errors.length)) process.exit(1);
})();
