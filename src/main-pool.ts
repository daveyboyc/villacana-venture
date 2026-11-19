import {plasterMaterial} from "./materials";
import * as THREE from "three";
import { centroid, pointInRing } from "./geom";
import type { SkeletonBuilding, Vec2 } from "./types";
import { LOWER_POOL_Y, POOL_TERRACE_ID } from "./pool-levels";
import layout from "../data/main_pool.json";
import { boxAwning } from "./main-pool-lawn";

/** The two tall white triangular walls that stand above the restaurant roof. */
export function addRoofFins(scene: THREE.Scene): void {
  const angle = 26 * Math.PI / 180, white = plasterMaterial("#fffdf5");
  white.side = THREE.DoubleSide;
  const turn = ([x, z]: number[]): Vec2 => [x * Math.cos(angle) + z * Math.sin(angle), -x * Math.sin(angle) + z * Math.cos(angle)];
  for (const fin of layout.roofFins.fins) {
    const line = fin.line.map(turn);
    const lengths = line.map((p, i) => i ? Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) : 0), total = lengths.reduce((a, b) => a + b, 0);
    // Walk the line in short steps so the top edge can swoop.
    const steps = 28, cut: { x: number; z: number; y: number }[] = [];
    for (let k = 0; k <= steps; k++) {
      const s = k / steps;
      let left = s * total, i = 1;
      while (i < line.length - 1 && left > lengths[i]) left -= lengths[i++];
      const f = left / lengths[i];
      cut.push({ x: line[i - 1][0] + (line[i][0] - line[i - 1][0]) * f, z: line[i - 1][1] + (line[i][1] - line[i - 1][1]) * f,
        y: Math.max(fin.base, fin.heights[0] + (fin.heights[1] - fin.heights[0]) * s - fin.sag * 4 * s * (1 - s)) });
    }
    const positions: number[] = [];
    for (let k = 0; k < steps; k++) {
      const a = cut[k], b = cut[k + 1];
      positions.push(a.x, fin.base, a.z, b.x, fin.base, b.z, a.x, a.y, a.z, a.x, a.y, a.z, b.x, fin.base, b.z, b.x, b.y, b.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const at = geometry.getAttribute("position"), uvs: number[] = [];
    for (let v = 0; v < at.count; v++) uvs.push(at.getX(v) + at.getZ(v), at.getY(v));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, white);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
  // The tall white block at the east end, where the weathervane stands.
  const tower = layout.roofFins.tower, [tx, tz] = turn(tower.at);
  const block = new THREE.Mesh(new THREE.BoxGeometry(tower.size, tower.height, tower.size), white);
  block.position.set(tx, tower.height / 2, tz);
  block.rotation.y = -angle;
  block.castShadow = block.receiveShadow = true;
  scene.add(block);
}

/** Dress the surveyed restaurant footprints, without moving their walls. */
export function addMainPoolTerraces(scene: THREE.Scene, buildings: SkeletonBuilding[], pool: { x: number; z: number }): void {
  const white = plasterMaterial("#fffdf5");
  const glass = new THREE.MeshStandardMaterial({ color: "#284b58", roughness: 0.2, metalness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: "#333a36", roughness: 0.85 });
  for (const building of buildings) {
    if(building.id!==POOL_TERRACE_ID) continue;
    const ring = building.ring;
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 4) continue;
      let nx = (bz - az) / length, nz = -(bx - ax) / length;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      if (pointInRing(mx + nx * 0.2, mz + nz * 0.2, ring)) { nx = -nx; nz = -nz; }
      const toward = Math.hypot(pool.x - mx, pool.z - mz);
      if (((pool.x - mx) * nx + (pool.z - mz) * nz) / toward < 0.45) continue;
      if (buildings.some((other) => other !== building && pointInRing(mx + nx * 0.4, mz + nz * 0.4, other.ring))) continue;
      const face = new THREE.Group();
      face.position.set(mx, 0, mz);
      face.rotation.y = Math.atan2(nx, nz);
      scene.add(face);
      const box = (material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; face.add(mesh);
      };
      // Dark restaurant glazing with white mullions and a continuous balcony fascia.
      box(glass, 0, LOWER_POOL_Y+1.4, 0.035, length - 0.4, 2.0, 0.06);
      for (let x = -length / 2 + 0.2; x < length / 2; x += 1.6) box(white, x, LOWER_POOL_Y+1.4, 0.09, 0.08, 2.15, 0.1);
      box(white, 0, -0.25, 0.32, length, 0.5, 0.7);
      box(white, 0, 0.55, 0.35, length, 0.75, 0.16);
      if(scene.userData.layoutOnly)continue;
      // Simple cafe tables on the terrace. The blue fabric canopies once drawn over them (October web views) are
      // gone: no photo shows them, and the blue in IMG_2765 and IMG_3076 is the signboards on the upper glazing (addClubhouseFront).
      for (let x = -length / 2 + 1.8; x < length / 2 - 1; x += 3.2) {
        box(dark, x, 0.8, -0.8, 0.85, 0.06, 0.85);
        box(dark, x, 0.4, -0.8, 0.07, 0.8, 0.07);
        for (const offset of [-0.7, 0.7]) {
          box(dark, x + offset, 0.45, -0.8, 0.45, 0.06, 0.45);
          box(dark, x + offset, 0.72, -0.57, 0.45, 0.55, 0.05);
        }
      }
    }
  }
}

/**
 * The clubhouse's upper storey seen across the pool (data/main_pool.json clubhouseFront; Dave, 2026-11-19: no
 * windows, blue covers in the wrong place). Its pool faces are glazed end to end with white mullions (IMG_2765,
 * IMG_3076); three blue box awnings with lettered valances run along the top of the left wing's glazing and slim dark awnings shade the
 * right (east) wing. The registry volumes are kept; only their faces are dressed. Signs and awnings are details.
 */
export function addClubhouseFront(scene: THREE.Scene, buildings: SkeletonBuilding[], pool: { x: number; z: number }, details: boolean): void {
  const spec = layout.clubhouseFront, upper = buildings.filter((b) => spec.upperIds.includes(b.id));
  const glass = new THREE.MeshStandardMaterial({ color: "#2f4f5c", roughness: 0.15, metalness: 0.35 });
  const frame = plasterMaterial("#fffdf5"), dark = new THREE.MeshStandardMaterial({ color: "#22262a", roughness: 0.8 });
  const { sill, head, mullion } = spec.glazing;
  for (const b of upper) {
    const c = centroid(b.ring), group = new THREE.Group();
    group.name = `clubhouse-front:${b.id}`; group.position.y = scene.getObjectByName(`building:${b.id}`)?.position.y ?? 0; group.userData.base = [c.x, c.z];
    const faces: { a: Vec2; b: Vec2; n: Vec2; length: number; index: number }[] = [];
    b.ring.forEach((a, i) => {
      const e = b.ring[(i + 1) % b.ring.length], length = Math.hypot(e[0] - a[0], e[1] - a[1]);
      if (length < 0.8) return;
      let nx = (e[1] - a[1]) / length, nz = -(e[0] - a[0]) / length;
      const mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2;
      if (pointInRing(mx + nx * 0.2, mz + nz * 0.2, b.ring)) { nx = -nx; nz = -nz; }
      const toward = Math.hypot(pool.x - mx, pool.z - mz);
      if (((pool.x - mx) * nx + (pool.z - mz) * nz) / toward < 0.3) return;
      // A face hidden behind another upper-storey part (part5 behind the front strips) stays plain.
      if (upper.some((o) => o !== b && pointInRing(mx + nx * 0.4, mz + nz * 0.4, o.ring))) return;
      faces.push({ a, b: e, n: [nx, nz], length, index: i });
    });
    const put = (f: (typeof faces)[number], material: THREE.Material, t: number, y: number, w: number, h: number, d: number, out: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(f.a[0] + (f.b[0] - f.a[0]) * t + f.n[0] * out, y, f.a[1] + (f.b[1] - f.a[1]) * t + f.n[1] * out);
      mesh.rotation.y = Math.atan2(f.n[0], f.n[1]); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); return mesh;
    };
    for (const f of faces) {
      put(f, glass, 0.5, (sill + head) / 2, f.length - 0.08, head - sill, 0.05, 0.03).name = "clubhouse-glazing";
      const bays = Math.max(1, Math.round(f.length / mullion));
      for (let k = 0; k <= bays; k++) put(f, frame, k / bays, (sill + head) / 2, 0.07, head - sill, 0.08, 0.05).name = "clubhouse-mullion";
      put(f, frame, 0.5, sill - 0.04, f.length, 0.08, 0.12, 0.06).name = "clubhouse-sill";
      put(f, frame, 0.5, head + 0.04, f.length, 0.08, 0.12, 0.06).name = "clubhouse-transom";
    }
    if (!details) { scene.add(group); continue; }
    // Signboards: fractions of the sign wing's glazed pool face, measured from its south-west end (by the stairs).
    if (b.id === spec.signWing && faces.length) {
      const run = [...faces].sort((p, q) => (p.a[1] + p.b[1]) - (q.a[1] + q.b[1])).reverse();
      const total = run.reduce((t, f) => t + f.length, 0);
      for (const [text, centre, share] of spec.signs as [string, number, number][]) {
        let left = centre * total, f = run[0];
        for (const g of run) { f = g; if (left <= g.length) break; left -= g.length; }
        // The run goes from each face's south-west end; faces wind north-east (a to b) or the other way.
        const fromSouth = f.a[1] > f.b[1] ? left / f.length : 1 - left / f.length;
        const awning = boxAwning(text, Math.min(share * total, f.length + 1.2)); awning.name = "clubhouse-blue-awning";
        awning.position.set(f.a[0] + (f.b[0] - f.a[0]) * fromSouth + f.n[0] * 0.08, head + 0.3, f.a[1] + (f.b[1] - f.a[1]) * fromSouth + f.n[1] * 0.08);
        awning.rotation.y = Math.atan2(f.n[0], f.n[1]); group.add(awning);
      }
    }
    for (const f of spec.awningParts.includes(b.id) ? faces.filter((g) => g.length >= 2) : []) {
      const awning = put(f, dark, 0.5, head + 0.12, f.length - 0.3, 0.05, 1.0, 0.5); awning.rotation.x = 0; awning.name = "clubhouse-awning";
      awning.rotateX(0.18);
    }
    scene.add(group);
  }
}

/** The sea follows the existing OSM coastline; the web photos set its colour. */
export function addSeafront(scene: THREE.Scene, coast: Vec2[]): void {
  const ring: Vec2[] = [...coast, [1500, 1500], [-1500, 1500]];
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const sea = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#147ba8", roughness: 0.3, metalness: 0.15 }));
  sea.position.y = 0.12; scene.add(sea);
  const sand = new THREE.MeshStandardMaterial({ color: "#e1c99c", roughness: 1 });
  const foam = new THREE.MeshBasicMaterial({ color: "#d7f1ec", transparent: true, opacity: 0.65 });
  for (let i = 0; i < coast.length - 1; i++) {
    const [ax, az] = coast[i], [bx, bz] = coast[i + 1];
    const length = Math.hypot(bx - ax, bz - az);
    const nx = (bz - az) / length, nz = -(bx - ax) / length;
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(length + 1, 10).rotateX(-Math.PI / 2), sand);
    beach.rotation.y = -Math.atan2(bz - az, bx - ax);
    beach.position.set((ax + bx) / 2 + nx * 5, 0.14, (az + bz) / 2 + nz * 5); scene.add(beach);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(length + 1, 0.7).rotateX(-Math.PI / 2), foam);
    edge.rotation.y = beach.rotation.y; edge.position.set((ax + bx) / 2, 0.16, (az + bz) / 2); scene.add(edge);
  }
}
