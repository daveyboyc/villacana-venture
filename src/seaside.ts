import * as THREE from "three";
import { shoreline, crossings } from "./shoreline";
import { asset } from "./asset";
import layout from "../data/main_pool.json";
import paseoWall from "../data/paseo_wall.json";
import { closestOnSegment, pointInRing } from "./geom";
import type { Seafront, Vec2 } from "./types";
import { paseoSurfaceMaterial } from "./paseo-surface";

const levels = layout.levels.seafront;
/** The seaside starts this far inland of the paseo's centre line. */
const EDGE = 1.8;

/**
 * Ground heights seaward of the paseo. The paseo follows `profile` (level with
 * the big pool in front of it, street level further along); the beach then
 * falls gently from the paseo to the shore, and the sea lies a little lower.
 */
export type Seaside = {
  seaY: number;
  /** Seaward of the paseo's inland edge. */
  inZone(x: number, z: number): boolean;
  /** Ground height there. */
  y(x: number, z: number): number;
  /** The inland edge of the zone, west to east. */
  edge: Vec2[];
  /** Beside the photographed retaining wall (data/paseo_wall.json), which stands in for the plain bank. */
  walled(x: number, z: number): boolean;
};

/** Where the retaining wall stands, the zone reaches the foot of its face; it blends back to EDGE over this length past each end. */
const WALL_BLEND = 2;

export function makeSeaside(sf: Seafront, rotation: number): Seaside {
  const paseo = sf.paseo.points, coast = shoreline(sf), sea: Vec2[] = [...coast, [1500, 1500], [-1500, 1500]];
  const cos = Math.cos(rotation * Math.PI / 180), sin = Math.sin(rotation * Math.PI / 180);
  const profile = levels.profile as number[][];
  const paseoY = (x: number, z: number): number => {
    const along = x * cos - z * sin;
    if (along <= profile[0][0]) return profile[0][1];
    for (let i = 1; i < profile.length; i++) {
      const [a, ay] = profile[i - 1], [b, by] = profile[i];
      if (along <= b) return ay + (by - ay) * (along - a) / (b - a);
    }
    return profile[profile.length - 1][1];
  };
  const run = paseo.slice(1).reduce((acc, b, i) => [...acc, acc[i] + Math.hypot(b[0] - paseo[i][0], b[1] - paseo[i][1])], [0]);
  /** Distance to the paseo's centre line, positive on the seaward side, the nearest point on it and how far along the paseo that is. */
  const toPaseo = (x: number, z: number) => {
    let best = Infinity, signed = 0, px = x, pz = z, arc = 0;
    for (let i = 0; i < paseo.length - 1; i++) {
      const [ax, az] = paseo[i], [bx, bz] = paseo[i + 1], hit = closestOnSegment(x, z, ax, az, bx, bz);
      if (hit.d < best) { best = hit.d; px = hit.x; pz = hit.z; arc = run[i] + Math.hypot(hit.x - ax, hit.z - az); signed = (-(bz - az) * (x - ax) + (bx - ax) * (z - az)) >= 0 ? hit.d : -hit.d; }
    }
    return { signed, px, pz, arc };
  };
  // The wall's face as (distance along the paseo, distance inland of its centre line).
  const face = (paseoWall.wall.face as Vec2[]).map(([x, z]): Vec2 => { const p = toPaseo(x, z); return [p.arc, -p.signed]; });
  const [s0, s1] = [face[0][0], face[face.length - 1][0]];
  const edgeAt = (arc: number): number => {
    if (arc <= s0 - WALL_BLEND || arc >= s1 + WALL_BLEND) return EDGE;
    if (arc < s0) return EDGE + (face[0][1] - EDGE) * (arc - (s0 - WALL_BLEND)) / WALL_BLEND;
    if (arc > s1) return EDGE + (face[face.length - 1][1] - EDGE) * (s1 + WALL_BLEND - arc) / WALL_BLEND;
    for (let i = 1; i < face.length; i++) if (arc <= face[i][0]) return face[i - 1][1] + (face[i][1] - face[i - 1][1]) * (arc - face[i - 1][0]) / ((face[i][0] - face[i - 1][0]) || 1);
    return face[face.length - 1][1];
  };
  const toCoast = (x: number, z: number) => {
    let best = Infinity;
    for (let i = 0; i < coast.length - 1; i++) best = Math.min(best, closestOnSegment(x, z, coast[i][0], coast[i][1], coast[i + 1][0], coast[i + 1][1]).d);
    return best;
  };
  // The inland edge, every metre so it can follow the wall; corners take the mean of both directions.
  const edge: Vec2[] = paseo.flatMap(([x, z], i): Vec2[] => {
    const a = paseo[Math.max(0, i - 1)], b = paseo[Math.min(paseo.length - 1, i + 1)], length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const corner: Vec2 = [x + (b[1] - a[1]) / length * edgeAt(run[i]), z - (b[0] - a[0]) / length * edgeAt(run[i])];
    if (i === paseo.length - 1) return [corner];
    const [nx, nz] = paseo[i + 1], span = run[i + 1] - run[i], count = Math.max(1, Math.ceil(span));
    return [corner, ...Array.from({ length: count - 1 }, (_, k): Vec2 => {
      const f = (k + 1) / count, off = edgeAt(run[i] + span * f);
      return [x + (nx - x) * f + (nz - z) / span * off, z + (nz - z) * f - (nx - x) / span * off];
    })];
  });
  return {
    seaY: levels.sea,
    edge,
    walled: (x, z) => { const arc = toPaseo(x, z).arc; return arc >= s0 && arc <= s1; },
    inZone: (x, z) => { const p = toPaseo(x, z); return p.signed > -edgeAt(p.arc); },
    y: (x, z) => {
      const p = toPaseo(x, z), top = paseoY(p.px, p.pz), out = Math.max(p.signed - sf.paseo.width / 2, 0), shore = toCoast(x, z);
      if (pointInRing(x, z, sea)) return Math.max(levels.shore - shore * 0.04, levels.shore - 2.5);
      return top + (levels.shore - top) * out / ((out + shore) || 1);
    },
  };
}

/** Sand from the paseo down to the sea, the paseo itself, and a bank where the land behind stands higher. */
export function addSeaside(scene: THREE.Scene, sf: Seafront, seaside: Seaside, centre: { x: number; z: number }, span: number, inlandY: (x: number, z: number) => number): void {
  // Sand: a grid that follows the heights. It reaches a cell inland of the zone, hidden under the ground there.
  const coast = shoreline(sf);
  const cell = 2, originX = centre.x - span, originZ = centre.z - span;
  const first = Math.min(0, Math.floor((coast[0][0] - originX) / cell));
  const last = Math.max(Math.ceil(2 * span / cell), Math.ceil((coast.at(-1)![0] - originX) / cell));
  const sand: number[] = [], sandIndices: number[] = [];
  const columns = new Map<number, Map<number, number>>();
  const shoreHeights = new Map<number, number>();
  let previous = new Map<number, number>();
  for (let i = first; i <= last; i++) {
    const x = originX + i * cell;
    const local = x >= originX && x <= centre.x + span + cell;
    const sampleX = THREE.MathUtils.clamp(x, coast[0][0], coast.at(-1)![0] - 0.001);
    const shore = crossings(coast, sampleX)[0];
    const beachEdges = crossings(sf.beach.ring, x, true);
    // Include all mapped beach and a submerged margin under the transparent shallows.
    const lo = Math.min(...beachEdges, shore - 12, local ? originZ : Infinity);
    const hi = Math.max(...beachEdges, shore + 12, local ? centre.z + span : -Infinity);
    const column = new Map<number, number>();
    for (let j = Math.floor((lo - originZ) / cell); j <= Math.ceil((hi - originZ) / cell); j++) {
      const z = originZ + j * cell;
      const inLocalGrid = local && z >= originZ && z <= centre.z + span + cell;
      const inZone = seaside.inZone(x, z);
      if (!inLocalGrid && !pointInRing(x,z,sf.beach.ring) && Math.abs(z - shore) > 12) continue;
      if (inLocalGrid && !inZone && !pointInRing(x,z,sf.beach.ring) && Math.abs(z - shore) > 12 &&
          !seaside.inZone(x + cell,z + cell) && !seaside.inZone(x - cell,z + cell)) continue;
      let y = seaside.y(x,z) - 0.03;
      if (inLocalGrid && !inZone) y = Math.min(y - 0.57, inlandY(x,z) - 0.15);
      const index = sand.length / 3;
      column.set(j, index);
      sand.push(x, y, z);
      const a = previous.get(j - 1), b = previous.get(j), c = column.get(j - 1);
      if (a !== undefined && b !== undefined && c !== undefined) sandIndices.push(a,b,c,c,b,index);
    }
    columns.set(i, column);
    shoreHeights.set(i, shore);
    previous = column;
  }
  const mesh = (positions: number[], color: string | THREE.Material | THREE.Material[], shadow = true, uvs?: number[], indices?: number[]) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    if (indices) geometry.setIndex(indices);
    geometry.computeVertexNormals();
    if (uvs) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const m = new THREE.Mesh(geometry, typeof color === "string" ? new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide }) : color);
    // The seaside has its own heights, as the player's ground does in its zone: not draped over siteY.
    m.receiveShadow = shadow; m.userData.referenceSurface = true; m.userData.noDrape = true; scene.add(m);
    return m;
  };
  // Continue the land behind the detailed scene. Keep this distant surface below
  // the model and out of the water so transparent shallows only reveal beach sand.
  const hinterland: number[] = [];
  for (let i = 1; i < coast.length; i++) {
    const [ax, az] = coast[i - 1], [bx, bz] = coast[i];
    const y = seaside.seaY - 0.5;
    hinterland.push(ax,y,az-5, bx,y,bz-5, ax,y,-1500,
                    ax,y,-1500, bx,y,bz-5, bx,y,-1500);
  }
  const distantLand = mesh(hinterland, new THREE.MeshBasicMaterial({ color: "#a1977c" }), false);
  distantLand.name = "coastal-land-backdrop";
  distantLand.userData.referenceSurface = false;
  distantLand.userData.noOcclusion = true;

  // Poly Haven Gravelly Sand (CC0), tiled in metres across the existing beach.
  const sandMap = new THREE.TextureLoader().load(asset("/textures/coast/gravelly-sand.webp"));
  sandMap.wrapS = sandMap.wrapT = THREE.RepeatWrapping;
  sandMap.colorSpace = THREE.SRGBColorSpace;
  const pebbles = new THREE.TextureLoader().load(asset("/textures/coast/rounded-pebbles.webp"));
  pebbles.wrapS = pebbles.wrapT = THREE.RepeatWrapping;
  pebbles.colorSpace = THREE.SRGBColorSpace;
  const sandUv: number[] = [], tones: number[] = [];
  for (let i = 0; i < sand.length; i += 3) {
    sandUv.push(sand[i] / 2, sand[i + 2] / 2);
    const dry = THREE.MathUtils.smoothstep(sand[i + 1] - seaside.seaY, 0, 0.32);
    const tone = THREE.MathUtils.lerp(0.52, 1, dry);
    tones.push(tone, tone, tone);
  }
  const beachMaterial = new THREE.MeshStandardMaterial({
    map: sandMap, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide,
  });
  // Feather the outer sand grid into distant land. Use the actual grid margin
  // so the oblique view does not expose square steps at the edge of coverage.
  const margin = new Float32Array(sand.length / 3);
  for (const [i, column] of columns) {
    for (const [j, index] of column) {
      if (sand[3 * index + 2] >= shoreHeights.get(i)! - 4) continue;
      for (let step = 1; step <= 3; step++) {
        if (!columns.get(i-step)?.has(j) || !columns.get(i+step)?.has(j) ||
            !column.has(j-step) || !column.has(j+step)) {
          margin[index] = (4-step) / 3;
          break;
        }
      }
    }
  }
  beachMaterial.onBeforeCompile = shader => {
    shader.uniforms.pebbles = { value: pebbles };
    shader.uniforms.inlandColor = { value: (distantLand.material as THREE.MeshBasicMaterial).color };
    shader.vertexShader = "attribute float inlandBlend; varying float vInlandBlend;\n" +
      shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvInlandBlend = inlandBlend;");
    shader.fragmentShader = `
      uniform sampler2D pebbles;
      uniform vec3 inlandColor;
      varying float vInlandBlend;
      float sandHash(vec2 cell) {
        vec3 p = fract(vec3(cell.xyx) * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float sandNoise(vec2 point) {
        vec2 cell = floor(point), f = fract(point);
        f = f*f*(3.0 - 2.0*f);
        return mix(mix(sandHash(cell), sandHash(cell + vec2(1,0)), f.x),
                   mix(sandHash(cell + vec2(0,1)), sandHash(cell + vec2(1,1)), f.x), f.y);
      }
    ` +
      shader.fragmentShader.replace("#include <map_fragment>", `
        #include <map_fragment>
        // Metre-scale deposits vary in extent. The scan resolves individual stones up close.
        vec2 metres = 2.0 * vMapUv;
        float deposit = 0.55*sandNoise(metres*0.36) + 0.30*sandNoise(metres*1.1 + 17.0)
                      + 0.15*sandNoise(metres*3.2);
        float pebbly = smoothstep(0.41, 0.69, deposit);
        pebbly *= mix(1.0, 0.65, smoothstep(0.52, 1.0, vColor.r));
        float neutral = dot(diffuseColor.rgb, vec3(0.21,0.72,0.07));
        vec3 sandColor = mix(diffuseColor.rgb, vec3(neutral), 0.36);
        vec3 stones = texture2D(pebbles, metres / 1.3).rgb;
        diffuseColor.rgb = mix(sandColor, stones, 0.75*pebbly);
      `).replace("#include <opaque_fragment>",
        "outgoingLight = mix(outgoingLight, inlandColor, smoothstep(0.0, 1.0, vInlandBlend));\n#include <opaque_fragment>");
  };
  const beach = mesh(sand, beachMaterial, true, sandUv, sandIndices);
  beach.name = "barraka-beach-sand";
  beach.geometry.setAttribute("color", new THREE.Float32BufferAttribute(tones, 3));
  beach.geometry.setAttribute("inlandBlend", new THREE.BufferAttribute(margin, 1));

  // Walk a line in short steps so ribbons and banks follow the heights.
  const steps = (line: Vec2[]): Vec2[] => line.flatMap((a, i) => {
    if (i === line.length - 1) return [a];
    const b = line[i + 1], count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    return Array.from({ length: count }, (_, k): Vec2 => [a[0] + (b[0] - a[0]) * k / count, a[1] + (b[1] - a[1]) * k / count]);
  });
  const near = ([x, z]: Vec2) => Math.abs(x - centre.x) < span + 4 && Math.abs(z - centre.z) < span + 4;

  // The paseo: a ribbon lying on the ground it crosses.
  const ribbon: number[] = [], ribbonUv: number[] = [], stamped: boolean[] = [], line = steps(sf.paseo.points), half = sf.paseo.width / 2;
  let along = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1];
    const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const start = along; along += run;
    if (!near(a) && !near(b)) continue;
    const length = run || 1, nx = (b[1] - a[1]) / length * half, nz = -(b[0] - a[0]) / length * half;
    const ay = seaside.y(a[0], a[1]) + 0.04, by = seaside.y(b[0], b[1]) + 0.04;
    ribbon.push(a[0] + nx, ay, a[1] + nz, a[0] - nx, ay, a[1] - nz, b[0] + nx, by, b[1] + nz, b[0] + nx, by, b[1] + nz, a[0] - nx, ay, a[1] - nz, b[0] - nx, by, b[1] - nz);
    // U crosses the walk; V accumulates distance even across cropped segments.
    const u = sf.paseo.width / 3, va = start / 3, vb = along / 3;
    ribbonUv.push(0, va, u, va, 0, vb, 0, vb, u, va, u, vb);
    stamped.push(seaside.walled((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
  }
  // Material-only: exact original positions, ground heights and collision retained.
  const walk = mesh(ribbon, [
    new THREE.MeshStandardMaterial({ color: paseoWall.surface.color, roughness: .95, side: THREE.DoubleSide }),
    paseoSurfaceMaterial(),
  ], true, ribbonUv);
  walk.name = "paseo-stamped-walk";
  // Limit the observed finish to the existing retaining-wall frontage; eastern
  // surfaces retain their previous material pending their own source review.
  stamped.forEach((observed, i) => {
    const index = observed ? 1 : 0, previous = walk.geometry.groups.at(-1);
    if (previous?.materialIndex === index) previous.count += 6;
    else walk.geometry.addGroup(i * 6, 6, index);
  });

  // Where the land behind the paseo stands higher, a bank holds it back.
  const bank: number[] = [], rim = steps(seaside.edge);
  for (let i = 0; i < rim.length - 1; i++) {
    const a = rim[i], b = rim[i + 1];
    if (!near(a) && !near(b)) continue;
    // The retaining wall stands here instead (src/paseo-wall.ts).
    if (seaside.walled((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ix = (b[1] - a[1]) / length * 0.4, iz = -(b[0] - a[0]) / length * 0.4;
    const top = Math.max(inlandY(a[0] + ix, a[1] + iz), inlandY(b[0] + ix, b[1] + iz));
    const ay = seaside.y(a[0], a[1]) - 0.03, by = seaside.y(b[0], b[1]) - 0.03;
    if (top - Math.min(ay, by) < 0.08) continue;
    bank.push(a[0], ay, a[1], b[0], by, b[1], a[0], top, a[1], a[0], top, a[1], b[0], by, b[1], b[0], top, b[1]);
  }
  mesh(bank, "#efe6d2");
}
