import * as THREE from "three";

/**
 * A candelabra tree (Euphorbia), as in IMG_2183 and IMG_2233 behind the Calle Jorge wall: a few pale
 * woody trunks, each carrying arms that sweep out and curve up into a broad domed crown. Every stem is
 * one smooth tube along a curve with a four-winged cross-section, scalloped wing edges, growth
 * constrictions and a rounded tip. Built from numbers and seeded, so it is the same on every load.
 * An original illustrative model of the plant type, not a scan. Local frame: y up, standing on y = 0.
 */
export type CandelabraOptions = { height: number; spread: number; seed: number; trunks?: number };

const RADIAL = 16, WINGS = 4, RING_STEP = 0.07;
const BARK = new THREE.Color("#b0ab98"), GREEN = new THREE.Color("#7d9273"), GROOVE = new THREE.Color("#5b7058"), RIDGE = new THREE.Color("#a5b295");

type Stem = { curve: THREE.Curve<THREE.Vector3>; radius: (t: number) => number; woody: (t: number) => number; tint: number; phase: number };

function rng(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** Append one stem to the shared buffers: rings of RADIAL vertices along the curve, wrapped so normals are smooth. */
function addStem(stem: Stem, pos: number[], col: number[], idx: number[]): void {
  const length = stem.curve.getLength(), rings = Math.max(8, Math.ceil(length / RING_STEP));
  const base = pos.length / 3, tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), prev = new THREE.Vector3();
  const p = new THREE.Vector3(), v = new THREE.Vector3(), q = new THREE.Quaternion(), c = new THREE.Color();
  const tipLength = 0.1;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, s = t * length;
    stem.curve.getPointAt(t, p); stem.curve.getTangentAt(t, tangent).normalize();
    if (i === 0) {
      normal.set(1, 0, 0); if (Math.abs(tangent.x) > 0.9) normal.set(0, 0, 1);
      normal.sub(tangent.clone().multiplyScalar(normal.dot(tangent))).normalize();
    } else {
      // Parallel transport: carry the frame round the bend without twisting it.
      q.setFromUnitVectors(prev, tangent); normal.applyQuaternion(q).normalize();
    }
    prev.copy(tangent); binormal.crossVectors(tangent, normal);
    const woody = stem.woody(t);
    // Growth constrictions every 0.55 m or so, and a rounded tip.
    const waist = 1 - 0.16 * Math.pow(Math.abs(Math.cos(Math.PI * (s / 0.55 + stem.phase))), 10) * (1 - woody);
    const fromTip = length - s, tip = fromTip < tipLength ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - fromTip / tipLength, 2))) : 1;
    const outer = stem.radius(t) * waist * Math.max(tip, 0.02);
    // Old wood fills out between the wings; green stems are deeply winged with scalloped edges.
    const core = 0.5 + 0.38 * woody, scallop = 1 + 0.07 * (1 - woody) * Math.sin((s / 0.21 + stem.phase) * Math.PI * 2);
    for (let j = 0; j < RADIAL; j++) {
      const a = (j / RADIAL) * Math.PI * 2, ridge = Math.pow(0.5 + 0.5 * Math.cos(WINGS * a), 1.5);
      const r = outer * (core + (1 - core) * ridge * scallop);
      v.copy(p).addScaledVector(normal, Math.cos(a) * r).addScaledVector(binormal, Math.sin(a) * r);
      pos.push(v.x, v.y, v.z);
      // Darker in the grooves, paler on the wing edges; old wood greys out.
      c.copy(GROOVE).lerp(GREEN, Math.min(1, ridge * 1.6)).lerp(RIDGE, Math.max(0, ridge - 0.75) * 2.2);
      c.offsetHSL(0, 0, stem.tint).lerp(BARK, woody * (0.75 + 0.25 * ridge));
      col.push(c.r, c.g, c.b);
    }
    if (i < rings) for (let j = 0; j < RADIAL; j++) {
      const a0 = base + i * RADIAL + j, a1 = base + i * RADIAL + ((j + 1) % RADIAL), b0 = a0 + RADIAL, b1 = a1 + RADIAL;
      idx.push(a0, b0, a1, a1, b0, b1);
    }
  }
  // Close the tip with a centre point.
  const apex = pos.length / 3; stem.curve.getPointAt(1, p); pos.push(p.x, p.y, p.z); c.copy(GREEN).offsetHSL(0, 0, stem.tint); col.push(c.r, c.g, c.b);
  for (let j = 0; j < RADIAL; j++) idx.push(base + rings * RADIAL + j, apex, base + rings * RADIAL + ((j + 1) % RADIAL));
}

export function candelabraCactus(o: CandelabraOptions): THREE.Mesh {
  const rand = rng(o.seed), H = o.height, R = o.spread / 2, stems: Stem[] = [];
  /** Crown surface: a broad dome, highest in the middle. */
  const crownTop = (d: number) => H * (1 - 0.2 * Math.pow(Math.min(1, d / R), 2)) * (0.93 + rand() * 0.07);
  /** An arm that leaves `from` along `out`, sweeps outward and curves up to the crown at distance `reach` from the axis. */
  const arm = (from: THREE.Vector3, out: THREE.Vector3, reach: number, radius: number, depth: number): void => {
    const start = Math.hypot(from.x, from.z), run = Math.max(0.25, reach - start);
    const end = new THREE.Vector3(from.x + out.x * run, 0, from.z + out.z * run); end.y = Math.max(from.y + 1.1, crownTop(Math.hypot(end.x, end.z)));
    const rise = end.y - from.y;
    // Out and slightly up first, then the turn, then nearly straight up with a little outward lean.
    const pts = [from.clone(),
      new THREE.Vector3(from.x + out.x * run * 0.42, from.y + rise * 0.08 + 0.05, from.z + out.z * run * 0.42),
      new THREE.Vector3(from.x + out.x * run * 0.78, from.y + rise * 0.3, from.z + out.z * run * 0.78),
      new THREE.Vector3(from.x + out.x * run * 0.93, from.y + rise * 0.64, from.z + out.z * run * 0.93), end];
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    stems.push({ curve, radius: (t) => radius * (1.12 - 0.2 * t), woody: (t) => Math.max(0, 0.5 - t * 3) * (depth === 0 ? 1 : 0.4), tint: (rand() - 0.5) * 0.06, phase: rand() });
    if (depth >= 2) return;
    // Side arms off this one, on its outer and upper side, rising alongside it.
    const children = depth === 0 ? 1 + Math.floor(rand() * 2.6) : rand() < 0.6 ? 1 : 0;
    for (let k = 0; k < children; k++) {
      const u = 0.3 + rand() * 0.35, at = curve.getPointAt(u), turn = (rand() - 0.5) * 2.2;
      const dir = new THREE.Vector3(out.x * Math.cos(turn) - out.z * Math.sin(turn), 0, out.x * Math.sin(turn) + out.z * Math.cos(turn)).normalize();
      arm(at, dir, Math.min(R, Math.hypot(at.x, at.z) + 0.35 + rand() * 0.55), radius * 0.94, depth + 1);
    }
  };
  const trunks = o.trunks ?? 3;
  for (let i = 0; i < trunks; i++) {
    // Trunks rise from close together, lean apart and carry on as the central stems of the crown.
    const a = (i / trunks) * Math.PI * 2 + rand() * 0.7, lean = 0.3 + rand() * 0.25, foot = new THREE.Vector3(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), forkY = H * (0.3 + rand() * 0.08);
    const fork = foot.clone().addScaledVector(out, lean).setY(forkY);
    const top = fork.clone().addScaledVector(out, 0.2 + rand() * 0.25); top.y = crownTop(Math.hypot(top.x, top.z));
    const trunk = new THREE.CatmullRomCurve3([foot, foot.clone().lerp(fork, 0.5).add(new THREE.Vector3((rand() - 0.5) * 0.08, 0, (rand() - 0.5) * 0.08)), fork, fork.clone().lerp(top, 0.5), top], false, "centripetal");
    const woodEnd = forkY / top.y;
    stems.push({ curve: trunk, radius: (t) => 0.17 - 0.085 * Math.min(1, t / (woodEnd * 1.15)), woody: (t) => THREE.MathUtils.clamp(1.25 - t / woodEnd, 0, 1), tint: (rand() - 0.5) * 0.04, phase: rand() });
    // Whorls of arms round the head of each trunk.
    const arms = 7 + Math.floor(rand() * 3);
    for (let k = 0; k < arms; k++) {
      const u = woodEnd * (0.72 + 0.5 * (k / arms)) , at = trunk.getPointAt(Math.min(0.6, u));
      const turn = (k / arms) * Math.PI * 2 + rand() * 0.9, dir = new THREE.Vector3(Math.cos(turn), 0, Math.sin(turn));
      // Arms favour the outside of the clump, so the crown opens like a vase.
      dir.addScaledVector(out, 0.9).normalize();
      arm(at, dir, R * (0.45 + rand() * 0.55), 0.078 + rand() * 0.012, 0);
    }
  }
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (const s of stems) addStem(s, pos, col, idx);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 }));
  mesh.name = "candelabra-cactus"; mesh.castShadow = mesh.receiveShadow = true; mesh.userData.stems = stems.length;
  return mesh;
}
