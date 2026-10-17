const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const { createServer } = await import("vite");
  const server = await createServer({ cacheDir: `node_modules/.vite-check-${process.pid}`,
    server: { host: "127.0.0.1", port: 0, strictPort: false },
    logLevel: "error",
  });
  await server.listen();
  const threeUrl = '/' + require('node:path').relative(process.cwd(), server.config.cacheDir).replaceAll('\\', '/') + '/deps/three.js';
  const site = "http://127.0.0.1:" + server.httpServer.address().port;
  const artifacts = path.join(process.cwd(), "layout-checks.local");
  fs.mkdirSync(artifacts, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const b = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } }),
    errors = [];
  p.setDefaultTimeout(90000);
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(site + "/blueprint.html");
  await p.waitForSelector("#coastal-gate-boundary");
  const r = await p.evaluate(async (threeUrl) => {
    const THREE = await import(threeUrl);
    const [
      { Player },
      { Solids, CoastField },
      { barrierRings, referenceGroundHeight },
      { cervantesPatioWallRings },
      { poolGroundY, poolTerraceRing, POOL_TERRACE_ID },
      { siteY, drapeScene, refine },
      { coastalWallRings, coastalAccess, coastalGate, GatedSolids },
      { protectedRoutes, routeClearance },
      { makeSeaside },
      { elenaNorthRings, elenaNorthBeds, gatewayParts },
      { stepsGroundOffset },
      { gardenDoor, gardenPoint, gardenDoorRings, gardenGroundOffset, addCervantesGardenDoor },
      { middlePoolRings, middlePoolPlanter, middleGatewayFrame },
      { middleSwRings, middleSwAt },
      { middleSouthRings, middleSouthAt },
      { raisedTerraces, raisedTerraceRings, raisedTerraceGroundOffset, terraceStairs, terraceFloorY },
    ] = await Promise.all([
      import("/src/player.ts"),
      import("/src/geom.ts"),
      import("/src/boundaries.ts"),
      import("/src/cervantes-walls.ts"),
      import("/src/pool-levels.ts"),
      import("/src/terrain.ts"),
      import("/src/coastal-gate.ts"),
      import("/src/route-clearance.ts"),
      import("/src/seaside.ts"),
      import("/src/elena-north.ts"),
      import("/src/ramp-steps.ts"),
      import("/src/cervantes-garden-door.ts"),
      import("/src/middle-pool.ts"),
      import("/src/middle-pool-sw-gateway.ts"),
      import("/src/middle-pool-south-gate.ts"),
      import("/src/raised-terraces.ts"),
    ]);
    const s = await (await fetch("/map/skeleton.json")).json(),
      map = await (await fetch("/map/villacana.json")).json();
    const buildings = s.buildings.filter((b) => b.floors > 0 && !b.passage);
    const base = new Solids(
      [
        ...buildings.map((b) =>
          b.id === POOL_TERRACE_ID ? poolTerraceRing : b.ring,
        ),
        ...barrierRings(s.boundaryReference.barriers),
        ...cervantesPatioWallRings(),
        ...gardenDoorRings(),
        ...elenaNorthRings(),
        ...(await import("/src/elena-east-patios.ts")).elenaEastPatioRings(),
        ...(await import("/src/cervantes-east-south-patios.ts")).cervantesEastSouthRings(),
        ...middlePoolRings(),
        ...middleSwRings(),
        ...middleSouthRings(),
        ...raisedTerraceRings(),
        ...coastalWallRings(),
      ],
      Object.fromEntries(
        buildings.flatMap((b, i) =>
          b.id === POOL_TERRACE_ID ? [[i, -0.5]] : [],
        ),
      ),
    );
    // Issue #43: the bounded east kerb is visible on the map and solid in the shared rings.
    const eastHedge = await (await fetch("/data/cervantes_east_hedge.json")).json();
    const eastKerb = eastHedge.walls[0], eastCentre = eastKerb.points[0].map((v, i) => (v + eastKerb.points[1][i]) / 2);
    if (!document.querySelector(`[data-wall-id="${eastKerb.id}"]`)) throw Error("Cervantes east kerb missing from map");
    const eastResolved = new Solids(cervantesPatioWallRings()).resolve(...eastCentre, .42);
    if (Math.hypot(eastResolved.x-eastCentre[0],eastResolved.z-eastCentre[1])<.15) throw Error("Cervantes east kerb missing collision");
    let open = true;
    const sd = makeSeaside(s.seafront, s.viewRotation);
    const world = {
      solids: new GatedSolids(base, () => open),
      coast: new CoastField(map.coast, map.landRef),
      pools: s.pools.map((p) => p.ring),
      bounds: map.bounds,
      groundHeight: (x, z) =>
        sd.inZone(x, z)
          ? sd.y(x, z) + 0.06
          : siteY(x, z) +
            stepsGroundOffset(x, z) +
            raisedTerraceGroundOffset(x, z) +
            gardenGroundOffset(x,z,s.boundaryReference) +
            poolGroundY(x, z) +
            referenceGroundHeight(s.boundaryReference, x, z),
      maxGroundStep: 0.45,
      seaLevel: sd.seaY,
    };
    const player = new Player(),
      input = {
        moveX: 0,
        moveZ: 0,
        run: false,
        jump: false,
        lookDx: 0,
        lookDy: 0,
        zoom: 0,
        interact: false,
      };
    let segments = 0;
    const walk = (points) => {
      player.place(...points[0], 0);
      for (let i = 1; i < points.length; i++) {
        const end = points[i];
        let frames = 0;
        while (
          Math.hypot(player.x - end[0], player.z - end[1]) > 0.12 &&
          frames++ < 10000
        )
          player.update(
            1 / 120,
            { ...input, moveZ: 1 },
            world,
            Math.atan2(end[0] - player.x, -(end[1] - player.z)),
          );
        if (frames >= 10000)
          throw Error(
            "Blocked " +
              i +
              " at " +
              player.x +
              "," +
              player.z +
              " goal " +
              end,
          );
        segments++;
      }
    };
    const routes = protectedRoutes(s.boundaryReference, undefined, [
      coastalAccess,
    ]);
    for (const route of routes)
      for (const points of [route.points, [...route.points].reverse()])
        walk(points);
    // Up and down the steps beside the Cervantes ramp and out of the middle pool onto Calle Eva: one riser at a time, ending level with the ramp.
    for (const file of ["/data/cervantes_elena_steps.json", "/data/middle_pool_steps.json", "/data/middle_pool_north.json"]) {
      const { default: data } = await import(file);
      const flight = data.steps ?? data;
      const [fx, fz] = flight.foot, [tx, tz] = flight.toward, len = Math.hypot(tx - fx, tz - fz), ux = (tx - fx) / len, uz = (tz - fz) / len, sx = -uz, sz = ux;
      const across = (flight.across[0] + flight.across[1]) / 2, at = (d) => [fx + ux * d + sx * across, fz + uz * d + sz * across];
      const heights = [];
      for (let d = -0.4; d <= flight.end + 0.3; d += 0.05) heights.push(world.groundHeight(...at(d)));
      const jumps = heights.slice(1).map((h, i) => h - heights[i]).filter((j) => j > 0.05);
      if (jumps.length !== flight.risers.length || jumps.some((j) => j > 0.2)) throw Error(flight.id + ": steps do not rise one shallow riser at a time: " + jumps);
      const rampTop = world.groundHeight(fx + ux * flight.end, fz + uz * flight.end);
      if (Math.abs(heights[heights.length - 1] - rampTop) > 0.03) throw Error(flight.id + ": top of the steps is not level with the ramp");
      walk([at(-0.4), at(flight.end + 0.3)]);
      if (Math.abs(player.y - rampTop) > 0.08) throw Error(flight.id + ": player did not climb the steps: " + player.y + " vs " + rampTop);
      walk([at(flight.end + 0.3), at(-0.4)]);
    }
    // Issue 54: raised terraces. Up each stair one riser at a time, across the floor and back down;
    // faces are solid, the opening is open, and the lawn and pool deck keep their level.
    for (const t of raisedTerraces) {
      if (!document.querySelector(`[data-terrace-id="${t.id}"]`)) throw Error(t.id + ": missing from the map");
      // Issue 55: enclosed private patios and soil beds do not lift the playable lawn.
      if (t.area === 'middle-pool') {
        const c = t.outline.reduce((sum, p) => [sum[0] + p[0] / t.outline.length, sum[1] + p[1] / t.outline.length], [0, 0]);
        if (t.walkable || t.openings.length || raisedTerraceGroundOffset(...c) !== 0) throw Error(t.id + ': inferred private access or changed public ground');
      }
      const floor = terraceFloorY(t) + 0.06, settle = () => { for (let i = 0; i < 120; i++) player.update(1 / 120, input, world, 0); };
      for (const f of terraceStairs(t)) {
        const at = (d, c = 0) => [f.foot[0] + f.up[0] * d + f.right[0] * c, f.foot[1] + f.up[1] * d + f.right[1] * c];
        const heights = [];
        for (let d = -0.6; d <= f.run + 0.6; d += 0.05) heights.push(world.groundHeight(...at(d)));
        const jumps = heights.slice(1).map((h, i) => h - heights[i]).filter((j) => Math.abs(j) > 0.02);
        if (jumps.length !== f.stair.risers || jumps.some((j) => j < 0.1 || j > 0.2)) throw Error(f.opening.id + ": stair does not rise one riser at a time: " + jumps);
        const foot = world.groundHeight(...at(-0.6)), landing = at(f.run + 0.8);
        if (Math.abs(world.groundHeight(...landing) - floor) > 0.01 || Math.abs(floor - foot - t.rise) > 0.03) throw Error(f.opening.id + ": top is not the terrace floor");
        walk([at(-1.2), landing]); settle();
        if (Math.abs(player.y - floor) > 0.08) throw Error(f.opening.id + ": player did not climb the stair: " + player.y + " vs " + floor);
        for (const route of t.walks ?? []) {
          walk([landing, ...route]); settle();
          if (Math.abs(player.y - world.groundHeight(...route[route.length - 1])) > 0.08 || Math.abs(player.y - floor) > 0.6) throw Error(t.id + ": player left the terrace floor");
          walk([...route].reverse().concat([landing]));
        }
        walk([landing, at(-1.2)]); settle();
        if (Math.abs(player.y - foot) > 0.08) throw Error(f.opening.id + ": player did not come back down");
        // The cheeks either side of the flight are solid.
        for (const c of [-1, 1]) {
          const p = at(f.run / 2, c * (f.width / 2 + 0.12)), out = world.solids.resolve(...p, 0.42);
          if (Math.hypot(out.x - p[0], out.z - p[1]) < 0.15) throw Error(f.opening.id + ": stair cheek is not solid");
        }
      }
      // Every face and untraced end is solid along its length.
      for (const ring of raisedTerraceRings()) {
        const c = ring.reduce((a, q) => [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length], [0, 0]);
        const out = world.solids.resolve(c[0], c[1], 0.42);
        if (Math.hypot(out.x - c[0], out.z - c[1]) < 0.15) throw Error(t.id + ": terrace face is not solid at " + c);
      }
    }
    // IMG_2194 shows a grass opening; neither a private wall nor an invented stair closes it.
    const middleNorthGap = [-125.65, 81.7], gapResolved = world.solids.resolve(...middleNorthGap, 0.42);
    if (Math.hypot(gapResolved.x - middleNorthGap[0], gapResolved.z - middleNorthGap[1]) > 0.02 || raisedTerraceGroundOffset(...middleNorthGap) !== 0) throw Error('Middle pool north grass opening is blocked or raised');
    for (const pool of s.pools) {
      const [cx, cz] = pool.ring.reduce((a, q) => [a[0] + q[0] / pool.ring.length, a[1] + q[1] / pool.ring.length], [0, 0]);
      if (raisedTerraceGroundOffset(cx, cz) !== 0 || pool.ring.some((q) => raisedTerraceGroundOffset(...q) !== 0)) throw Error("A raised terrace lifts the " + pool.id + " pool");
    }
    // Issue 31: up the Calle Eva ramp from the middle pool, through the open south-west gateway and back (the steps are walked above).
    {
      const { default: gw } = await import("/data/middle_pool_sw_gateway.json");
      walk([middleSwAt(-1), middleSwAt(gw.gatewayAlong + 2.5)]);
      walk([middleSwAt(gw.gatewayAlong + 2.5), middleSwAt(-1)]);
      const gateOnly = new Solids(middleSwRings());
      for (const ring of middleSwRings().filter((_, i) => i % 2 === 0)) {
        const c = ring.reduce((a, q) => [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length], [0, 0]);
        const out = gateOnly.resolve(c[0], c[1], 0.42);
        if (Math.hypot(out.x - c[0], out.z - c[1]) < 0.15) throw Error("South-west gateway pier is not solid at " + c);
      }
    }
    // Issue 39: the separate south entrance remains level and open in both directions.
    walk([middleSouthAt(-2.8),middleSouthAt(1.8)]);
    walk([middleSouthAt(1.8),middleSouthAt(-2.8)]);
    if(Math.abs(world.groundHeight(...middleSouthAt(-2))-world.groundHeight(...middleSouthAt(1)))>.05)throw Error("South entrance gained an unsupported step");
    // Private garden threshold: both visible treads equal the sampled player ground,
    // and the photographed closed door stays solid. It is not a through-route.
    {
      const scene=new THREE.Scene();addCervantesGardenDoor(scene,s.boundaryReference);scene.updateMatrixWorld(true);
      const ray=new THREE.Raycaster(),levels=[];
      for(const b of [-gardenDoor.stepRun*1.5,-gardenDoor.stepRun*.65]){
        const at=gardenPoint(0,b),ground=world.groundHeight(...at);levels.push(ground);
        ray.set(new THREE.Vector3(at[0],5,at[1]),new THREE.Vector3(0,-1,0));
        const hit=ray.intersectObjects(scene.children).find(h=>h.object.name.includes("-tread-"));
        if(!hit||Math.abs(hit.point.y-ground)>.01)throw Error("Garden door visible tread/player ground disagree");
      }
      if(Math.abs(levels[1]-levels[0]-gardenDoor.rise/2)>.01)throw Error("Garden door should have two equal risers");
      const doorSolids=new Solids(gardenDoorRings()),at=gardenPoint(0,0),out=doorSolids.resolve(...at,.42);
      if(Math.hypot(out.x-at[0],out.z-at[1])<.4)throw Error("Closed garden door is not solid");
      const patio=gardenPoint(0,1),foot=gardenPoint(0,-gardenDoor.stepRun*2-.1);
      if(Math.abs(world.groundHeight(...patio)-world.groundHeight(...foot)-gardenDoor.rise)>.01)throw Error("Private patio is not level with garden door sill");
    }
    // Elena north: through the arched gateway, and the raised beds keep the player out.
    {
      const gate = gatewayParts();
      walk([[gate.cross[0] - 3 * gate.along[1], gate.cross[1] + 3 * gate.along[0]], [gate.cross[0] + 3 * gate.along[1], gate.cross[1] - 3 * gate.along[0]]]);
      for (const bed of elenaNorthBeds) {
        const c = bed.ring.reduce((a, q) => [a[0] + q[0] / bed.ring.length, a[1] + q[1] / bed.ring.length], [0, 0]);
        const out = world.solids.resolve(c[0], c[1], 0.42);
        if (Math.hypot(out.x - c[0], out.z - c[1]) < 0.4) throw Error("Raised bed " + bed.id + " is not solid");
      }
    }
    // Elena garden spur: enter between the beds, reach the door, then stop at it.
    {
      const { gardenPath: approach } = await (await fetch("/data/elena_north.json")).json();
      const [a,b] = [approach.from_, approach.to], length = Math.hypot(b[0]-a[0], b[1]-a[1]);
      const u = [(b[0]-a[0])/length, (b[1]-a[1])/length];
      const near = [b[0]-u[0]*0.62, b[1]-u[1]*0.62];
      walk([a,near]); walk([near,a]); walk([a,near]);
      for(let i=0;i<240;i++) player.update(1/120,{...input,moveZ:1},world,Math.atan2(u[0],-u[1]));
      const remaining = (b[0]-player.x)*u[0]+(b[1]-player.z)*u[1];
      if(remaining<0.45 || remaining>0.7) throw Error("Elena closed garden door failed to stop player: " + remaining);
      walk([[player.x,player.z],a]);
    }
    // Issue #38 (elena-east-patios): the patio enclosure is on the map and solid, and Cervantes no longer leads into the private patios.
    {
      const { elenaEastPatioWalls, inElenaEastPatios } = await import("/src/elena-east-patios.ts");
      for (const w of elenaEastPatioWalls) {
        if (!document.querySelector(`[data-elena-east-id="${w.id}"]`)) throw Error("Elena east patio wall missing from map: " + w.id);
        const c = [(w.points[0][0] + w.points[1][0]) / 2, (w.points[0][1] + w.points[1][1]) / 2], out = world.solids.resolve(c[0], c[1], 0.42);
        if (Math.hypot(out.x - c[0], out.z - c[1]) < 0.3) throw Error("Elena east patio wall is not solid: " + w.id);
      }
      const from = [-142.2, 50.75], into = [-143.0, 46.5];
      player.place(...from, 0);
      for (let i = 0; i < 1200; i++) player.update(1 / 120, { ...input, moveZ: 1 }, world, Math.atan2(into[0] - player.x, -(into[1] - player.z)));
      if (inElenaEastPatios(player.x, player.z)) throw Error("Walked from Cervantes into the private Elena east patios at " + player.x + "," + player.z);
      walk([[player.x, player.z], from]);
    }
    // Issue #89: map, closed door and south frontage collision agree; the route suite walks Cervantes both ways.
    {
      const {cervantesEastSouthWalls,cervantesEastSouthDoor,cervantesEastSouthRings}=await import("/src/cervantes-east-south-patios.ts");
      const wallOnly=new Solids(cervantesEastSouthRings());
      for(const w of cervantesEastSouthWalls){
        if(!document.querySelector(`[data-cervantes-east-south-id="${w.id}"]`))throw Error("South Cervantes wall missing on map");
        for(const t of [.05,.5,.95]){
          const c=w.points[0].map((v,j)=>v+(w.points[1][j]-v)*t), out=wallOnly.resolve(...c,.42);
          if(Math.hypot(out.x-c[0],out.z-c[1])<.45)throw Error("South Cervantes wall is not solid");
        }
      }
      const closed=wallOnly.resolve(...cervantesEastSouthDoor.at,.42);
      if(Math.hypot(closed.x-cervantesEastSouthDoor.at[0],closed.z-cervantesEastSouthDoor.at[1])<.45)throw Error("Closed south garden door is passable");
    }
    // Paseo retaining wall: solid, a level change of about 1 m by the south lawn, and the paseo still walks end to end past it.
    {
      const { paseoWallRings, paseoWallFace, paseoWallCovers, addPaseoWall } = await import("/src/paseo-wall.ts");
      const { seaWallSegments, seaWallRings, addSeaWall } = await import("/src/south-pool.ts");
      const rings = paseoWallRings(), wallOnly = new Solids(rings);
      for (const ring of rings) {
        const c = ring.reduce((a, q) => [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length], [0, 0]);
        const out = wallOnly.resolve(c[0], c[1], 0.42);
        if (Math.hypot(out.x - c[0], out.z - c[1]) < 0.15) throw Error("Paseo wall is not solid at " + c);
      }
      const k = Math.floor(paseoWallFace.length / 4), [fx, fz] = paseoWallFace[k], [gx, gz] = paseoWallFace[k + 1], len = Math.hypot(gx - fx, gz - fz);
      const across = (d) => world.groundHeight(fx + (gz - fz) / len * d, fz - (gx - fx) / len * d);
      const step = across(1.2) - across(-0.3);
      if (step < 0.8 || step > 1.3) throw Error("Paseo wall does not stand at the 1 m level change: " + step);
      // The sandstone line replaces the legacy white wall everywhere, including collision and map segments.
      const legacy = s.seaWall.points, remaining = seaWallSegments(legacy, paseoWallCovers);
      if (remaining.length >= legacy.length - 1 || !remaining.length) throw Error("South wall reconciliation omitted no shared stretches or lost the end returns");
      const legacyScene = new THREE.Scene();
      addSeaWall(legacyScene, legacy, paseoWallCovers);
      if (legacyScene.children.length !== remaining.length) throw Error("White wall mesh/map segment disagreement");
      const cornerCount = new Set(remaining.flat().map(p => p.join(","))).size;
      if (seaWallRings(legacy, paseoWallCovers).length !== remaining.length + cornerCount) throw Error("White wall collision retains hidden stretches");
      const south = s.pools.find(p => p.id === "south");
      for (const [x, z] of south.ring) {
        if (sd.inZone(x, z) || Math.abs(siteY(x, z) + poolGroundY(x, z)) > 0.001) throw Error("South pool no longer stays level at its existing datum");
      }
      const wallScene = new THREE.Scene();
      addPaseoWall(wallScene, s.seafront, sd, (x, z) => siteY(x, z) + poolGroundY(x, z));
      const cap = wallScene.getObjectByName("paseo-retaining-wall-coping");
      if (!cap) throw Error("Sandstone coping missing");
      const capPoints = cap.geometry.getAttribute("position"), angle = s.viewRotation * Math.PI / 180;
      let southCap = 0;
      for (let i = 0; i < capPoints.count; i++) {
        const tx = capPoints.getX(i) * Math.cos(angle) - capPoints.getZ(i) * Math.sin(angle);
        if (tx < -174 || tx > -150) continue;
        southCap++;
        if (Math.abs(capPoints.getY(i) - 0.065) > 0.001) throw Error("Sandstone coping is detached from the south lawn datum");
      }
      if (!southCap) throw Error("No sandstone coping below south lawn");
      const keep = world.solids;
      world.solids = new Solids([...buildings.map((b) => b.id === POOL_TERRACE_ID ? poolTerraceRing : b.ring), ...barrierRings(s.boundaryReference.barriers), ...coastalWallRings(), ...seaWallRings(legacy, paseoWallCovers), ...rings]);
      // The whole paseo, end to end both ways, past the Barraka join and the registry outlines the aerial shows are open paving (issue #41).
      if (!s.seafront.paseo.points.some(([x, z]) => Math.hypot(x - 28.87, z - 96.28) < 0.01)) throw Error("Paseo lost its Barraka boardwalk join");
      if (!s.buildings.some((b) => b.notStanding) || buildings.some((b) => b.notStanding)) throw Error("Not-standing registry parts must stay outlines, not solids");
      walk(s.seafront.paseo.points);
      walk([...s.seafront.paseo.points].reverse());
      world.solids = keep;
    }
    // Middle pool: in through the east gateway from Calle Eva and out again; the west planter is solid.
    {
      const gate = middleGatewayFrame(), out = gate.at(0, -3), into = gate.at(0, 3);
      walk([out, into]);
      walk([into, out]);
      const [f0, f1] = middlePoolPlanter.face, back = middlePoolPlanter.ring[middlePoolPlanter.ring.length - 1];
      for (const t of [0.2, 0.5, 0.8]) {
        const c = [f0[0] + (f1[0] - f0[0]) * t + (back[0] - f0[0]) / 2, f0[1] + (f1[1] - f0[1]) * t + (back[1] - f0[1]) / 2];
        const pushed = world.solids.resolve(c[0], c[1], 0.42);
        if (Math.hypot(pushed.x - c[0], pushed.z - c[1]) < 0.4) throw Error("Middle pool planter is not solid at " + c);
      }
      // Walking along the path beside the planter, towards it, is stopped at its face.
      const start = [f0[0] + (f1[0] - f0[0]) * 0.5 - (back[0] - f0[0]) * 1.2, f0[1] + (f1[1] - f0[1]) * 0.5 - (back[1] - f0[1]) * 1.2];
      player.place(...start, 0);
      for (let i = 0; i < 600; i++) player.update(1 / 120, { ...input, moveZ: 1 }, world, Math.atan2(back[0] - f0[0], -(back[1] - f0[1])));
      const face = [f0[0] + (f1[0] - f0[0]) * 0.5, f0[1] + (f1[1] - f0[1]) * 0.5], depth = ((player.x - face[0]) * (back[0] - f0[0]) + (player.z - face[1]) * (back[1] - f0[1])) / Math.hypot(back[0] - f0[0], back[1] - f0[1]);
      if (depth > -0.3) throw Error("Player walked into the middle pool planter: " + depth);
    }
    open = false;
    const at = [
      (coastalGate.points[0][0] + coastalGate.points[1][0]) / 2,
      coastalGate.points[0][1],
    ];
    const closed = world.solids.resolve(at[0], at[1], 0.42);
    if (Math.hypot(closed.x - at[0], closed.z - at[1]) < 0.4)
      throw Error("Closed gate not solid");
    open = true;
    const cleared = world.solids.resolve(at[0], at[1], 0.42);
    if (Math.hypot(cleared.x - at[0], cleared.z - at[1]) > 0.01)
      throw Error("Open gate still solid");
    const shape = new THREE.Shape([
      new THREE.Vector2(-40, -3),
      new THREE.Vector2(-40, 3),
      new THREE.Vector2(40, 3),
      new THREE.Vector2(40, -3),
    ]);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 6,
      bevelEnabled: false,
    }).rotateX(-Math.PI / 2);
    const material = [
      new THREE.MeshBasicMaterial(),
      new THREE.MeshBasicMaterial(),
    ];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-180, 0, 40);
    mesh.userData.base = [-180, 40];
    const scene = new THREE.Scene();
    scene.add(mesh);
    const original = mesh.geometry;
    drapeScene(scene, []);
    if (mesh.geometry !== original || mesh.geometry.groups.length !== 2)
      throw Error("Level building lost groups");
    scene.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(-230, 3, 40),
      new THREE.Vector3(1, 0, 0),
    );
    if (!ray.intersectObject(mesh).length)
      throw Error("Opaque wall is not ray-visible");
    const plane = refine(
      new THREE.BoxGeometry(80, 0.1, 6),
      (x, z) => 0.5 * (1 + Math.sin(x / 20)),
      new THREE.Matrix4(),
    );
    if (
      plane.groups.length !== 6 ||
      plane.groups.reduce((n, g) => n + g.count, 0) !==
        plane.getAttribute("position").count
    )
      throw Error("Refined material groups incomplete");
    const { addSprites } = await import("/src/sprites.ts");
    const guardScene = new THREE.Scene();
    guardScene.userData.decorationClearance = (x, z, r) =>
      routeClearance(routes, x, z, r);
    addSprites(guardScene, "tree", [
      { x: routes[0].points[1][0], z: routes[0].points[1][1] },
      { x: -400, z: -200 },
    ]);
    if (guardScene.children.length !== 1 || guardScene.children[0].count !== 1)
      throw Error("Sprite guard failed to remove route obstruction");
    if (routeClearance(routes, 0, 0, 1) === undefined)
      throw Error("Missing guard");
    const point = routes[0].points[1];
    if (routeClearance(routes, ...point, 1))
      throw Error("Route allows decoration");
    return {
      routes: routes.length,
      bothDirections: true,
      segments,
      closedGateBlocks: true,
      openGatePasses: true,
      levelBuildingKeepsGroups: true,
      refinedMaterialGroups: plane.groups.length,
    };
  }, threeUrl);
  await p.click("#map-frontages");
  await p.screenshot({ path: path.join(artifacts, "layout-map.png") });
  await p.goto(
    site + "/slice.html?pool=north,middle,south,main&view=coastal-gate",
  );
  await p.waitForSelector(".reference-pin", { state: "attached" });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(artifacts, "coastal-gate-closed.png") });
  await p.click("#gate-control");
  if ((await p.locator("#gate-control").innerText()) !== "Close coastal gate")
    throw Error("Gate control failed");
  await p.screenshot({ path: path.join(artifacts, "coastal-gate-open.png") });
  await p.goto(site + "/slice.html?pool=north,middle&view=cervantes");
  await p.waitForSelector(".reference-pin", { state: "attached" });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(artifacts, "cervantes-layout.png") });
  console.log(JSON.stringify({ result: r, errors }));
  await b.close();
  await server.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
