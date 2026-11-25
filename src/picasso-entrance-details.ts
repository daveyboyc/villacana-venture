import * as THREE from "three";
import data from "../data/picasso_entrance_details.json";
import carPark from "../data/picasso_car_park.json";
import { lanternPost, LANTERN_RADIUS } from "./lantern-post";
import { plasterMaterial } from "./materials";
import { addSprites, SPRITE_SIZE, type SpriteKind } from "./sprites";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The main car park's north entrance round the gatehouse island (data/picasso_entrance_details.json), from Dave's
 * Street View screenshots (Oct 2024, Imagery © Google), the registered Google 3D top-down view and IMG_3131.
 * Structure, drawn in Layout: the gatehouse's two sloping white wing walls and the CALLE DE PICASSO plinth.
 * Show details: the gatehouse's arched grilled windows and blue plaque, the STOP, beach, no-entry and dead-end signs,
 * the COMUNIDAD VILLACANA board, the notice pillar at the narrow planter, the lantern by the plinth, and the island's
 * strelitzias, cycads, feathery tree and palm and the planter's bougainvillea. Planting keeps the shared route guard.
 */
type Guard = (x: number, z: number, radius: number) => boolean;
/** Paving and the island stand above the terrain as the ground plan draws them (data/ground_plan_picasso.json). */
const ASPHALT = 0.27, ISLAND = 0.42, LAWN_BED = 0.43, PLANTER = 0.53;
const house = carPark.gatehouse.ring as Vec2[];

function canvasTexture(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** The painted faces of the signs: a road sign's symbol, the beach arrow, the community board and the plinth's tiles. */
function signFace(kind: string, text = ""): THREE.CanvasTexture {
  return canvasTexture(256, kind === "beach" || kind === "board" || kind === "plinth" || kind === "notice" ? 160 : 256, (g) => {
    const W = g.canvas.width, H = g.canvas.height;
    g.clearRect(0, 0, W, H);
    if (kind === "stop") {
      g.fillStyle = "#ffffff"; octagon(g, W / 2, H / 2, W / 2); g.fill();
      g.fillStyle = "#c8102e"; octagon(g, W / 2, H / 2, W / 2 - 10); g.fill();
      g.fillStyle = "#ffffff"; g.font = "bold 76px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("STOP", W / 2, H / 2 + 4);
    } else if (kind === "no-entry") {
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#c8102e"; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffffff"; g.fillRect(W * 0.18, H * 0.42, W * 0.64, H * 0.16);
    } else if (kind === "dead-end") {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#1d4f9a"; g.fillRect(8, 8, W - 16, H - 16);
      g.fillStyle = "#ffffff"; g.fillRect(W * 0.44, H * 0.34, W * 0.12, H * 0.5);
      g.fillStyle = "#c8102e"; g.fillRect(W * 0.24, H * 0.2, W * 0.52, H * 0.14);
    } else if (kind === "beach") {
      g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(40, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(40, H); g.closePath(); g.fill();
      g.strokeStyle = "#1b1b1b"; g.lineWidth = 6; g.stroke();
      g.fillStyle = "#1b1b1b"; g.font = "bold 40px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("ACCESO PLAYA", W / 2 + 18, H * 0.33, W - 60); g.fillText("TO THE BEACH", W / 2 + 18, H * 0.7, W - 60);
    } else if (kind === "board") {
      g.fillStyle = "#f7f5ef"; g.fillRect(0, 0, W, H); g.strokeStyle = "#8a8070"; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
      g.fillStyle = "#d9792b"; g.beginPath(); g.moveTo(W / 2, 14); g.lineTo(W / 2 + 18, 44); g.lineTo(W / 2 - 18, 44); g.closePath(); g.fill();
      g.fillStyle = "#3a3530"; g.font = "bold 26px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("COMUNIDAD", W / 2, 72); g.fillText("VILLACANA", W / 2, 102);
      g.font = "16px Georgia, serif"; g.fillText("PROPIEDAD PRIVADA", W / 2, 134);
    } else if (kind === "notice") {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#555"; for (let i = 0; i < 9; i++) g.fillRect(24, 18 + i * 9, W * (0.45 + 0.3 * ((i * 7) % 5) / 5), 3);
      g.fillStyle = "#1d4f9a"; g.fillRect(24, 106, W - 48, 44);
      g.fillStyle = "#ffffff"; g.font = "bold 18px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ZONA VIDEOVIGILADA", W / 2, 128);
    } else if (kind === "plinth") {
      g.fillStyle = "#f3f1ea"; g.fillRect(0, 0, W, H);
      const n = text.length, tile = (W - 16) / n;
      [...text].forEach((ch, i) => {
        const x = 8 + i * tile;
        g.fillStyle = "#faf8f2"; g.fillRect(x, 12, tile - 1, 34); g.strokeStyle = "#20242c"; g.lineWidth = 2; g.strokeRect(x + 1, 13, tile - 3, 32);
        g.fillStyle = "#15181e"; g.font = "bold 24px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, x + tile / 2, 30);
      });
    }
  });
}
function octagon(g: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; g[i ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a)); }
  g.closePath();
}

/** A flat face of size w x h, its front towards local +z. */
function panel(w: number, h: number, map: THREE.Texture): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.2, roughness: 0.6, side: THREE.DoubleSide }));
}
const turnTo = (face: number[]) => Math.atan2(face[0], face[1]);

/** A wall slab from a to b, `thickness` thick, its top falling from heights[0] to heights[1] above `base`. */
function slopingWall(a: Vec2, b: Vec2, heights: number[], thickness: number, material: THREE.Material): THREE.Mesh {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), shape = new THREE.Shape();
  shape.moveTo(0, -0.3); shape.lineTo(len, -0.3); shape.lineTo(len, heights[1]); shape.lineTo(0, heights[0]); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false }).translate(0, 0, -thickness / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** Structure (Layout): the gatehouse wing walls and the CALLE DE PICASSO plinth. */
export function addPicassoEntranceStructure(scene: THREE.Scene): void {
  const group = new THREE.Group(); group.name = data.id; group.userData.noDrape = true; group.userData.structural = true;
  const white = plasterMaterial("#f4f1e8");
  for (const w of data.wings) {
    const a = w.from as Vec2, b = w.to as Vec2, wall = slopingWall(a, b, w.heights, w.thickness, white);
    wall.position.set(a[0], siteY(a[0], a[1]) + ISLAND, a[1]); wall.name = w.id; group.add(wall);
  }
  const p = data.plinth, [px, pz] = p.at as Vec2, base = siteY(px, pz);
  const block = new THREE.Mesh(new THREE.BoxGeometry(p.width, p.height + 0.1, p.depth), white);
  block.position.set(px, base + (p.height - 0.1) / 2, pz); block.rotation.y = turnTo(p.face);
  block.name = p.id; block.castShadow = block.receiveShadow = true; group.add(block);
  const letters = panel(p.width - 0.04, (p.width - 0.04) * 160 / 256, signFace("plinth", p.text));
  letters.position.set(px + p.face[0] * (p.depth / 2 + 0.005), base + p.height - (p.width - 0.04) * 80 / 256 - 0.02, pz + p.face[1] * (p.depth / 2 + 0.005));
  letters.rotation.y = turnTo(p.face); letters.name = `${p.id}-letters`; group.add(letters);
  scene.add(group);
}

/** Collision for the structure: the wing walls and the plinth. */
export function picassoEntranceRings(): Vec2[][] {
  const rings: Vec2[][] = data.wings.map((w) => {
    const [a, b] = [w.from as Vec2, w.to as Vec2], l = Math.hypot(b[0] - a[0], b[1] - a[1]), h = w.thickness / 2;
    const nx = -(b[1] - a[1]) / l * h, nz = (b[0] - a[0]) / l * h;
    return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
  });
  const p = data.plinth, [x, z] = p.at as Vec2, [fx, fz] = p.face, ax = -fz, az = fx, hw = p.width / 2, hd = p.depth / 2;
  rings.push([[x + ax * hw + fx * hd, z + az * hw + fz * hd], [x - ax * hw + fx * hd, z - az * hw + fz * hd], [x - ax * hw - fx * hd, z - az * hw - fz * hd], [x + ax * hw - fx * hd, z + az * hw - fz * hd]]);
  return rings;
}

/** Show details: windows, plaque, signs, board, notice pillar, lantern and planting. */
export function addPicassoEntranceDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const guard = into.userData.decorationClearance as Guard | undefined;
  const clear = (x: number, z: number, r: number) => !guard || guard(x, z, r);
  const root = new THREE.Group(); root.name = `${data.id}-details`; root.userData.noDrape = true; root.userData.omitted = [] as string[];
  const omit = (id: string) => (root.userData.omitted as string[]).push(id);
  const iron = new THREE.MeshStandardMaterial({ color: "#1c1e20", roughness: 0.5, metalness: 0.5 });
  const recess = new THREE.MeshStandardMaterial({ color: "#2b2a27", roughness: 0.9 });
  const steel = new THREE.MeshStandardMaterial({ color: "#a9aeb1", roughness: 0.4, metalness: 0.7 });
  const white = plasterMaterial("#f4f1e8");
  const faceFrame = (face: number[], along: number) => {
    const a = house[face[0]], b = house[face[1]], u: Vec2 = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(u[0], u[1]);
    const centre = house.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    let n: Vec2 = [u[1] / l, -u[0] / l];
    const mx = a[0] + u[0] * along, mz = a[1] + u[1] * along;
    if ((mx - centre[0]) * n[0] + (mz - centre[1]) * n[1] < 0) n = [-n[0], -n[1]];
    return { x: mx, z: mz, n, y: siteY(mx, mz) + ISLAND };
  };

  // Arched windows with black bars (Street View 03, 06-08).
  for (const w of data.windows) {
    const f = faceFrame(w.face, w.along);
    if (!keep(f.x, f.z)) { omit(w.id); continue; }
    const win = new THREE.Group(); win.name = w.id;
    const r = w.width / 2, straight = w.height - r, shape = new THREE.Shape();
    shape.moveTo(-r, 0); shape.lineTo(r, 0); shape.lineTo(r, straight); shape.absarc(0, straight, r, 0, Math.PI, false); shape.closePath();
    const hole = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), recess); hole.position.z = 0.012; win.add(hole);
    for (let i = 1; i < 6; i++) {
      const x = -r + (i * w.width) / 6, h = x * x < r * r ? straight + Math.sqrt(r * r - x * x) : straight;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 6), iron); bar.position.set(x, h / 2, 0.04); win.add(bar);
    }
    for (const y of [0.05, straight * 0.5, straight]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(w.width, 0.025, 0.025), iron); rail.position.set(0, y, 0.04); win.add(rail); }
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w.width + 0.16, 0.05, 0.1), white); sill.position.set(0, -0.025, 0.05); win.add(sill);
    win.position.set(f.x, f.y + w.sill, f.z); win.rotation.y = Math.atan2(f.n[0], f.n[1]); root.add(win);
  }
  { const q = data.plaque, f = faceFrame(q.face, q.along);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(q.width, q.height, 0.02), new THREE.MeshStandardMaterial({ color: "#1d4f9a", roughness: 0.5 }));
    plate.position.set(f.x + f.n[0] * 0.012, f.y + q.y, f.z + f.n[1] * 0.012); plate.rotation.y = Math.atan2(f.n[0], f.n[1]); plate.name = "gatehouse-plaque"; root.add(plate); }

  // Signs on posts (and the board on two), each standing on the island, the lawn or the asphalt below it.
  for (const s of data.signs) {
    const [x, z] = s.at as Vec2;
    if (!keep(x, z)) { omit(s.id); continue; }
    const g = new THREE.Group(); g.name = s.id;
    const onIsland = s.kind !== "dead-end", y0 = siteY(x, z) + (onIsland ? ISLAND : ASPHALT);
    const board = s.kind === "board", wide = s.kind === "beach" || board;
    const w = s.size, h = wide ? (s.size * 160) / 256 : s.size;
    const face = panel(w, h, signFace(s.kind)); face.position.set(0, s.height - h / 2, 0.03); g.add(face);
    if (!wide) { const back = new THREE.Mesh(new THREE.CircleGeometry(w / 2, s.kind === "stop" ? 8 : s.kind === "dead-end" ? 4 : 24), steel);
      back.rotation.y = Math.PI; back.position.set(0, s.height - h / 2, 0.025); if (s.kind === "stop") back.rotation.z = Math.PI / 8; if (s.kind === "dead-end") { back.scale.set(Math.SQRT2 * 0.98, Math.SQRT2 * 0.98, 1); back.rotation.z = Math.PI / 4; } g.add(back); }
    for (const px of board ? [-w * 0.38, w * 0.38] : [0]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, s.height + 0.1, 8), board ? white : steel); post.position.set(px, (s.height + 0.1) / 2 - 0.1, 0); g.add(post);
    }
    g.position.set(x, y0, z); g.rotation.y = turnTo(s.face); g.traverse((o) => { o.castShadow = true; }); root.add(g);
  }

  // The notice pillar at the narrow planter's south end.
  { const p = data.pillar, [x, z] = p.at as Vec2;
    if (keep(x, z)) {
      const g = new THREE.Group(); g.name = p.id;
      const block = new THREE.Mesh(new THREE.BoxGeometry(p.size, p.height, p.size), white); block.position.y = p.height / 2 - 0.1; g.add(block);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(p.size + 0.08, 0.06, p.size + 0.08), white); cap.position.y = p.height - 0.07; g.add(cap);
      const sheet = panel(p.size * 0.82, p.size * 0.82 * 160 / 256, signFace("notice")); sheet.position.set(0, p.height * 0.62, p.size / 2 + 0.006); g.add(sheet);
      g.position.set(x, siteY(x, z) + PLANTER, z); g.rotation.y = turnTo(p.face); g.traverse((o) => { o.castShadow = true; }); root.add(g);
    } else omit(p.id); }

  // The resort lantern by the plinth.
  { const l = data.lantern, [x, z] = l.at as Vec2;
    if (keep(x, z) && clear(x, z, LANTERN_RADIUS)) { const post = lanternPost({ name: l.id }); post.position.set(x, siteY(x, z), z); root.add(post); } else omit(l.id); }

  // Planting: sprites standing on the raised island bed or the planter.
  const sprites: Partial<Record<SpriteKind, { x: number; y: number; z: number; scale: number; clearance?: number }[]>> = {};
  for (const p of data.planting) {
    const [x, z] = p.at as Vec2, kind = p.kind as SpriteKind, scale = p.scale;
    const radius = (p as { canopy?: boolean }).canopy ? 0.3 : (SPRITE_SIZE[kind].w * scale) / 2;
    if (!keep(x, z) || !clear(x, z, radius)) { omit(`${kind}@${x},${z}`); continue; }
    const lift = kind === "bougainvillea" ? PLANTER : LAWN_BED;
    (sprites[kind] ??= []).push({ x, y: siteY(x, z) + lift, z, scale, ...((p as { canopy?: boolean }).canopy ? { clearance: 0.3 } : {}) });
  }
  for (const [kind, places] of Object.entries(sprites)) addSprites(root as unknown as THREE.Scene, kind as SpriteKind, places);
  into.add(root);
}
