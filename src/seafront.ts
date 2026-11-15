import * as THREE from "three";
import { centroid, closestOnSegment } from "./geom";
import type { Seaside } from "./seaside";
import type { Seafront, Vec2 } from "./types";

function flat(scene: THREE.Scene, ring: Vec2[], color: string, height: number, noDrape = false): void {
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  mesh.position.y = height; mesh.receiveShadow = true; mesh.userData.noDrape = noDrape; scene.add(mesh);
}

/** Weathered deck boards, running across the terrace. Schematic, from IMG_2606. */
function plankTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#b08968"; g.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 32) {
    g.fillStyle = x % 64 ? "#c4a27a" : "#9a7352";
    g.fillRect(x + 1, 0, 28, 128);
    g.strokeStyle = "#6e5340"; g.lineWidth = 2; g.strokeRect(x + 1, 0, 28, 128);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.35, 0.35);
  return t;
}

function outline(scene: THREE.Scene, points: Vec2[], color: string, height: number, closed = false, noDrape = false): void {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints((closed ? [...points, points[0]] : points).map(([x, z]) => new THREE.Vector3(x, height, z))), new THREE.LineBasicMaterial({ color }));
  line.userData.noDrape = noDrape; scene.add(line);
}

/**
 * Barraka's timber deck: a quad subdivided to about 1 m, each vertex 0.16 m above the beach.
 * Fascia on the outer edge and the two ends only. The wall edge is the one against the building.
 */
function addBarrakaDeck(scene: THREE.Scene, terrace: Vec2[], ring: Vec2[], ground: (x: number, z: number) => number, noDrape: boolean): void {
  const group = new THREE.Group(); group.name = "barraka-deck"; group.userData.noDrape = noDrape; scene.add(group);
  const deckY = (x: number, z: number) => ground(x, z) + 0.16;
  const [a, b, c, d] = terrace;
  const along = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const across = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
  const nu = Math.max(1, Math.round(along)), nv = Math.max(1, Math.round(across));
  const mix = (p: Vec2, q: Vec2, t: number): Vec2 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const at = (u: number, v: number): Vec2 => mix(mix(a, b, u), mix(d, c, u), v);
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const id = (i: number, j: number) => i * (nv + 1) + j;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const [x, z] = at(i / nu, j / nv);
    positions.push(x, deckY(x, z), z); uvs.push(i / nu, j / nv);
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const k = id(i, j), k1 = id(i + 1, j), k2 = id(i, j + 1), k3 = id(i + 1, j + 1);
    indices.push(k, k2, k1, k1, k2, k3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const deck = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.9, side: THREE.DoubleSide }));
  deck.name = "barraka-deck"; deck.receiveShadow = true; deck.userData.noDrape = noDrape; group.add(deck);

  let wall = 0, wallD = Infinity;
  const centre = centroid(terrace);
  for (let i = 0; i < terrace.length; i++) {
    const p = terrace[i], q = terrace[(i + 1) % terrace.length];
    const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
    let dist = Infinity;
    for (let j = 0; j < ring.length; j++) {
      const e = ring[j], f = ring[(j + 1) % ring.length];
      dist = Math.min(dist, closestOnSegment(mx, mz, e[0], e[1], f[0], f[1]).d);
    }
    if (dist < wallD) { wallD = dist; wall = i; }
  }
  const fascia: number[] = [];
  const quad = (px: number, py: number, pz: number, qx: number, qy: number, qz: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number) => {
    fascia.push(px, py, pz, qx, qy, qz, rx, ry, rz, px, py, pz, rx, ry, rz, sx, sy, sz);
  };
  for (let i = 0; i < terrace.length; i++) {
    if (i === wall) continue;
    const p = terrace[i], q = terrace[(i + 1) % terrace.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    let nx = -(q[1] - p[1]) / len, nz = (q[0] - p[0]) / len;
    const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
    if (nx * (centre.x - mx) + nz * (centre.z - mz) < 0) { nx = -nx; nz = -nz; }
    const n = Math.max(1, Math.round(len));
    for (let s = 0; s < n; s++) {
      const sample = (t: number) => {
        const x = p[0] + (q[0] - p[0]) * t, z = p[1] + (q[1] - p[1]) * t;
        const ix = x + nx * 0.08, iz = z + nz * 0.08;
        return { x, z, top: deckY(x, z), bot: ground(x, z) - 0.02, ix, iz, itop: deckY(ix, iz), ibot: ground(ix, iz) - 0.02 };
      };
      const u = sample(s / n), v = sample((s + 1) / n);
      quad(u.x, u.bot, u.z, v.x, v.bot, v.z, v.x, v.top, v.z, u.x, u.top, u.z);
      quad(v.ix, v.ibot, v.iz, u.ix, u.ibot, u.iz, u.ix, u.itop, u.iz, v.ix, v.itop, v.iz);
      quad(u.x, u.bot, u.z, u.ix, u.ibot, u.iz, v.ix, v.ibot, v.iz, v.x, v.bot, v.z);
    }
  }
  const fasciaGeo = new THREE.BufferGeometry();
  fasciaGeo.setAttribute("position", new THREE.Float32BufferAttribute(fascia, 3)); fasciaGeo.computeVertexNormals();
  const fasciaMesh = new THREE.Mesh(fasciaGeo, new THREE.MeshStandardMaterial({ color: "#9a7352", roughness: 0.85, side: THREE.DoubleSide }));
  fasciaMesh.name = "barraka-deck-fascia"; fasciaMesh.castShadow = fasciaMesh.receiveShadow = true; fasciaMesh.userData.noDrape = noDrape; group.add(fasciaMesh);

  const line: THREE.Vector3[] = [];
  for (let i = 0; i < terrace.length; i++) {
    const p = terrace[i], q = terrace[(i + 1) % terrace.length];
    const n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1])));
    for (let s = 0; s < n; s++) {
      const t = s / n, x = p[0] + (q[0] - p[0]) * t, z = p[1] + (q[1] - p[1]) * t;
      line.push(new THREE.Vector3(x, deckY(x, z) + 0.02, z));
    }
  }
  line.push(line[0].clone());
  const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(line), new THREE.LineBasicMaterial({ color: "#6d5a42" }));
  edge.userData.noDrape = noDrape; group.add(edge);
}

/** Shared seaside geometry: the blueprint and walk use the same outlines. */
export function addSeafrontOutlines(scene: THREE.Scene, sf: Seafront, restaurant = true, seaside?: Seaside): void {
  // With seaside heights the sand and paseo are drawn by addSeaside; only the sea is flat.
  // The sea stays at sea level: it is not draped over the land's heights.
  flat(scene, [...sf.coast, [1500, 1500], [-1500, 1500]], "#147ba8", seaside ? seaside.seaY : 0.12, true);
  if (!seaside) {
    flat(scene, sf.beach.ring, "#e1c99c", 0.14);
    outline(scene, sf.coast, "#e2f9f5", 0.17);
    // A continuous ribbon along the mapped paseo, with joined corners.
    const points = sf.paseo.points;
    const side = (sign: number): Vec2[] => points.map(([x,z], i) => {
      const a = points[Math.max(0,i-1)], b = points[Math.min(points.length-1,i+1)];
      const length = Math.hypot(b[0]-a[0],b[1]-a[1]) || 1;
      return [x + sign*(b[1]-a[1])/length*sf.paseo.width/2, z-sign*(b[0]-a[0])/length*sf.paseo.width/2];
    });
    const path = [...side(1), ...side(-1).reverse()];
    flat(scene,path,"#ce9878",0.18);
    outline(scene,path,"#f2debb",0.2,true);
  }
  if (!restaurant) return;
  // The restaurant stands on the sand, at whatever height the beach has there.
  // That height is final: the survey grid is not added again, or the pad sinks.
  const c = centroid(sf.restaurant.ring), base = seaside ? seaside.y(c.x, c.z) : 0;
  // Timber deck along the seaward wall (IMG_2606). Each vertex sits on the beach there, so the east end is not buried.
  addBarrakaDeck(scene, sf.restaurant.terrace, sf.restaurant.ring, (x, z) => seaside ? seaside.y(x, z) : base, !!seaside);
  // The parapet, clerestory, awnings and thatched eaves are the building itself (src/barraka-facade.ts).
}
