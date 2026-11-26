import * as THREE from "three";
import data from "../data/picasso_beach_lane.json";
import skeleton from "../public/map/skeleton.json";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * Calle Pintor Picasso from the hotel's low block to the paseo (data/picasso_beach_lane.json): the white tower at the
 * north-west end of the pool building's sheds, the low terrace wall and deep eaves along the long building on the
 * lane's east side (registry strip 6465801UF1366N_part2), and, in Show details, the bollard and drain grate at the
 * lane's mouth. The road and lane are streets (data/street_layout.json); the forecourt is a ground-plan apron.
 */
const PAVING = 0.27;
const tower = data.tower, terrace = data.eastTerrace;
const terraceRing = terrace.ring as Vec2[];

/** The tower's square footprint, turned to the shed strip. */
function towerRing(): Vec2[] {
  const [cx, cz] = tower.centre, h = tower.size / 2, a = (tower.turn * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c] as Vec2);
}

/** The terrace wall runs along the strip's lane (south-west) edge: the ring's longest side facing away from the building. */
function terraceWallLine(): Vec2[] {
  // Registry ring: [29.6,94.5] -> [14.7,77.2] -> [12.3,74.5] -> ... ; its first two edges are the lane side.
  return terraceRing.slice(0, 3);
}

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / length * thickness / 2, nz = -(b[0] - a[0]) / length * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

/** Collision: the tower and the terrace wall. */
export function picassoBeachLaneRings(): Vec2[][] {
  const w = terraceWallLine();
  return [towerRing(), ...w.slice(1).map((p, i) => strip(w[i], p, terrace.wallThickness))];
}

/** Plan outlines for the map. */
export function picassoBeachLanePlan(): { id: string; name: string; ring: Vec2[]; fill: string }[] {
  const w = terraceWallLine();
  return [
    { id: tower.id, name: tower.name, ring: towerRing(), fill: "#f7f4ee" },
    { id: terrace.id, name: terrace.name, ring: terraceRing, fill: "#e6dfd2" },
    ...w.slice(1).map((p, i) => ({ id: terrace.id, name: terrace.name, ring: strip(w[i], p, terrace.wallThickness), fill: "#f7f4ee" })),
  ];
}

/** The model's roof height of the long building behind the terrace (registry part 3): ground at its centroid plus its storeys. */
function hostRoof(): number {
  const host = (skeleton.buildings as { id: string; ring: number[][]; floors?: number }[]).find((b) => b.id === "6465801UF1366N_part3");
  if (!host) return 1.4;
  const cx = host.ring.reduce((s, p) => s + p[0], 0) / host.ring.length, cz = host.ring.reduce((s, p) => s + p[1], 0) / host.ring.length;
  return siteY(cx, cz) + (host.floors ?? 1) * skeleton.floorHeight;
}

export function addPicassoBeachLane(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = data.id; group.userData.noDrape = true; group.userData.structural = true;
  const white = plasterMaterial("#f4f1e8");

  // The tower: a level-topped white block from below the lowest ground under it (the lawn side is lower).
  { const ring = towerRing(), foot = Math.min(...ring.map(([x, z]) => siteY(x, z))) - 0.2, top = tower.top + PAVING;
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: top - foot, bevelEnabled: false }), white);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = foot; mesh.name = tower.id; mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh); }

  // The terrace: a low white wall with a red coping along the lane edge, and the eaves slab over the strip at the
  // building's modelled roofline.
  const coping = new THREE.MeshStandardMaterial({ color: terrace.coping, roughness: 0.9 });
  const line = terraceWallLine();
  line.slice(1).forEach((b, i) => {
    const a = line[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ground = Math.min(siteY(a[0], a[1]), siteY(b[0], b[1])) + PAVING;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length, terrace.wallHeight + 0.3, terrace.wallThickness), white);
    wall.position.set((a[0] + b[0]) / 2, ground + (terrace.wallHeight - 0.3) / 2, (a[1] + b[1]) / 2);
    wall.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); wall.name = terrace.id; wall.castShadow = wall.receiveShadow = true; group.add(wall);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(length + 0.04, 0.06, terrace.wallThickness + 0.06), coping);
    cap.position.set(wall.position.x, ground + terrace.wallHeight + 0.03, wall.position.z); cap.rotation.y = wall.rotation.y; cap.name = `${terrace.id}-coping`; group.add(cap);
  });
  { const roof = hostRoof(), shape = new THREE.Shape(terraceRing.map(([x, z]) => new THREE.Vector2(x, -z)));
    const eaves = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: terrace.eavesThickness, bevelEnabled: false }), white);
    eaves.rotation.x = -Math.PI / 2; eaves.position.y = roof - terrace.eavesThickness; eaves.name = `${terrace.id}-eaves`; eaves.castShadow = eaves.receiveShadow = true;
    group.add(eaves); }

  scene.add(group);
}

/** Show details: the bollard and drain grate at the lane's mouth. */
export function addPicassoBeachLaneDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const root = new THREE.Group(); root.name = `${data.id}-details`; root.userData.noDrape = true;
  const m = data.mouth;
  { const [x, z] = m.bollard as Vec2;
    if (keep(x, z)) {
      const b = new THREE.Group(); b.name = "picasso-lane-bollard";
      const blue = new THREE.MeshStandardMaterial({ color: "#1f63c6", roughness: 0.5 }), whiteBand = new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: 0.5 });
      for (let i = 0; i < 5; i++) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 16), i % 2 ? whiteBand : blue);
        band.position.y = 0.08 + i * 0.16; b.add(band);
      }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), blue); cap.position.y = 0.8; b.add(cap);
      b.position.set(x, siteY(x, z) + PAVING, z); b.traverse((o) => { o.castShadow = true; }); root.add(b);
    } }
  { const [x, z] = m.grate.centre as Vec2;
    if (keep(x, z)) {
      // Across the lane: perpendicular to its last stretch.
      const lane = (skeleton.streets as { id: string; points: number[][] }[]).find((s) => s.id === "picasso-beach-lane");
      const pts = lane ? lane.points.slice(-2) : [[0, 0], [1, 1]];
      const dir = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
      const grate = new THREE.Mesh(new THREE.BoxGeometry(m.grate.width, 0.02, m.grate.length), new THREE.MeshStandardMaterial({ color: "#3b3936", roughness: 0.6, metalness: 0.5 }));
      grate.position.set(x, siteY(x, z) + PAVING + 0.012, z); grate.rotation.y = -dir; grate.name = "picasso-lane-grate"; root.add(grate);
    } }
  into.add(root);
}
