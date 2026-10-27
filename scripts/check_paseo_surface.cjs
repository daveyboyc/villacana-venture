// Compare the actual seaside renderer with a pinned pre-change implementation.
// Saves a material atlas and a geometry/UV diagnostic, not placement approval.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
(async () => {
  const baseline = 'src/paseo-baseline.local.ts';
  const revision = process.argv[2] || '8b5e1f8';
  fs.writeFileSync(baseline, execFileSync('git', ['show', `${revision}:src/seaside.ts`]));
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 20000 + Math.floor(Math.random() * 20000), strictPort: false }, logLevel: 'error' });
  server.middlewares.use('/surface-review', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Surface diagnostic</title>'); });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/surface-review`);
    const result = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const current = await import('/src/seaside.ts'), old = await import('/src/paseo-baseline.local.ts');
      const sf = (await (await fetch('/map/skeleton.json')).json()).seafront;
      const scenes = [new THREE.Scene(), new THREE.Scene()];
      const seaside = current.makeSeaside(sf, 0);
      old.addSeaside(scenes[0], sf, seaside, { x: 0, z: 100 }, 250, () => 3);
      current.addSeaside(scenes[1], sf, seaside, { x: 0, z: 100 }, 250, () => 3);
      const a = scenes[0].children, b = scenes[1].children;
      if (a.length !== b.length) throw Error('Mesh count changed');
      const compared = a.map((m, i) => {
        for (const key of ['position', 'normal']) {
          const x = m.geometry.attributes[key].array, y = b[i].geometry.attributes[key].array;
          if (x.length !== y.length || x.some((v, j) => v !== y[j])) throw Error(`${key} geometry changed`);
        }
        return m.geometry.attributes.position.count;
      });
      const walk = b.find(m => m.name === 'paseo-stamped-walk');
      const material = walk.material[1];
      if (!material.map || !walk.geometry.attributes.uv) throw Error('Surface absent');
      const uv = walk.geometry.attributes.uv.array; let joins = 0;
      for (let i = 12; i < uv.length; i += 12) {
        if (Math.abs(uv[i + 1] - uv[i - 7]) > 1e-5) throw Error('UV phase reset');
        joins++;
      }
      const groups = walk.geometry.groups;
      if (!groups.some(g => g.materialIndex === 0) || !groups.some(g => g.materialIndex === 1)) throw Error('Finish must be bounded');
      return { comparedVertexCounts: compared, unchangedPositionsAndNormals: true, continuousUvJoins: joins,
        stampedSegments: groups.filter(g => g.materialIndex === 1).reduce((n, g) => n + g.count / 6, 0),
        retainedOriginalSegments: groups.filter(g => g.materialIndex === 0).reduce((n, g) => n + g.count / 6, 0),
        texture: material.map.image.toDataURL('image/png') };
    });
    const out = 'docs/reviews/paseo-stamped-surface'; fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(`${out}/surface-atlas.png`, Buffer.from(result.texture.split(',')[1], 'base64')); delete result.texture;
    result.baseline = revision;
    fs.writeFileSync(`${out}/geometry-comparison.json`, JSON.stringify(result, null, 2) + '\n');
    console.log(result);
  } finally {
    if (browser) await browser.close();
    await server.close(); fs.unlinkSync(baseline);
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
