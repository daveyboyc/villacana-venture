import * as THREE from "three";
import clipping from "polygon-clipping";
import passage from "../data/south_pool_passage.json";
import sills from "../data/door_sills.json";
import skeleton from "../public/map/skeleton.json";
import { centroid } from "./geom";
import { photoTexture, plasterMaterial } from "./materials";
import type { Vec2 } from "./types";

/**
 * Calle de Jorge 39–67, the covered passage from the south-pool lawn into Pintor Dalí.
 * The axis is the placed Dalí arch (data/door_sills.json). s = 0 at that arch, positive into
 * the house; q is to the right walking toward the lawn. Estimated to about 2 m.
 */
export const SOUTH_POOL_PASSAGE = passage;
export const SOUTH_POOL_HOST = passage.hostBuilding;
const archAt = sills.approach.arch as Vec2;
const outward = sills.approach.outward as Vec2;
const forward: Vec2 = [-outward[0], -outward[1]];
const right: Vec2 = [outward[1], -outward[0]];
const L = passage.length, H = passage.halfWidth, overrun = passage.overrun;
const floorH = skeleton.floorHeight;
const bay = L / 3;

export const passageAt = (s: number, q: number): Vec2 => [
  archAt[0] + forward[0] * s + right[0] * q,
  archAt[1] + forward[1] * s + right[1] * q,
];
export const passageRect = (s0: number, s1: number, q0: number, q1: number): Vec2[] =>
  [passageAt(s0, q0), passageAt(s1, q0), passageAt(s1, q1), passageAt(s0, q1)];

/** The void, run past both faces so the boolean cut actually opens them. */
export const passageCorridor = (): Vec2[] => passageRect(-overrun, L + overrun, -H, H);
/** The middle bay is open to the sky (IMG_2640). */
export const passageCourt = (): Vec2[] => passageRect(bay + 0.15, 2 * bay - 0.15, -(H - 0.05), H - 0.05);

export function passageLocal(x: number, z: number): [number, number] {
  const dx = x - archAt[0], dz = z - archAt[1];
  return [dx * forward[0] + dz * forward[1], dx * right[0] + dz * right[1]];
}
/** True inside the void, including the short overrun outside each mouth. */
export function inSouthPoolPassage(x: number, z: number, margin = 0): boolean {
  const [s, q] = passageLocal(x, z);
  return s >= -overrun - margin && s <= L + overrun + margin && Math.abs(q) <= H + margin;
}

type Part = { ring: Vec2[]; holes: Vec2[][] };
function cut(parts: Part[], holes: Vec2[][]): Part[] {
  return parts.flatMap((p) => clipping.difference([p.ring, ...p.holes], ...holes.map((h) => [h])).map((poly) => ({
    ring: poly[0] as Vec2[], holes: poly.slice(1) as Vec2[][],
  })));
}
/** Ground storey with the passage removed. Other buildings pass through unchanged. */
export function southPoolGroundParts(b: { id: string; ring: Vec2[]; holes?: Vec2[][] }, parts: Part[]): Part[] {
  if (b.id !== SOUTH_POOL_HOST) return parts;
  return cut(parts, [passageCorridor()]);
}
/** Upper storey: solid roof, with the photographed open court taken out. */
export function southPoolUpperParts(b: { id: string; ring: Vec2[]; holes?: Vec2[][] }): Part[] {
  return cut([{ ring: b.ring, holes: b.holes ?? [] }], [passageCourt()]);
}

const host = skeleton.buildings.find((b) => b.id === SOUTH_POOL_HOST)!;
const passageBase = (): Vec2 => { const c = centroid(host.ring as Vec2[]); return [c.x, c.z]; };
const yaw = Math.atan2(forward[0], forward[1]);

function turnedBox(s0: number, s1: number, q0: number, q1: number, y0: number, y1: number, material: THREE.Material | THREE.Material[], name: string): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(q1 - q0, y1 - y0, s1 - s0), material);
  const c = passageAt((s0 + s1) / 2, (q0 + q1) / 2);
  mesh.position.set(c[0], (y0 + y1) / 2, c[1]);
  mesh.rotation.y = yaw;
  mesh.name = name; mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function repeated(name: "terracotta" | "crazy-paving", across: number, along: number): THREE.MeshStandardMaterial {
  const map = photoTexture(name).clone();
  map.repeat.set(across / (name === "terracotta" ? 3.2 : 2), along / (name === "terracotta" ? 3.2 : 2));
  map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map, roughness: 0.9 });
}

/** A wall across the passage with a semicircular opening. Local +x is across, extrude runs inward. */
function archWall(s: number, name: string, material: THREE.Material): THREE.Mesh {
  const a = passage.arch, span = H - a.pier;
  const shape = new THREE.Shape();
  shape.moveTo(-H, 0); shape.lineTo(-H, floorH); shape.lineTo(H, floorH); shape.lineTo(H, 0); shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-span, 0); hole.lineTo(span, 0); hole.lineTo(span, a.spring);
  for (let k = 0; k <= 18; k++) {
    const t = (Math.PI * k) / 18;
    hole.lineTo(Math.cos(t) * span, a.spring + Math.sin(t) * (a.crown - a.spring));
  }
  hole.closePath();
  shape.holes.push(hole);
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: a.thickness, bevelEnabled: false }), material);
  const p = passageAt(s, 0);
  mesh.position.set(p[0], 0, p[1]); mesh.rotation.y = yaw;
  mesh.name = name; mesh.castShadow = true;
  return mesh;
}

function plaqueTexture(): THREE.CanvasTexture {
  const lines = ["67  39", "CALLE", "DE", "JORGE"];
  const c = document.createElement("canvas"); c.width = 360; c.height = 520;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 360, 520);
  lines.forEach((line, i) => {
    const y = 16 + i * 126;
    g.fillStyle = "#161616"; g.fillRect(40, y, 280, 108);
    g.strokeStyle = "#f4f1ea"; g.lineWidth = 6; g.strokeRect(52, y + 12, 256, 84);
    g.fillStyle = "#f7f4ee"; g.font = "bold 54px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(line, 180, y + 58);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Floor, flat ceilings, the three arches, the iron gate and the plaque. Furniture is Details only. */
export function addSouthPoolPassage(scene: THREE.Scene): void {
  const group = new THREE.Group(); group.name = passage.id;
  group.userData.base = passageBase();
  scene.add(group);
  const white = plasterMaterial("#fbfaf4");
  const a = passage.arch;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * H, L).rotateX(-Math.PI / 2), repeated("terracotta", 2 * H, L));
  const mid = passageAt(L / 2, 0);
  floor.position.set(mid[0], 0.03, mid[1]); floor.rotation.y = yaw; floor.receiveShadow = true; floor.name = passage.id + "-floor";
  group.add(floor);
  // Covered bays only. The middle third is the open court.
  for (const [s0, s1, name] of [[a.thickness, bay, "bay-1"], [2 * bay, L - 0.05, "bay-3"]] as [number, number, string][]) {
    group.add(turnedBox(s0, s1, -H, H, 2.62, floorH, white, passage.id + "-ceiling-" + name));
  }
  group.add(archWall(0, passage.id + "-arch-dali", white));
  group.add(archWall(bay, passage.id + "-arch-court-1", white));
  group.add(archWall(2 * bay, passage.id + "-arch-court-2", white));
  // Lawn apron: crazy paving just outside the gate (IMG_2642), on the same house datum.
  const apronLen = 3.2, apron = new THREE.Mesh(new THREE.PlaneGeometry(2.4, apronLen).rotateX(-Math.PI / 2), repeated("crazy-paving", 2.4, apronLen));
  const ac = passageAt(L + apronLen / 2, 0);
  apron.position.set(ac[0], 0.02, ac[1]); apron.rotation.y = yaw; apron.receiveShadow = true; apron.name = passage.id + "-apron";
  group.add(apron);
  // Open iron gate: barred leaves swung back so the lawn shows through (IMG_2641).
  const iron = new THREE.MeshStandardMaterial({ color: "#1c2420", roughness: 0.45, metalness: 0.35 });
  const leaf = (side: number) => {
    const g = new THREE.Group();
    const toward = side > 0 ? 1 : -1; // local +x is to the left of the inward axis
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.65, 0.02), iron);
      bar.position.set(toward * (0.12 + i * 0.15), 0.9, 0); g.add(bar);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.02), iron);
    rail.position.set(toward * 0.42, 1.62, 0); g.add(rail);
    const hinge = passageAt(L - 0.15, side * (H - a.pier));
    g.position.set(hinge[0], 0, hinge[1]); g.rotation.y = yaw + side * 1.15;
    g.name = passage.id + "-gate";
    return g;
  };
  group.add(leaf(-1), leaf(1));
  if (scene.userData.layoutOnly) return;
  const wood = new THREE.MeshStandardMaterial({ color: "#6b4228", roughness: 0.72 });
  group.add(turnedBox(1.6, 2.9, H - 0.12, H - 0.02, 0.02, 2.15, wood, passage.id + "-door-1"));
  group.add(turnedBox(bay + 1.4, bay + 2.6, H - 0.12, H - 0.02, 0.02, 2.15, wood, passage.id + "-door-2"));
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.05), new THREE.MeshStandardMaterial({ map: plaqueTexture(), transparent: true, roughness: 0.5 }));
  const pc = passageAt(L - 1.15, H - 0.06);
  plaque.position.set(pc[0], 1.55, pc[1]); plaque.rotation.y = yaw + Math.PI / 2; plaque.name = passage.id + "-plaque";
  group.add(plaque);
  const lamp = new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.4 });
  group.add(turnedBox(bay / 2 - 0.12, bay / 2 + 0.12, -0.12, 0.12, 2.25, 2.55, lamp, passage.id + "-lantern"));
  const green = new THREE.MeshStandardMaterial({ color: "#3f6a3c", roughness: 0.9 });
  for (const q of [-1, 1]) {
    for (const s0 of [0.8, 4.2, bay + 0.6, bay + 3.2, 2 * bay + 0.8, 2 * bay + 3.4]) {
      group.add(turnedBox(s0, s0 + 1.3, q * (H - 0.38), q * (H - 0.06), 0.02, 0.42, white, passage.id + "-planter"));
      group.add(turnedBox(s0 + 0.15, s0 + 1.15, q * (H - 0.34), q * (H - 0.1), 0.42, 0.78, green, passage.id + "-planting"));
    }
  }
}
