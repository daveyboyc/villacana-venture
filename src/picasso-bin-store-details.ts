import * as THREE from "three";
import carPark from "../data/picasso_car_park.json";
import data from "../data/picasso_service_frontage.json";
import { clippedHedge, looseShrub, wallClimber } from "./clipped-plants";
import { lanternPost } from "./lantern-post";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Show details for the bin store (DEPOSITO BASURA) at the main car park's south-east corner
 * (data/picasso_service_frontage.json binStoreDetails), from IMG_3099, 3100, 3101, 3103, 3123 and 3124.
 * The car-park front: the RUBBISH COLLECTION / DEPOSITO BASURA board, the motorbike-parking sign, the red fire-hose box
 * and EXTINTOR sign, the glazed cabinet and roundels by the doorway, the green double doors (north leaf open) and the
 * bougainvillea along its top. The street face: the shut green sliding door on its rail, the yellow warning sign,
 * switch box, lamp and the concrete ramp. Inside: four yellow containers against the front wall (placed by Dave), the
 * BASURA / RUBBISH BINS and recycling signs (IMG_3101), the grey plinth band, terrazzo floor and slot drain, and the
 * wall lantern (IMG_3103). Outside also the clipped shrub south of the doorway, the planter, the motorbike-bay lines and
 * the bougainvillea as one continuous leafy mass with its trunk (IMG_3099, IMG_3100).
 * Positions are along each wall, measured from the photos at the wall's own scale (about 0.3 m).
 * Every piece keeps the shared route guard with its whole footprint.
 */
const PAVING = 0.27;
const yard = data.binYard as unknown as { front: Vec2[]; roadFace: Vec2[]; northEnd: Vec2[]; southEnd: Vec2[]; thickness: number; height: number; doorway: { at: number; width: number; height: number } };
const det = data.binStoreDetails;
const east = data.frame.east as Vec2;
const frame = data.frame as unknown as { origin: Vec2; along: Vec2; east: Vec2 };
type Item = { id: string; kind: string; t: number; y: number; w: number; h: number };
type Guard = (x: number, z: number, radius: number) => boolean;
/** A plan point in the long wall's frame: s along it (south-east positive), e east of its centre line. */
const framePoint = (s: number, e: number): Vec2 => [frame.origin[0] + frame.along[0] * s + frame.east[0] * e, frame.origin[1] + frame.along[1] * s + frame.east[1] * e];
const toFrame = (p: Vec2): Vec2 => { const dx = p[0] - frame.origin[0], dz = p[1] - frame.origin[1]; return [dx * frame.along[0] + dz * frame.along[1], dx * frame.east[0] + dz * frame.east[1]]; };
/** Turns an object so its local z points along `normal` (out of a wall), y up, and local x = y x z. */
function faceTurn(obj: THREE.Object3D, normal: Vec2): Vec2 {
  const z = new THREE.Vector3(normal[0], 0, normal[1]).normalize(), y = new THREE.Vector3(0, 1, 0), x = new THREE.Vector3().crossVectors(y, z);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return [x.x, x.z];
}

function canvasTexture(w: number, h: number, paint: (g: CanvasRenderingContext2D, W: number, H: number) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** The painted faces, drawn at the photographed proportions. */
function face(kind: string): THREE.CanvasTexture {
  const text = (g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, colour = "#16181a", font = "Arial, sans-serif", weight = "bold") => {
    g.fillStyle = colour; g.font = `${weight} ${size}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, x, y);
  };
  switch (kind) {
    case "rubbish-sign": return canvasTexture(240, 320, (g, W, H) => {
      g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#2a2a2a"; g.lineWidth = 6; g.strokeRect(5, 5, W - 10, H - 10);
      text(g, "RUBBISH", W / 2, 62, 34, "#1b1b1b"); text(g, "COLLECTION", W / 2, 104, 30, "#1b1b1b");
      g.fillStyle = "#333"; g.fillRect(30, 150, W - 60, 3);
      text(g, "DEPOSITO", W / 2, 210, 34, "#1b1b1b"); text(g, "BASURA", W / 2, 254, 34, "#1b1b1b");
    });
    case "parking-sign": return canvasTexture(256, 256, (g, W, H) => {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H); g.fillStyle = "#1f5fb4"; g.fillRect(8, 8, W - 16, H - 16);
      text(g, "P", W * 0.42, H * 0.47, 190, "#ffffff");
      // A small motorbike below and right of the P: two wheels, a body and a rider.
      g.strokeStyle = "#ffffff"; g.lineWidth = 7;
      for (const cx of [168, 222]) { g.beginPath(); g.arc(cx, 206, 15, 0, Math.PI * 2); g.stroke(); }
      g.beginPath(); g.moveTo(168, 206); g.lineTo(190, 186); g.lineTo(222, 206); g.stroke();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(196, 160, 9, 0, Math.PI * 2); g.fill();
    });
    case "extintor-sign": return canvasTexture(128, 168, (g, W, H) => {
      g.fillStyle = "#d22a24"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#ffffff"; g.fillRect(40, 30, 26, 84); g.beginPath(); g.arc(53, 30, 13, Math.PI, 0); g.fill();
      g.fillRect(66, 26, 26, 8); g.fillRect(84, 34, 6, 40);
      text(g, "EXTINTOR", W / 2, 142, 21, "#ffffff");
    });
    case "red-box": return canvasTexture(128, 256, (g, W, H) => {
      g.fillStyle = "#d3251f"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#8e1612"; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, H - 16);
      g.fillStyle = "#f2e9e2"; g.beginPath(); g.ellipse(W / 2, H * 0.42, 26, 44, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#c9201b"; g.fillRect(W / 2 - 8, H * 0.32, 16, 52);
    });
    case "glazed-cabinet": return canvasTexture(128, 192, (g, W, H) => {
      g.fillStyle = "#e9edef"; g.fillRect(0, 0, W, H); g.fillStyle = "#b8c4c9"; g.fillRect(12, 12, W - 24, H - 24);
      g.fillStyle = "#c8231e"; g.fillRect(44, 60, 40, 84);
    });
    case "roundels": return canvasTexture(64, 192, (g, W) => {
      for (const cy of [40, 140]) {
        g.fillStyle = "#ffffff"; g.beginPath(); g.arc(W / 2, cy, 28, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "#cf2420"; g.lineWidth = 7; g.beginPath(); g.arc(W / 2, cy, 24, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(W / 2 - 16, cy - 16); g.lineTo(W / 2 + 16, cy + 16); g.stroke();
      }
    });
    case "yellow-sign": return canvasTexture(64, 112, (g, W, H) => {
      g.fillStyle = "#f2c21b"; g.fillRect(0, 0, W, H); g.fillStyle = "#16181a";
      g.beginPath(); g.moveTo(W / 2, 14); g.lineTo(W - 10, 54); g.lineTo(10, 54); g.closePath(); g.fill();
      g.fillStyle = "#f2c21b"; g.fillRect(W / 2 - 3, 28, 6, 16);
      for (let i = 0; i < 4; i++) g.fillStyle = "#16181a", g.fillRect(12, 66 + i * 10, W - 24, 4);
    });
    case "basura-sign": return canvasTexture(360, 350, (g, W, H) => {
      g.fillStyle = "#fbfbf7"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#c9c9c2"; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4);
      g.fillStyle = "#9a9a92"; for (const [x, y] of [[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]]) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
      text(g, "BASURA", W / 2, 58, 64, "#111214", "Arial Black, Arial, sans-serif");
      g.fillStyle = "#8c4a46"; g.fillRect(70, 100, W - 140, 4);
      text(g, "RUBBISH", W / 2, 150, 62, "#111214", "Arial Black, Arial, sans-serif");
      text(g, "BINS", W / 2, 228, 62, "#111214", "Arial Black, Arial, sans-serif");
      // The outlined arrow pointing left, maroon with a darker shaded side.
      g.fillStyle = "#b07a76"; g.strokeStyle = "#7c3d3a"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(80, 302); g.lineTo(140, 272); g.lineTo(140, 290); g.lineTo(290, 290); g.lineTo(290, 314); g.lineTo(140, 314); g.lineTo(140, 332); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#7c3d3a"; g.fillRect(140, 308, 150, 6);
      text(g, "BURGER", 320, 316, 11, "#1b1b1b"); text(g, "COMIC", 320, 332, 15, "#c4231d");
    });
    case "recycling-sign": return canvasTexture(160, 224, (g, W, H) => {
      g.fillStyle = "#f6f6f2"; g.fillRect(0, 0, W, H); g.fillStyle = "#1e9653"; g.fillRect(6, 6, W - 12, 124); g.fillRect(6, 138, W - 12, H - 144);
      // Three chasing arrows round a triangle.
      g.strokeStyle = "#ffffff"; g.lineWidth = 11; g.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const a0 = -Math.PI / 2 + (k * 2 * Math.PI) / 3, cx = W / 2, cy = 70, r = 38;
        const p0 = [cx + Math.cos(a0 + 0.35) * r, cy + Math.sin(a0 + 0.35) * r], p1 = [cx + Math.cos(a0 + 1.75) * r, cy + Math.sin(a0 + 1.75) * r];
        g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
        const d = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); g.fillStyle = "#ffffff"; g.beginPath();
        g.moveTo(p1[0] + Math.cos(d) * 10, p1[1] + Math.sin(d) * 10); g.lineTo(p1[0] + Math.cos(d + 2.4) * 14, p1[1] + Math.sin(d + 2.4) * 14); g.lineTo(p1[0] + Math.cos(d - 2.4) * 14, p1[1] + Math.sin(d - 2.4) * 14); g.closePath(); g.fill();
      }
      const lines = ["PLEASE USE RECYCLING BINS", "WHICH ARE IN THE STREET ON THE", "OTHER SIDE OF THIS WALL", "", "ROGAMOS UTILICEN LOS", "CONTENEDORES DE RECICLAJE QUE SE", "ENCUENTRAN EN LA CALLE DETRAS", "DE ESTE MURO."];
      lines.forEach((l, i) => text(g, l, W / 2, 152 + i * 9.5, 7.5, "#ffffff"));
    });
    default: return canvasTexture(8, 8, (g, W, H) => { g.fillStyle = kind === "black-box" ? "#1c1d1f" : "#f2f0ea"; g.fillRect(0, 0, W, H); });
  }
}

/** One terrazzo slab, `slab` metres square: pale cement with mixed chips and a fine joint, repeated over the floor. */
function terrazzo(colour: string): THREE.CanvasTexture {
  let seed = 41; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const t = canvasTexture(512, 512, (g, W, H) => {
    g.fillStyle = colour; g.fillRect(0, 0, W, H);
    const chips = ["#8f877b", "#b8ac98", "#6c655b", "#f1ece2", "#a3897a", "#3d3934", "#c9bfae"];
    for (let i = 0; i < 5200; i++) { g.fillStyle = chips[Math.floor(rnd() * chips.length)]; const r = 0.8 + rnd() ** 3 * 4.5; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, r, r * (0.6 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "rgba(90,84,74,0.55)"; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A point on a wall's outer face: `t` metres along it, pushed `out` metres out from the wall's centre line. */
function onFace(line: Vec2[], t: number, out: number, normal: Vec2): Vec2 {
  const [a, b] = line, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * t / l + normal[0] * out, a[1] + (b[1] - a[1]) * t / l + normal[1] * out];
}

export function addPicassoBinStoreDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const guard = into.userData?.decorationClearance as Guard | undefined;
  const clear = (x: number, z: number, r: number) => keep(x, z) && (!guard || guard(x, z, r));
  const root = new THREE.Group(); root.name = det.id; root.userData.noDrape = true; root.userData.omitted = [] as string[];
  const omit = (id: string) => (root.userData.omitted as string[]).push(id);
  const half = yard.thickness / 2;
  const frontOut: Vec2 = [-east[0], -east[1]], streetOut: Vec2 = [east[0], east[1]];
  const turn = (n: Vec2) => Math.atan2(n[0], n[1]);
  const green = new THREE.MeshStandardMaterial({ color: det.front.doors.colour, roughness: 0.6, metalness: 0.2 });
  const steel = new THREE.MeshStandardMaterial({ color: "#5d6266", roughness: 0.45, metalness: 0.6 });
  const concrete = new THREE.MeshStandardMaterial({ color: "#bdb6a8", roughness: 1 });
  const groove = new THREE.MeshStandardMaterial({ color: "#1f3328", roughness: 0.8 });
  const [fa, fb] = yard.front;
  const frontBase = Math.min(siteY(fa[0], fa[1]), siteY(fb[0], fb[1])) + PAVING;
  /** The yard floor: the doorway's sill, or the car-park paving where that is drawn higher inside the walls. */
  const floorAt = (x: number, z: number) => Math.max(frontBase, siteY(x, z) + PAVING) + 0.012;

  const flat = (item: Item, line: Vec2[], normal: Vec2, base: number, depth = 0.02) => {
    const [x, z] = onFace(line, item.t, half + depth / 2 + 0.005, normal);
    if (!keep(x, z)) { omit(item.id); return; }
    const box = depth > 0.05;
    const mat = new THREE.MeshStandardMaterial({ map: face(item.kind), roughness: 0.55, transparent: item.kind === "roundels", alphaTest: 0.2 });
    const side = plasterMaterial(item.kind === "red-box" ? "#c42520" : item.kind === "black-box" ? "#1c1d1f" : "#e9edef");
    const mesh = box
      ? new THREE.Mesh(new THREE.BoxGeometry(item.w, item.h, depth), [side, side, side, side, mat, side])
      : new THREE.Mesh(new THREE.PlaneGeometry(item.w, item.h), mat);
    mesh.position.set(x, base + item.y, z); mesh.rotation.y = turn(normal); mesh.name = item.id; mesh.castShadow = box;
    root.add(mesh);
  };

  // The car-park front: signs and fire-safety boxes.
  for (const item of det.front.items as Item[]) flat(item, yard.front, frontOut, frontBase, item.kind === "red-box" ? 0.2 : item.kind === "glazed-cabinet" ? 0.12 : 0.02);

  // The green double doors in the doorway: the south leaf shut in the wall's plane, the north leaf folded into the yard.
  { const d = yard.doorway, leaf = det.front.doors.leafWidth, h = det.front.doors.height;
    const [x, z] = onFace(yard.front, d.at, 0, frontOut);
    if (keep(x, z)) {
      const doors = new THREE.Group(); doors.name = "bin-store-doors";
      const leafMesh = (name: string) => {
        const g = new THREE.Group(); g.name = name;
        const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(leaf, h, 0.05), green); panelMesh.position.set(leaf / 2, h / 2, 0); g.add(panelMesh);
        for (let i = 1; i < 6; i++) { const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, h - 0.1, 0.06), groove); line.position.set((leaf * i) / 6, h / 2, 0); g.add(line); }
        return g;
      };
      // Local +x runs along the front from its south end; local +z points out into the car park.
      const south = leafMesh("bin-store-door-south"); south.position.set(-d.width / 2, 0, 0); doors.add(south);
      // Hinged at the north jamb and swung into the yard (local -z), as the dark half-open doorway in IMG_3099 shows.
      const north = leafMesh("bin-store-door-north"); north.position.set(d.width / 2, 0, -0.03); north.rotation.y = Math.PI / 2; doors.add(north);
      const [a, b] = yard.front, ux = (b[0] - a[0]), uz = (b[1] - a[1]);
      doors.rotation.y = -Math.atan2(uz, ux); doors.position.set(x, frontBase, z);
      // Make sure local +z is the car-park side: flip if the rotation put it towards the yard.
      const zAxis = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), doors.rotation.y);
      if (zAxis.x * frontOut[0] + zAxis.z * frontOut[1] < 0) { doors.scale.z = -1; }
      root.add(doors);
    } else omit("bin-store-doors"); }

  // Bougainvillea: one continuous leafy mass along the top of the front, in overlapping pieces so the guard bounds each,
  // spilling over both faces in drapes, with few bracts; its trunk rises from the bed south of the doorway (IMG_3099).
  { const b = det.front.bougainvillea, top = frontBase + yard.height, inward: Vec2 = [east[0], east[1]];
    const n = Math.ceil((b.to - b.from) / b.piece), len = (b.to - b.from) / n;
    for (let i = 0; i < n; i++) {
      const t = b.from + len * (i + 0.5), [x, z] = onFace(yard.front, t, b.toCarPark, frontOut), h = b.heights[0] + ((i * 7) % 5) / 4 * (b.heights[1] - b.heights[0]);
      if (!clear(x, z, Math.hypot(len, b.depth) / 2)) { omit(`bougainvillea@${t.toFixed(1)}`); continue; }
      // Each piece overlaps its neighbours by a third, so the row reads as one mass rather than a string of balls.
      const piece = clippedHedge({ length: len * 1.3, depth: b.depth, height: h + b.sink, seed: 3101 + i, clip: 3.2, density: 260, leaf: "glossy", leafSize: [0.09, 0.06], greens: ["#2c4626", "#3a5a2e", "#4a6c37", "#33512b"], inside: "#3a5a30", flowers: { count: b.flowers, colour: b.colour, size: [0.09, 0.08] } });
      piece.position.set(x, top - b.sink, z); faceTurn(piece, inward); piece.name = "bin-store-bougainvillea"; root.add(piece);
    }
    // A shallow skirt down the car-park face all along, then the photographed deeper drapes over it.
    const skirt = Array.from({ length: n }, (_, i) => ({ side: "car-park", from: b.from + len * i, to: b.from + len * (i + 1), drop: b.skirt }));
    [...skirt, ...b.drapes].forEach((d, i) => {
      const normal = d.side === "yard" ? inward : frontOut, mid = (d.from + d.to) / 2, [cx, cz] = onFace(yard.front, mid, half + 0.2, normal);
      if (!clear(cx, cz, Math.hypot(d.to - d.from, 0.5) / 2)) { omit(`bougainvillea-drape@${mid}`); return; }
      const drape = wallClimber({ length: d.to - d.from, height: d.drop + 0.3, depth: 0.35, seed: 3150 + i, flowers: Math.round(b.flowers * (d.drop > b.skirt ? 1.5 : 0.6)), flowerColour: b.colour });
      const xAxis = faceTurn(drape, normal), u = [yard.front[1][0] - yard.front[0][0], yard.front[1][1] - yard.front[0][1]];
      const start = xAxis[0] * u[0] + xAxis[1] * u[1] > 0 ? d.from : d.to, [sx, sz] = onFace(yard.front, start, half, normal);
      drape.position.set(sx, top - d.drop, sz); drape.name = "bin-store-bougainvillea-drape"; root.add(drape);
    });
    const tr = b.trunk, [bx, bz] = onFace(yard.front, tr.t, half + tr.out, frontOut), [tx, tz] = onFace(yard.front, tr.t + 0.25, half + 0.05, frontOut);
    if (clear(bx, bz, tr.radius + 0.1)) {
      const bark = new THREE.MeshStandardMaterial({ color: "#6f675c", roughness: 1 });
      const pts = [new THREE.Vector3(bx, frontBase - 0.05, bz), new THREE.Vector3(bx + (tx - bx) * 0.3, frontBase + 0.9, bz + (tz - bz) * 0.3 + 0.04), new THREE.Vector3(bx + (tx - bx) * 0.8, frontBase + 1.8, bz + (tz - bz) * 0.8), new THREE.Vector3(tx, top + 0.1, tz)];
      const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, tr.radius, 7), bark);
      trunk.name = "bin-store-bougainvillea-trunk"; trunk.castShadow = true; root.add(trunk);
    } else omit("bougainvillea-trunk"); }

  // The clipped shrub against the front south of the doorway (IMG_3099).
  { const sh = det.front.shrub, mid = (sh.from + sh.to) / 2, len = sh.to - sh.from, [x, z] = onFace(yard.front, mid, half + sh.depth / 2, frontOut);
    if (clear(x, z, Math.hypot(len, sh.depth) / 2)) {
      const shrub = clippedHedge({ length: len, depth: sh.depth, height: sh.height, seed: 3099, clip: 3.2, greens: ["#26401f", "#30502a", "#3c5e31"], inside: "#1a2b17" });
      shrub.position.set(x, frontBase - 0.02, z); faceTurn(shrub, frontOut); shrub.name = sh.id; root.add(shrub);
    } else omit(sh.id); }

  // The white planter with a flowering shrub under the fire-hose box (IMG_3099, IMG_3100).
  { const pl = det.front.planter, [x, z] = onFace(yard.front, pl.t, half + pl.depth / 2, frontOut);
    if (clear(x, z, Math.hypot(pl.length, pl.depth) / 2)) {
      const g = new THREE.Group(); g.name = pl.id;
      const box = new THREE.Mesh(new THREE.BoxGeometry(pl.length, pl.height, pl.depth), plasterMaterial("#f1eee6")); box.position.y = pl.height / 2; box.castShadow = box.receiveShadow = true; g.add(box);
      const soil = new THREE.Mesh(new THREE.BoxGeometry(pl.length - 0.1, 0.02, pl.depth - 0.1), new THREE.MeshStandardMaterial({ color: "#4a3a2c", roughness: 1 })); soil.position.y = pl.height - 0.03; g.add(soil);
      const plant = looseShrub({ width: pl.length * 0.9, depth: pl.depth * 0.9, height: pl.plantHeight, seed: 3100, leaf: "small", leafSize: [0.06, 0.04], greens: ["#45603a", "#58744a", "#3a5233"], flowers: { count: 40, colour: pl.flowerColour, size: 0.05 } });
      plant.position.y = pl.height - 0.05; g.add(plant);
      g.position.set(x, frontBase - 0.02, z); faceTurn(g, frontOut); root.add(g);
    } else omit(pl.id); }

  // The motorbike-bay lines painted on the car-park asphalt in front of the motorbike sign (IMG_3099).
  { const mb = det.front.motorbikeBay, paint = new THREE.MeshStandardMaterial({ color: mb.colour, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
    const at = (t: number, out: number): Vec2 => onFace(yard.front, t, half + out, frontOut);
    mb.lines.forEach((l, i) => {
      const a = at(l.from[0], l.from[1]), c = at(l.to[0], l.to[1]), len = Math.hypot(c[0] - a[0], c[1] - a[1]), steps = Math.max(1, Math.ceil(len / 0.25));
      if (!keep(a[0], a[1]) || !keep(c[0], c[1])) { omit(`${mb.id}-${i}`); return; }
      const dx = (c[0] - a[0]) / len, dz = (c[1] - a[1]) / len, nx = -dz * mb.lineWidth / 2, nz = dx * mb.lineWidth / 2, pos: number[] = [], index: number[] = [];
      for (let k = 0; k <= steps; k++) {
        const x = a[0] + (c[0] - a[0]) * k / steps, z = a[1] + (c[1] - a[1]) * k / steps;
        for (const sgn of [1, -1]) { const px = x + nx * sgn, pz = z + nz * sgn; pos.push(px, siteY(px, pz) + PAVING + 0.012, pz); }
        if (k < steps) { const q = k * 2; index.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(index); geo.computeVertexNormals();
      if (geo.attributes.normal.getY(0) < 0) { index.reverse(); geo.setIndex(index); geo.computeVertexNormals(); }
      const mesh = new THREE.Mesh(geo, paint); mesh.name = mb.id; mesh.receiveShadow = true; root.add(mesh);
    }); }

  // The street face: the shut sliding door on its rail and hood, its signs, lamp and box, and the ramp.
  const roadBase = (t: number) => { const [x, z] = onFace(yard.roadFace, t, 0, streetOut); return siteY(x, z) + PAVING; };
  { const s = det.street.door, [x, z] = onFace(yard.roadFace, s.t, half + 0.04, streetOut);
    if (keep(x, z)) {
      const base = roadBase(s.t) + 0.02;
      const door = new THREE.Group(); door.name = "bin-store-sliding-door";
      const slab = new THREE.Mesh(new THREE.BoxGeometry(s.width, s.height, 0.05), green); slab.position.y = s.height / 2; door.add(slab);
      for (let i = 1; i < 10; i++) { const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, s.height - 0.08, 0.06), groove); line.position.set(-s.width / 2 + (s.width * i) / 10, s.height / 2, 0); door.add(line); }
      door.position.set(x, base, z); door.rotation.y = turn(streetOut); root.add(door);
      // The rail and hood run from the door's south-east edge on north-west over the long wall.
      const t0 = s.t + s.width / 2, t1 = s.railTo;
      const p0 = onFace(yard.roadFace, t0, half + 0.08, streetOut), p1 = onFace(yard.roadFace, t1, half + 0.08, streetOut);
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.08), steel);
      rail.position.set((p0[0] + p1[0]) / 2, base + s.height + 0.08, (p0[1] + p1[1]) / 2); rail.rotation.y = -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); rail.name = "bin-store-door-rail"; root.add(rail);
    } else omit("bin-store-sliding-door"); }
  for (const item of det.street.items as Item[]) flat(item, yard.roadFace, streetOut, roadBase(item.t), item.kind === "white-box" || item.kind === "black-box" ? 0.06 : 0.02);
  { const r = det.street.ramp, p0 = onFace(yard.roadFace, r.from, half, streetOut), p1 = onFace(yard.roadFace, r.to, half, streetOut);
    if (keep(p0[0], p0[1])) {
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), base = roadBase(r.from);
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(len, 0); shape.lineTo(0, r.rise); shape.closePath();
      const ramp = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: r.width, bevelEnabled: false }), concrete);
      // Local x runs from the door's sill (p0) down to p1; the extrusion's depth points out from the wall.
      const dir = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      ramp.rotation.y = -dir; ramp.position.set(p0[0], base - 0.02, p0[1]);
      const depthAxis = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), -dir);
      if (depthAxis.x * streetOut[0] + depthAxis.z * streetOut[1] < 0) ramp.scale.z = -1;
      ramp.name = "bin-store-ramp"; ramp.receiveShadow = true; root.add(ramp);
    } else omit("bin-store-ramp"); }

  // Inside: four yellow 1100 l wheeled containers side by side against the front wall's inner face in the yard's north
  // half (Dave, 26 Nov 2026; IMG_3103), lids towards the long wall.
  { const c = det.containers, [cw, cd, ch] = c.size, yellow = new THREE.MeshStandardMaterial({ color: c.colour, roughness: 0.6 }), dark = new THREE.MeshStandardMaterial({ color: "#1d1d1d", roughness: 0.8 });
    for (let i = 0; i < c.count; i++) {
      const t = c.from + ((c.to - c.from) * i) / Math.max(1, c.count - 1);
      const [x, z] = onFace(yard.front, t, -c.inward, frontOut);
      if (!keep(x, z)) { omit(`container@${t}`); continue; }
      const bin = new THREE.Group(); bin.name = "bin-store-container";
      const body = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.06, ch - 0.3, cd - 0.08), yellow); body.position.y = 0.2 + (ch - 0.3) / 2; bin.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.08, cd), yellow); lid.position.y = ch - 0.06; bin.add(lid);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.06, 0.06), yellow); rim.position.set(0, ch - 0.16, cd / 2); bin.add(rim);
      for (const [wx, wz] of [[-cw / 2 + 0.15, -cd / 2 + 0.15], [cw / 2 - 0.15, -cd / 2 + 0.15], [-cw / 2 + 0.15, cd / 2 - 0.15], [cw / 2 - 0.15, cd / 2 - 0.15]]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.1, wz); bin.add(w);
      }
      bin.position.set(x, floorAt(x, z), z); bin.rotation.y = turn([-frontOut[0], -frontOut[1]]); bin.traverse((o) => { o.castShadow = true; }); root.add(bin);
    } }
  // Inside the yard: the terrazzo floor level with the doorway's sill, the slot drain, the grey plinth band on every
  // inside face, the BASURA / RUBBISH BINS and recycling signs on the long wall by the street door (IMG_3101), and the
  // lantern high on the long wall near the north-west end (IMG_3103).
  { const ins = det.inside, floorY = frontBase + 0.012; // the doorway's sill: signs, band and lantern are measured from it
    const eFront = toFrame(yard.front[0])[1] + half, sNorth = toFrame(yard.northEnd[1])[0] + half, sSouth = toFrame(yard.southEnd[0])[0] - half;
    const eLong = -(data.binYard.thickness / 2), eRoad = toFrame(yard.roadFace[0])[1] - half;
    const plane = (name: string, w: number, h: number, mat: THREE.Material) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.name = name; m.receiveShadow = true; root.add(m); return m; };
    // The floor and drain are draped a little over whichever is higher, the doorway's sill or the paving drawn inside the
    // walls, so no ground surface shows through; a level grid of 0.25 m cells in the long wall's frame.
    const sheet = (name: string, s0: number, s1: number, e0: number, e1: number, lift: number, mat: THREE.Material, uvScale: number) => {
      const ns = Math.max(1, Math.ceil(Math.abs(s1 - s0) / 0.25)), ne = Math.max(1, Math.ceil(Math.abs(e1 - e0) / 0.25)), pos: number[] = [], uv: number[] = [], index: number[] = [];
      for (let i = 0; i <= ns; i++) for (let j = 0; j <= ne; j++) {
        const ss = s0 + (s1 - s0) * i / ns, ee = e0 + (e1 - e0) * j / ne, [x, z] = framePoint(ss, ee);
        pos.push(x, floorAt(x, z) + lift, z); uv.push(ss / uvScale, ee / uvScale);
        if (i < ns && j < ne) { const k = i * (ne + 1) + j; index.push(k, k + 1, k + ne + 1, k + 1, k + ne + 2, k + ne + 1); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals();
      if (geo.attributes.normal.getY(0) < 0) { index.reverse(); geo.setIndex(index); geo.computeVertexNormals(); }
      const m = new THREE.Mesh(geo, mat); m.name = name; m.receiveShadow = true; root.add(m);
    };
    { const tex = terrazzo(ins.floor.colour);
      sheet("bin-yard-terrazzo-floor", sNorth, sSouth, eFront, eRoad, 0, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), ins.floor.slab); }
    { const dr = ins.drain;
      sheet("bin-yard-drain", sNorth + dr.toNorthWall, dr.from, dr.e - dr.width / 2, dr.e + dr.width / 2, 0.006, new THREE.MeshStandardMaterial({ color: "#77736c", roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }), 1); }
    // The plinth band: [from, to] runs along each inside face, as (s, e) end points, and the face's normal into the yard.
    const bandMat = plasterMaterial(ins.band.colour), road = data.binYard.streetDoor;
    const sFront = (t: number) => toFrame(onFace(yard.front, t, 0, frontOut))[0];
    const runs: { a: Vec2; b: Vec2; n: Vec2 }[] = [
      { a: [sSouth, eFront], b: [sFront(yard.doorway.at - yard.doorway.width / 2), eFront], n: [east[0], east[1]] },
      { a: [sFront(yard.doorway.at + yard.doorway.width / 2), eFront], b: [sNorth, eFront], n: [east[0], east[1]] },
      { a: [sNorth, eFront], b: [sNorth, eLong], n: [frame.along[0], frame.along[1]] },
      { a: [sSouth, eFront], b: [sSouth, eRoad], n: [-frame.along[0], -frame.along[1]] },
      { a: [sNorth, eLong], b: [0, eLong], n: [-east[0], -east[1]] },
      { a: [road.at + road.width / 2, eRoad], b: [sSouth, eRoad], n: [-east[0], -east[1]] },
    ];
    for (const r of runs) {
      const pa = framePoint(r.a[0], r.a[1]), pb = framePoint(r.b[0], r.b[1]), w = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      if (w < 0.05) continue;
      const band = plane("bin-yard-plinth-band", w, ins.band.height + 0.3, bandMat); // runs 0.3 m down behind the floor
      band.position.set((pa[0] + pb[0]) / 2 + r.n[0] * 0.006, floorY + ins.band.height / 2 - 0.15, (pa[1] + pb[1]) / 2 + r.n[1] * 0.006); faceTurn(band, r.n);
    }
    const longIn: Vec2 = [-east[0], -east[1]];
    for (const item of ins.items) {
      const [x, z] = framePoint(item.s, eLong - 0.012);
      const sign = plane(item.id, item.w, item.h, new THREE.MeshStandardMaterial({ map: face(item.kind), roughness: 0.5 }));
      sign.position.set(x, floorY + item.y, z); faceTurn(sign, longIn);
    }
    { const l = ins.lantern, s = sNorth + l.fromNorthWall, [x, z] = framePoint(s, eLong), [cx, cz] = framePoint(s, eLong - l.out);
      if (clear(cx, cz, 0.25)) {
        const lamp = new THREE.Group(); lamp.name = l.id;
        const body = lanternPost({ name: l.id + "-lantern", height: 3.82 });
        body.children.filter((c) => c.name.endsWith("-post")).forEach((c) => body.remove(c));
        body.position.set(0, -3.0, l.out); lamp.add(body); // the lantern's body starts 3.01 m up its post: stand it on the arm
        const iron = new THREE.MeshStandardMaterial({ color: "#1a1c1d", roughness: 0.55, metalness: 0.5 });
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, l.out + 0.05), iron); arm.position.set(0, -0.015, l.out / 2); lamp.add(arm);
        const stay = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, Math.hypot(l.out * 0.75, 0.32)), iron);
        stay.position.set(0, -0.17, l.out * 0.375); stay.rotation.x = Math.atan2(0.32, l.out * 0.75); lamp.add(stay);
        for (const [r, y, zz] of [[0.07, -0.12, l.out * 0.62], [0.05, -0.2, l.out * 0.3]] as const) {
          const scroll = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 5, 14, Math.PI * 1.6), iron); scroll.rotation.y = Math.PI / 2; scroll.position.set(0, y, zz); lamp.add(scroll);
        }
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.02), iron); plate.position.set(0, -0.16, 0.01); lamp.add(plate);
        lamp.traverse((o) => { o.castShadow = true; o.userData.noDrape = true; });
        const wallTop = carPark.wall.top + PAVING;
        lamp.position.set(x, Math.min(floorY + l.y, wallTop - 0.25), z); faceTurn(lamp, longIn); root.add(lamp);
      } else omit(l.id);
    } }
  into.add(root);
}
