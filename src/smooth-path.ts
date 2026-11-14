import * as THREE from "three";
import clipping from "polygon-clipping";
import type { Vec2 } from "./types";

/**
 * Smooth path surfaces for garden paths, aprons and other paved ways (docs/SMOOTH_PATHS.md).
 *
 * A path is traced as a few centreline points from the photos and the aerial. Drawn as straight
 * strips it kinks at every point, narrows at bends and its branches overlap as rectangles with square
 * ends. Here the centreline becomes a smooth curve through the same points, the curve becomes a
 * constant-width outline, all the paths of one network are unioned into a single shape, its corners
 * are rounded (wide fillets where a branch meets, a slight softening elsewhere) and the shape is
 * laid on the ground as one mesh. The traced points stay the data; only the drawing is smoothed.
 */

/** A centripetal Catmull-Rom curve through the points, sampled about every `step` metres; both ends kept. */
export function smoothLine(points: Vec2[], step = 0.3): Vec2[] {
  if (points.length < 3) return densify(points, step);
  const p = [mirror(points[1], points[0]), ...points, mirror(points[points.length - 2], points[points.length - 1])];
  const out: Vec2[] = [points[0]];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const t1 = Math.sqrt(Math.max(1e-6, Math.hypot(p1[0] - p0[0], p1[1] - p0[1])));
    const t2 = t1 + Math.sqrt(Math.max(1e-6, Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
    const t3 = t2 + Math.sqrt(Math.max(1e-6, Math.hypot(p3[0] - p2[0], p3[1] - p2[1])));
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 1; k <= n; k++) {
      const t = t1 + (t2 - t1) * (k / n);
      const lerp = (a: Vec2, b: Vec2, ta: number, tb: number): Vec2 => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      const a1 = lerp(p0, p1, 0, t1), a2 = lerp(p1, p2, t1, t2), a3 = lerp(p2, p3, t2, t3);
      const b1 = lerp(a1, a2, 0, t2), b2 = lerp(a2, a3, t1, t3);
      out.push(lerp(b1, b2, t1, t2));
    }
  }
  return out;
}

function mirror(a: Vec2, about: Vec2): Vec2 { return [2 * about[0] - a[0], 2 * about[1] - a[1]]; }

function densify(points: Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

/**
 * The outline of a path `half` metres either side of its (smoothed) centreline, as one closed ring.
 * Each side is offset by the true normal at every sample, so the path keeps its width round bends.
 * Ends are square, or round when `round` is set (a path that stops on open lawn).
 */
export function outlineRing(line: Vec2[], half: number, round: [boolean, boolean] = [false, false]): Vec2[] {
  const left: Vec2[] = [], right: Vec2[] = [];
  const dir = (i: number): Vec2 => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], n = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / n, (b[1] - a[1]) / n];
  };
  line.forEach((p, i) => {
    const [dx, dz] = dir(i);
    left.push([p[0] + dz * half, p[1] - dx * half]);
    right.push([p[0] - dz * half, p[1] + dx * half]);
  });
  // A half circle round the end point, from one side to the other through the way the path points.
  const cap = (centre: Vec2, from: number): Vec2[] => Array.from({ length: 9 }, (_, k) => {
    const a = from + Math.PI * (k + 1) / 10;
    return [centre[0] + Math.cos(a) * half, centre[1] + Math.sin(a) * half] as Vec2;
  });
  const end = line.length - 1, ahead = (i: number) => Math.atan2(dir(i)[1], dir(i)[0]);
  const endCap = round[1] ? cap(line[end], ahead(end) - Math.PI / 2) : [];
  const startCap = round[0] ? cap(line[0], ahead(0) + Math.PI / 2) : [];
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}

type Polygon = Vec2[][]; // outer ring first, then holes

/** The union of path outlines, each ring with its corners rounded: `fillet` metres where paths meet, `soften` elsewhere. */
export function smoothUnion(rings: Vec2[][], fillet = 1.0, soften = 0.25): Polygon[] {
  if (!rings.length) return [];
  const polys = rings.map((r) => [[...r, r[0]]] as clipping.Polygon);
  const merged = clipping.union(polys[0], ...polys.slice(1)) as unknown as Vec2[][][];
  return merged.map((poly) => poly.map((ring, k) => roundCorners(open(ring), k === 0, fillet, soften)));
}

function open(ring: Vec2[]): Vec2[] {
  const r = ring.slice();
  if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  return r;
}

/**
 * Round a ring's corners with quadratic curves. A corner turning more than ~25 degrees is replaced by
 * a curve from `r` before it to `r` after it: `fillet` for inward (concave) corners, where a branch
 * meets its path, `soften` for outward ones, so square path ends lose only their hard edge.
 */
export function roundCorners(ring: Vec2[], outer: boolean, fillet: number, soften: number): Vec2[] {
  const n = ring.length;
  if (n < 3) return ring;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const ccw = area > 0, out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const prev = ring[(i + n - 1) % n], p = ring[i], next = ring[(i + 1) % n];
    const ax = p[0] - prev[0], az = p[1] - prev[1], bx = next[0] - p[0], bz = next[1] - p[1];
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    if (!la || !lb) continue;
    const turn = Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb))));
    if (turn < 0.45) { out.push(p); continue; }
    // Inward for the outer ring when the turn goes against its winding (and the other way for holes).
    const cross = ax * bz - az * bx, inward = (cross > 0) !== ccw ? outer : !outer;
    const r = Math.min(inward ? fillet : soften, la * 0.45, lb * 0.45);
    const s: Vec2 = [p[0] - ax / la * r, p[1] - az / la * r], e: Vec2 = [p[0] + bx / lb * r, p[1] + bz / lb * r];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, u = 1 - t;
      out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]);
    }
  }
  return out;
}

/**
 * One mesh for a set of polygons, laid on the ground: triangulated, each triangle split into four
 * `levels` times so the surface follows the ground, then every vertex set `lift` above `ground`.
 * UVs are world metres (x, z), for tiled or stamped textures.
 */
export function surfaceGeometry(polys: Polygon[], ground: (x: number, z: number) => number, lift: number, levels = 2): THREE.BufferGeometry {
  const tri: number[] = [];
  for (const poly of polys) {
    const contour = poly[0].map(([x, z]) => new THREE.Vector2(x, z)), holes = poly.slice(1).map((h) => h.map(([x, z]) => new THREE.Vector2(x, z)));
    const flat = [...poly[0], ...poly.slice(1).flat()];
    for (const f of THREE.ShapeUtils.triangulateShape(contour, holes)) {
      const [a, b, c] = f.map((k) => flat[k]);
      // Face up: counter-clockwise seen from above (+y), which in x, z is clockwise.
      const up = (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]) > 0;
      for (const q of up ? [a, b, c] : [a, c, b]) tri.push(q[0], q[1]);
    }
  }
  let pts = tri;
  for (let l = 0; l < levels; l++) {
    const next: number[] = [];
    for (let t = 0; t < pts.length; t += 6) {
      const a: Vec2 = [pts[t], pts[t + 1]], b: Vec2 = [pts[t + 2], pts[t + 3]], c: Vec2 = [pts[t + 4], pts[t + 5]];
      const ab: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc: Vec2 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca: Vec2 = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
      for (const [x, y, z] of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]] as Vec2[][]) next.push(...x, ...y, ...z);
    }
    pts = next;
  }
  const pos: number[] = [], uv: number[] = [];
  for (let t = 0; t < pts.length; t += 2) { const x = pts[t], z = pts[t + 1]; pos.push(x, ground(x, z) + lift, z); uv.push(x, z); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  // Paths lie on gentle ground: straight-up normals keep the surface evenly lit, without a crease
  // where neighbouring triangles tilt a little differently.
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  return g;
}

/** The line `d` metres to its left (negative: right), offset along the true normal at every sample. */
export function offsetLine(line: Vec2[], d: number): Vec2[] {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], n = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = (b[0] - a[0]) / n, dz = (b[1] - a[1]) / n;
    return [p[0] + dz * d, p[1] - dx * d] as Vec2;
  });
}

/** An open polyline with its inner corners rounded by quadratic curves of radius `r` (as roundCorners does for rings). */
export function roundPolyline(points: Vec2[], r: number): Vec2[] {
  if (points.length < 3 || r <= 0) return points;
  const out: Vec2[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1], p = points[i], next = points[i + 1];
    const ax = p[0] - prev[0], az = p[1] - prev[1], bx = next[0] - p[0], bz = next[1] - p[1];
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    if (!la || !lb) continue;
    const rr = Math.min(r, la * 0.45, lb * 0.45);
    const s: Vec2 = [p[0] - ax / la * rr, p[1] - az / la * rr], e: Vec2 = [p[0] + bx / lb * rr, p[1] + bz / lb * rr];
    for (let k = 0; k <= 6; k++) { const t = k / 6, u = 1 - t; out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]); }
  }
  out.push(points[points.length - 1]);
  return out;
}
