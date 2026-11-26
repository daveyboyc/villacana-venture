import * as THREE from "three";
import data from "../data/picasso_service_frontage.json";
import { plasterMaterial } from "./materials";
import { addSprites } from "./sprites";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Show details for the bin store (DEPOSITO BASURA) at the main car park's south-east corner
 * (data/picasso_service_frontage.json binStoreDetails), from IMG_3099, 3100, 3101, 3103, 3123 and 3124.
 * The car-park front: the RUBBISH COLLECTION / DEPOSITO BASURA board, the motorbike-parking sign, the red fire-hose box
 * and EXTINTOR sign, the glazed cabinet and roundels by the doorway, the green double doors (north leaf open) and the
 * bougainvillea along its top. The street face: the shut green sliding door on its rail, the yellow warning sign,
 * switch box, lamp and the concrete ramp. Inside, seen through the doorway: the row of yellow containers.
 * Positions are along each wall, measured from the photos at the wall's own scale (about 0.3 m).
 */
const PAVING = 0.27;
const yard = data.binYard as unknown as { front: Vec2[]; roadFace: Vec2[]; thickness: number; height: number; doorway: { at: number; width: number; height: number } };
const det = data.binStoreDetails;
const east = data.frame.east as Vec2;
type Item = { id: string; kind: string; t: number; y: number; w: number; h: number };

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
    default: return canvasTexture(8, 8, (g, W, H) => { g.fillStyle = kind === "black-box" ? "#1c1d1f" : "#f2f0ea"; g.fillRect(0, 0, W, H); });
  }
}

/** A point on a wall's outer face: `t` metres along it, pushed `out` metres out from the wall's centre line. */
function onFace(line: Vec2[], t: number, out: number, normal: Vec2): Vec2 {
  const [a, b] = line, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * t / l + normal[0] * out, a[1] + (b[1] - a[1]) * t / l + normal[1] * out];
}

export function addPicassoBinStoreDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
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

  // Bougainvillea along the top of the front, spilling over both faces.
  { const b = det.front.bougainvillea, places: { x: number; y: number; z: number; scale: number; clearance: number }[] = [];
    for (let t = b.from; t <= b.to + 1e-6; t += b.step) {
      const [x, z] = onFace(yard.front, t, 0, frontOut);
      if (keep(x, z)) places.push({ x, y: frontBase + yard.height - 0.42, z, scale: b.scale, clearance: 0.3 }); else omit(`bougainvillea@${t}`);
    }
    addSprites(root as unknown as THREE.Scene, "bougainvillea", places); }

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

  // Inside: the yellow wheeled containers along the front's inner face (IMG_3103).
  { const c = det.containers, yellow = new THREE.MeshStandardMaterial({ color: c.colour, roughness: 0.6 }), dark = new THREE.MeshStandardMaterial({ color: "#1d1d1d", roughness: 0.8 });
    for (let i = 0; i < c.count; i++) {
      const t = c.from + ((c.to - c.from) * i) / Math.max(1, c.count - 1);
      const [x, z] = onFace(yard.front, t, -(half + 0.65), frontOut);
      if (!keep(x, z)) { omit(`container@${t}`); continue; }
      const bin = new THREE.Group(); bin.name = "bin-store-container";
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 1.2), yellow); body.position.y = 0.72; bin.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.06, 1.26), yellow); lid.position.y = 1.3; bin.add(lid);
      for (const [wx, wz] of [[-0.4, -0.5], [0.4, -0.5], [-0.4, 0.5], [0.4, 0.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.1, wz); bin.add(w); }
      bin.position.set(x, frontBase, z); bin.rotation.y = turn(frontOut); bin.traverse((o) => { o.castShadow = true; }); root.add(bin);
    } }
  into.add(root);
}
