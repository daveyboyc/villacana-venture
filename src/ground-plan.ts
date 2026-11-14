import * as THREE from "three";
import mainPool from "../data/ground_plan_main_pool.json";
import { clippedHedge, looseShrub } from "./clipped-plants";
import { closestOnSegment, pointInRing } from "./geom";
import { plasterMaterial, surfaceTexture } from "./materials";
import { offsetLine, outlineRing, roundCorners, roundPolyline, smoothLine, smoothUnion, surfaceGeometry } from "./smooth-path";
import type { Vec2 } from "./types";

/**
 * The ground plan (docs/SMOOTH_PATHS.md): per area, paths, patios, aprons and green spaces as smooth
 * vector shapes, each with a finish and what bounds it. One data file per area,
 * data/ground_plan_<area>.json, imported below so the placement tooling ties features to it; checked
 * by scripts/check_ground_plan.py.
 *
 * - A path is one or more centrelines with a width. Paths of one surface are unioned into a single
 *   shape with rounded fillets where they meet (`joins`, metres), and each end is square or round.
 * - A patio, apron or green space is an outline; its corners are rounded by `corners` metres, or kept
 *   hard where `hard` lists their indices (a patio against a house).
 * - Edges bound a surface: none, kerb, brick border, planter wall, wall, hedge or fence. On a path an
 *   edge runs along one side or both (over `span`, metres along the path, if given); on an outline it runs over vertices `from`..`to` (all of it if
 *   omitted). `openings` leave gaps ({at: metres along the edge, width}). Edges follow the same smooth
 *   line as the surface, so the floor, its edge and the ground beside it agree.
 */
export const GROUND_PLANS = [mainPool] as unknown as GroundPlan[];

type Edge = { kind: EdgeKind; side?: "left" | "right" | "both"; span?: number[]; from?: number; to?: number; height?: number; width?: number; planting?: string; openings?: { at: number; width: number }[] };
type Surface = {
  id: string; name: string; kind: "path" | "patio" | "apron" | "green"; finish: Finish;
  width?: number; lines?: number[][][]; ends?: ("square" | "round")[][]; joins?: number;
  outline?: number[][]; corners?: number; hard?: number[]; raise?: number; above?: string[]; edges?: Edge[];
};
type GroundPlan = { area: string; surfaces: Surface[] };

/** Surface finishes: colour, how high the surface sits over the ground, and whether it is drawn as a mesh (lawn is the ground texture). */
export const FINISHES = {
  "pink-resin": { colour: "#c47468", lift: 0.05, paved: true },
  "terracotta-squares": { colour: "#d48a6a", lift: 0.055, paved: true },
  "flagstone": { colour: "#c9a898", lift: 0.06, paved: true },
  "octagon-tiles": { colour: "#c6765a", lift: 0.05, paved: true },
  "concrete": { colour: "#cfc8ba", lift: 0.05, paved: true },
  "gravel": { colour: "#c9bea8", lift: 0.04, paved: true },
  "lawn": { colour: "#6b8a4e", lift: 0, paved: false },
  "planted-bed": { colour: "#4b3a2c", lift: 0.03, paved: false },
} as const;
type Finish = keyof typeof FINISHES;

/** Edge kinds: default height and width in metres, colour, and whether it is solid (collision and map wall). */
export const EDGES = {
  "none": { height: 0, width: 0, colour: "", solid: false },
  "kerb": { height: 0.1, width: 0.12, colour: "#d9d3c5", solid: false },
  "brick-border": { height: 0.04, width: 0.12, colour: "#a4553a", solid: false },
  "planter-wall": { height: 0.45, width: 0.18, colour: "#fbf8f0", solid: true },
  "wall": { height: 1.5, width: 0.22, colour: "#fbf8f0", solid: true },
  "hedge": { height: 0.8, width: 0.6, colour: "#3d5c32", solid: true },
  "fence": { height: 1.2, width: 0.06, colour: "#2f4a3a", solid: true },
} as const;
type EdgeKind = keyof typeof EDGES;

type Built = { plan: GroundPlan; surface: Surface; polys: Vec2[][][]; centrelines: Vec2[][] };

/** Every surface's smooth shape: polygons (outer ring, then holes) and, for paths, the smoothed centrelines. */
export const groundSurfaces: Built[] = GROUND_PLANS.flatMap((plan) => plan.surfaces.map((surface) => {
  if (surface.kind === "path") {
    const half = (surface.width ?? 1) / 2, lines = (surface.lines ?? []).map((l) => smoothLine(l as Vec2[]));
    const rings = lines.map((l, i) => outlineRing(l, half, [surface.ends?.[i]?.[0] === "round", surface.ends?.[i]?.[1] === "round"]));
    return { plan, surface, polys: smoothUnion(rings, surface.joins ?? 1.0, 0.2), centrelines: lines };
  }
  const ring = surface.outline as Vec2[];
  return { plan, surface, polys: [[hardRound(ring, surface.corners ?? 0.3, surface.hard ?? [])]], centrelines: [] };
}));

/** Round an outline's corners except the ones listed as hard. */
function hardRound(ring: Vec2[], r: number, hard: number[]): Vec2[] {
  if (!hard.length) return roundCorners(ring, true, r, r);
  // Round each run between hard corners as an open line, keeping the hard corners exact.
  const n = ring.length, start = hard[0], out: Vec2[] = [];
  const order = Array.from({ length: n + 1 }, (_, k) => ring[(start + k) % n]);
  let run: Vec2[] = [order[0]];
  for (let k = 1; k <= n; k++) {
    run.push(order[k]);
    if (hard.includes((start + k) % n)) { out.push(...roundPolyline(run, r).slice(0, -1)); run = [order[k]]; }
  }
  return out;
}

/** A surface by id ("<area file>:<id>" or the bare id). */
export function groundSurface(id: string): Built | undefined {
  return groundSurfaces.find((b) => b.surface.id === id || `${fileOf(b.plan)}:${b.surface.id}` === id);
}
const fileOf = (plan: GroundPlan) => `ground_plan_${plan.area.replace(/-/g, "_")}.json`;

/** The smoothed centreline of a path surface's first line (for tests and routes along it). */
export function groundPathLine(id: string): Vec2[] {
  return groundSurface(id)?.centrelines[0] ?? [];
}

/** Each edge as the smooth lines it is drawn along, with its kind and size, gaps left for openings. */
export function groundEdges(): { surface: string; kind: EdgeKind; height: number; width: number; planting?: string; runs: Vec2[][] }[] {
  const out: ReturnType<typeof groundEdges> = [];
  for (const b of groundSurfaces) for (const e of b.surface.edges ?? []) {
    if (e.kind === "none") continue;
    const spec = EDGES[e.kind], width = e.width ?? spec.width, height = e.height ?? spec.height;
    let lines: Vec2[][] = [];
    if (b.surface.kind === "path") {
      const off = (b.surface.width ?? 1) / 2 + width / 2;
      for (const full of b.centrelines) {
        const c = e.span ? trim(full, e.span[0], e.span[1]) : full;
        if (c.length < 2) continue;
        if (e.side !== "right") lines.push(offsetLine(c, off));
        if (e.side === "right" || e.side === "both") lines.push(offsetLine(c, -off));
      }
    } else {
      const ring = b.surface.outline as Vec2[], n = ring.length, from = e.from ?? 0, to = e.to ?? n;
      const pts: Vec2[] = [];
      for (let k = from; k <= (to < from ? to + n : to); k++) pts.push(ring[k % n]);
      lines = [roundPolyline(pts, b.surface.corners ?? 0.3)];
    }
    out.push({ surface: b.surface.id, kind: e.kind, height, width, planting: e.planting, runs: lines.flatMap((l) => cutOpenings(l, e.openings ?? [])) });
  }
  return out;
}

/** The part of a line between `from` and `to` metres along it. */
function trim(line: Vec2[], from: number, to: number): Vec2[] {
  const out: Vec2[] = [];
  let s = 0;
  line.forEach((p, i) => { if (i) s += Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]); if (s >= from && s <= to) out.push(p); });
  return out;
}

/** Split a line where openings leave gaps. */
function cutOpenings(line: Vec2[], openings: { at: number; width: number }[]): Vec2[][] {
  if (!openings.length) return [line];
  const runs: Vec2[][] = [];
  let run: Vec2[] = [], s = 0;
  const open = (d: number) => openings.some((o) => Math.abs(d - o.at) < o.width / 2);
  line.forEach((p, i) => {
    if (i) s += Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]);
    if (open(s)) { if (run.length > 1) runs.push(run); run = []; } else run.push(p);
  });
  if (run.length > 1) runs.push(run);
  return runs;
}

/** Footprints of the solid edges (planter walls, walls, hedges, fences), for collision and the map. */
export function groundPlanSolidRings(): Vec2[][] {
  const rings: Vec2[][] = [];
  for (const e of groundEdges()) if (EDGES[e.kind].solid) for (const run of e.runs) for (let i = 1; i < run.length; i++) {
    const a = run[i - 1], b = run[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < 1e-3) continue;
    const nx = (b[1] - a[1]) / l * e.width / 2, nz = -(b[0] - a[0]) / l * e.width / 2;
    rings.push([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]]);
  }
  return rings;
}

/** Whether a point is on a paved ground-plan surface (for keeping decorations off it). */
export function onGroundPlanPaving(x: number, z: number): boolean {
  return groundSurfaces.some((b) => FINISHES[b.surface.finish].paved && b.polys.some((poly) => pointInRing(x, z, poly[0]) && !poly.slice(1).some((h) => pointInRing(x, z, h))));
}

/**
 * Paint the traced green spaces and planted beds into the ground texture, so the raster ground classes
 * give way to the clean vector edge there. Paved surfaces are not painted: their mesh covers the ground,
 * and a painted edge under it leaves an anti-aliased fringe just outside the mesh.
 */
export function paintGroundPlan(ctx: CanvasRenderingContext2D, toPixel: (x: number, z: number) => [number, number], lawn: string): void {
  for (const b of groundSurfaces) {
    if (FINISHES[b.surface.finish].paved) continue;
    ctx.fillStyle = b.surface.finish === "lawn" ? lawn : FINISHES[b.surface.finish].colour;
    for (const poly of b.polys) {
      ctx.beginPath();
      for (const ring of poly) ring.forEach((p, i) => (i ? ctx.lineTo(...toPixel(...p)) : ctx.moveTo(...toPixel(...p))));
      ctx.fill("evenodd");
    }
  }
}

function flagstoneTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c9a898"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#a88878"; g.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    g.beginPath();
    const x = (i * 47) % 240 + 8, y = (i * 83) % 240 + 8;
    g.moveTo(x, y); g.lineTo(x + 40, y + 8); g.lineTo(x + 28, y + 46); g.lineTo(x - 6, y + 30); g.closePath(); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function finishMaterial(finish: Finish): THREE.Material {
  const base = { roughness: 0.88, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } as const;
  if (finish === "terracotta-squares" || finish === "octagon-tiles") {
    // The terracotta photo texture holds eight 0.4 m tiles a repeat; UVs are world metres.
    const map = surfaceTexture("paving").clone(); map.repeat.set(1 / 3.2, 1 / 3.2); map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ ...base, color: FINISHES[finish].colour, map });
  }
  if (finish === "flagstone") {
    const map = flagstoneTexture(); map.repeat.set(1.4, 1.4);
    return new THREE.MeshStandardMaterial({ ...base, map, roughness: 0.95 });
  }
  return new THREE.MeshStandardMaterial({ ...base, color: FINISHES[finish].colour });
}

/** A vertical strip of `width` along a line, from below the ground to `height` above it, with a flat top. */
function edgeGeometry(line: Vec2[], width: number, height: number, ground: (x: number, z: number) => number): THREE.BufferGeometry {
  const l = offsetLine(line, width / 2), r = offsetLine(line, -width / 2), pos: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 1; i < line.length; i++) {
    const g0 = ground(...line[i - 1]), g1 = ground(...line[i]);
    const L0 = [l[i - 1][0], g0, l[i - 1][1]], L1 = [l[i][0], g1, l[i][1]], R0 = [r[i - 1][0], g0, r[i - 1][1]], R1 = [r[i][0], g1, r[i][1]];
    const up = (p: number[]) => [p[0], p[1] + height, p[2]], down = (p: number[]) => [p[0], p[1] - 0.1, p[2]];
    quad(down(L0), down(L1), up(L1), up(L0));
    quad(down(R1), down(R0), up(R0), up(R1));
    quad(up(L0), up(L1), up(R1), up(R0));
  }
  for (const [i, j] of [[0, 0], [line.length - 1, line.length - 1]]) {
    const g = ground(...line[i]), a = [l[i][0], g - 0.1, l[i][1]], b = [r[j][0], g - 0.1, r[j][1]];
    quad(a, b, [b[0], g + height, b[2]], [a[0], g + height, a[2]]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Draw the ground plan: each surface as one smooth mesh on the ground, and each edge along it. Kerbs,
 * borders, walls and plain hedge masses are structure and show in Layout; clipped hedge leaves and the
 * planting in planter walls show with Show details. `near` keeps to the loaded part of the resort.
 */
export function addGroundPlan(scene: THREE.Scene, ground: (x: number, z: number) => number, details: boolean, near: (x: number, z: number) => boolean): void {
  const group = new THREE.Group();
  group.name = "ground-plan"; group.userData.noDrape = true;
  const materials = new Map<string, THREE.Material>();
  const material = (key: string, make: () => THREE.Material) => { if (!materials.has(key)) materials.set(key, make()); return materials.get(key)!; };
  const inScene = (b: Built) => b.polys.some((poly) => poly[0].some(([x, z]) => near(x, z)));
  for (const b of groundSurfaces) {
    if (!inScene(b) || !FINISHES[b.surface.finish].paved && b.surface.finish === "lawn") continue;
    const mesh = new THREE.Mesh(surfaceGeometry(b.polys, ground, FINISHES[b.surface.finish].lift + (b.surface.raise ?? 0), 2), material(b.surface.finish, () => finishMaterial(b.surface.finish)));
    mesh.name = b.surface.id; mesh.receiveShadow = true; mesh.userData.groundPlan = b.plan.area; group.add(mesh);
  }
  let seed = 400;
  for (const e of groundEdges()) {
    const runs = e.runs.filter((r) => r.some(([x, z]) => near(x, z)));
    if (!runs.length) continue;
    const spec = EDGES[e.kind];
    for (const run of runs) {
      if (e.kind === "hedge" && details) {
        // Clipped hedge pieces about 1.3 m long along the line.
        for (let i = 1; i < run.length; i += 4) {
          const a = run[i - 1], b = run[Math.min(run.length - 1, i + 3)], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (len < 0.2) continue;
          const h = clippedHedge({ length: len + 0.05, depth: e.width, height: e.height, seed: seed++, clip: 4.2, greens: ["#2f4a28", "#3d5c32", "#4c6b3c"] });
          const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
          h.position.set(mx, ground(mx, mz), mz); h.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); h.name = `${e.surface}-hedge`; group.add(h);
        }
        continue;
      }
      const mat = material(`edge:${e.kind}`, () => e.kind === "planter-wall" || e.kind === "wall" ? plasterMaterial(spec.colour) : new THREE.MeshStandardMaterial({ color: spec.colour, roughness: 0.8 }));
      const mesh = new THREE.Mesh(edgeGeometry(run, e.width, e.height, ground), mat);
      mesh.name = `${e.surface}-${e.kind}`; mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
      if (e.planting && details) {
        // Planting in a planter: low shrubs along the top every metre or so.
        for (let i = 0; i < run.length; i += 4) {
          const [x, z] = run[i], lavender = e.planting === "lavender";
          const shrub = looseShrub({ width: 0.8, depth: 0.5, height: 0.45, seed: seed++, leaf: "small", leafSize: [0.05, 0.02], greens: lavender ? ["#8f9f86", "#a3b09a", "#7f9076"] : ["#4f7038", "#5d8242", "#3f5c2e"], stems: 4, ...(lavender ? { flowers: { count: 30, colour: "#9a8cc4" } } : {}) });
          shrub.position.set(x, ground(x, z) + e.height - 0.05, z); shrub.name = `${e.surface}-planting`; group.add(shrub);
        }
      }
    }
  }
  scene.add(group);
}

/** Whether a point lies within `d` of a line, for the checks in the browser test. */
export function nearLine(p: Vec2, line: Vec2[], d: number): boolean {
  return line.some((a, i) => i > 0 && closestOnSegment(p[0], p[1], line[i - 1][0], line[i - 1][1], a[0], a[1]).d < d);
}
