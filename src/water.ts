import {surfaceTexture} from "./materials";
import { pointInRing } from "./geom";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec2 } from "./types";

/** How far the pool floor is below the deck, in metres. */
export const POOL_DEPTH = 1.15;
/** Where the player's feet rest in a pool: standing on the floor, chest-deep. */
export const POOL_STAND = -1.05;
const SURFACE = -0.1;

export type Pools = { update(time: number): void };

type PoolStyle = { color?: string; tileColor?: string; deckY?: number };

/** Depth of the darker waterline tile band round the top of each pool wall, in metres. */
const BAND = 0.16;
/** Width of the stone coping slabs round each pool, in metres. */
const COPING = 0.38;

/**
 * Build each pool as a real basin: tiled walls and floor below ground level with
 * a darker waterline band, jointed stone coping round the edge, and water that is
 * pale over the shallow margins, deeper blue in the middle, rippled and glinting.
 */
export function addPools(scene: THREE.Scene, rings: Vec2[][], styles: PoolStyle[] = []): Pools {
  const light = lightPattern();
  const tiles = new THREE.MeshBasicMaterial({ map: surfaceTexture("mosaic"), color: "#9fd3ec" });
  const band = new THREE.MeshBasicMaterial({ map: surfaceTexture("mosaic"), color: "#2c5f9e", side: THREE.DoubleSide });
  const coping = [
    new THREE.MeshStandardMaterial({ color: "#ece1c8", roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: "#e3d5b8", roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: "#f1e8d4", roughness: 0.75 }),
  ];
  const waters: THREE.ShaderMaterial[] = [];

  for (const [index, ring] of rings.entries()) {
    const style = styles[index];
    const basin=new THREE.Group();basin.position.y=style?.deckY??0;scene.add(basin);
    const poolTiles = style?.tileColor ? tiles.clone() : tiles;
    if (style?.tileColor) poolTiles.color.set(style.tileColor);
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));

    const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), poolTiles);
    floor.position.y = -POOL_DEPTH;
    basin.add(floor);
    const caustics=new THREE.Mesh(floor.geometry,new THREE.MeshBasicMaterial({map:light,color:poolTiles.color,transparent:true,opacity:.4,depthWrite:false}));
    caustics.position.y=-POOL_DEPTH+.015;basin.add(caustics);

    // Walls, facing inwards: the darker waterline band, then plain tiles to the floor.
    const wallMaterial = poolTiles.clone();
    wallMaterial.side = THREE.DoubleSide;
    basin.add(new THREE.Mesh(wallStrip(ring, 0, -BAND), band));
    basin.add(new THREE.Mesh(wallStrip(ring, -BAND, -POOL_DEPTH), wallMaterial));

    // Default colours sampled from the north-pool photo IMG_2204: middle and margins.
    const deep = style?.color ? new THREE.Color(style.color).lerp(new THREE.Color("#0b2a4a"), 0.3) : new THREE.Color("#3d86ad");
    const shallow = style?.color ? new THREE.Color(style.color).lerp(new THREE.Color("#e6fbff"), 0.35) : new THREE.Color("#7cc4da");
    const water = waterMaterial(ring, deep, shallow);
    waters.push(water);
    const top = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), water);
    top.position.y = SURFACE;
    top.renderOrder = 2;
    basin.add(top);

    // Stone coping slabs laid round the edge, their inner lip just over the water.
    // Three stone tones, slab by slab, so neighbours differ as they do on the deck.
    const slabs = copingSlabs(ring);
    for (const [tone, material] of coping.entries()) {
      const stone = new THREE.Mesh(mergeGeometries(slabs.filter((_, slab) => slab % coping.length === tone), false), material);
      stone.receiveShadow = true;
      basin.add(stone);
    }
  }

  return {
    update(time) {
      light.offset.set(time * 0.035, Math.sin(time * 0.4) * 0.05 + time * 0.02);
      for (const water of waters) water.uniforms.uTime.value = time;
    },
  };
}

/** A vertical band of wall round the ring between two heights, facing in, UVs in metres. */
function wallStrip(ring: Vec2[], top: number, bottom: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  let along = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % ring.length];
    const next = along + Math.hypot(bx - ax, bz - az);
    positions.push(ax, top, az, bx, top, bz, bx, bottom, bz, ax, top, az, bx, bottom, bz, ax, bottom, az);
    uvs.push(along, top, next, top, next, bottom, along, top, next, bottom, along, bottom);
    along = next;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

/**
 * Slabs about 0.6 m long laid end to end round the ring with thin joints between
 * them, standing a little proud of the deck and overhanging the water by 3 cm.
 */
function copingSlabs(ring: Vec2[]): THREE.BufferGeometry[] {
  const inner = outset(ring, -0.03), outer = outset(ring, COPING);
  const n = ring.length;
  const lengths: number[] = [0];
  for (let i = 0; i < n; i++) lengths.push(lengths[i] + Math.hypot(ring[(i + 1) % n][0] - ring[i][0], ring[(i + 1) % n][1] - ring[i][1]));
  const total = lengths[n], count = Math.max(6, Math.round(total / 0.6)), joint = 0.012;
  const at = (path: Vec2[], s: number): Vec2 => {
    const t = ((s % total) + total) % total;
    let i = 0;
    while (i < n - 1 && lengths[i + 1] < t) i++;
    const f = (t - lengths[i]) / (lengths[i + 1] - lengths[i] || 1), a = path[i], b = path[(i + 1) % n];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
  const slabs: THREE.BufferGeometry[] = [];
  const height = 0.06;
  for (let k = 0; k < count; k++) {
    const s0 = (k / count) * total + joint, s1 = ((k + 1) / count) * total - joint;
    // Follow the curve within the slab so round pools keep a smooth edge.
    const steps = Math.max(1, Math.ceil((s1 - s0) / 0.2));
    const outline: Vec2[] = [];
    for (let j = 0; j <= steps; j++) outline.push(at(inner, s0 + ((s1 - s0) * j) / steps));
    for (let j = steps; j >= 0; j--) outline.push(at(outer, s0 + ((s1 - s0) * j) / steps));
    const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: height, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
    geometry.rotateX(-Math.PI / 2);
    slabs.push(geometry);
  }
  return slabs;
}

/**
 * Water that reads like the photos: a shade map from each point's distance to the
 * edge makes the margins and steps paler and the middle a deeper blue; moving
 * ripples tilt the surface for sky reflection at low angles and sun glints.
 */
function waterMaterial(ring: Vec2[], deep: THREE.Color, shallow: THREE.Color): THREE.ShaderMaterial {
  const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
  const minX = Math.min(...xs), minZ = Math.min(...zs), sizeX = Math.max(...xs) - minX || 1, sizeZ = Math.max(...zs) - minZ || 1;
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 },
      uShade: { value: null },
      uMin: { value: new THREE.Vector2(minX, minZ) },
      uSize: { value: new THREE.Vector2(sizeX, sizeZ) },
      uShallow: { value: shallow },
      uDeep: { value: deep },
      uSky: { value: new THREE.Color("#d7eef8") },
    }]),
    vertexShader: `
      varying vec3 vWorld;
      varying vec2 vUv;
      uniform vec2 uMin;
      uniform vec2 uSize;
      #include <fog_pars_vertex>
      void main() {
        vUv = (position.xz - uMin) / uSize;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uShade;
      uniform vec3 uShallow;
      uniform vec3 uDeep;
      uniform vec3 uSky;
      varying vec3 vWorld;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        float depth = texture2D(uShade, vUv).r;
        vec2 p = vWorld.xz;
        // Three crossing swells; their slopes tilt the normal.
        vec2 d1 = vec2(1.7, 0.6), d2 = vec2(-0.8, 2.1), d3 = vec2(2.6, 2.9);
        float a1 = dot(p, d1) + uTime * 1.1, a2 = dot(p, d2) - uTime * 0.9, a3 = dot(p, d3) + uTime * 1.7;
        vec2 slope = d1 * cos(a1) * 0.5 + d2 * cos(a2) * 0.5 + d3 * cos(a3) * 0.3;
        vec3 n = normalize(vec3(-slope.x * 0.035, 1.0, -slope.y * 0.035));
        vec3 v = normalize(cameraPosition - vWorld);
        float fresnel = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 colour = mix(uShallow, uDeep, depth);
        // Soft darker bands where the ripples bunch, as seen over the tiled floor.
        colour *= 0.94 + 0.06 * sin(a1 * 0.7 + a2 * 0.5);
        colour = mix(colour, uSky, fresnel * 0.7);
        vec3 h = normalize(normalize(vec3(0.45, 0.8, 0.35)) + v);
        colour += vec3(1.0) * pow(max(dot(n, h), 0.0), 220.0) * 0.9;
        gl_FragColor = vec4(colour, mix(0.5, 0.78, depth) + fresnel * 0.15);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  material.uniforms.uShade.value = shadeMap(ring, minX, minZ, sizeX, sizeZ);
  return material;
}

/** 0 at the pool edge rising to 1 about 2.5 m in, sampled every 12 cm. */
function shadeMap(ring: Vec2[], minX: number, minZ: number, sizeX: number, sizeZ: number): THREE.DataTexture {
  const w = Math.min(512, Math.ceil(sizeX / 0.12)), h = Math.min(512, Math.ceil(sizeZ / 0.12));
  const data = new Uint8Array(w * h * 4);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = minX + ((i + 0.5) / w) * sizeX, z = minZ + ((j + 0.5) / h) * sizeZ;
      let best = Infinity;
      for (let k = 0; k < ring.length; k++) {
        const [ax, az] = ring[k], [bx, bz] = ring[(k + 1) % ring.length];
        const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
      }
      const v = Math.round(255 * Math.min(1, best / 2.5) ** 0.8), at = (j * w + i) * 4;
      data[at] = data[at + 1] = data[at + 2] = v;
      data[at + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, w, h);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Push each point of a ring outwards along its own corner direction. */
function outset(ring: Vec2[], amount: number): Vec2[] {
  const n = ring.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1];
  const sign = area > 0 ? 1 : -1;
  return ring.map(([x, z], i) => {
    const [px, pz] = ring[(i - 1 + n) % n];
    const [nx, nz] = ring[(i + 1) % n];
    const dx = nx - px;
    const dz = nz - pz;
    const len = Math.hypot(dx, dz) || 1;
    return [x + (dz / len) * amount * sign, z - (dx / len) * amount * sign];
  });
}

/** The wobbling net of light that sun makes on a pool floor. */
function lightPattern(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8fd6ea";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(255,255,255,0.3)";
  g.lineWidth = 3;
  g.lineCap = "round";
  const cells = 5;
  const step = size / cells;
  const point = (i: number, j: number): [number, number] => {
    const wi = ((i % cells) + cells) % cells;
    const wj = ((j % cells) + cells) % cells;
    const s = Math.sin(wi * 127.1 + wj * 311.7) * 43758.5453;
    const t = Math.sin(wi * 269.5 + wj * 183.3) * 43758.5453;
    return [(i + 0.5 + (s - Math.floor(s) - 0.5) * 0.7) * step, (j + 0.5 + (t - Math.floor(t) - 0.5) * 0.7) * step];
  };
  // Joining jittered grid points makes an uneven net that tiles seamlessly.
  for (let i = -1; i <= cells; i++) {
    for (let j = -1; j <= cells; j++) {
      const [x, y] = point(i, j);
      for (const [di, dj] of [[1, 0], [0, 1]]) {
        const [x2, y2] = point(i + di, j + dj);
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo((x + x2) / 2 + (y2 - y) * 0.18, (y + y2) / 2 - (x2 - x) * 0.18, x2, y2);
        g.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.3, 0.3);
  return texture;
}

/**
 * Straight steps into a pool, as photographed: three white treads about 2.4 m
 * wide set square against the nearest stretch of wall, each with a dark blue
 * tile nosing. Returns meshes in metres from the wall point `at` (deck level 0),
 * or nothing when no pool wall is within 4 m.
 */
export function poolSteps(x: number, z: number, rings: Vec2[][]): { at: Vec2; meshes: THREE.Mesh[] } | undefined {
  let best: { d: number; q: Vec2; t: Vec2; ring: Vec2[] } | undefined;
  for (const ring of rings) {
    for (let k = 0; k < ring.length; k++) {
      const [ax, az] = ring[k], [bx, bz] = ring[(k + 1) % ring.length];
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1;
      const s = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (len * len)));
      const q: Vec2 = [ax + dx * s, az + dz * s], d = Math.hypot(x - q[0], z - q[1]);
      if (!best || d < best.d) best = { d, q, t: [dx / len, dz / len], ring };
    }
  }
  if (!best || best.d > 4) return undefined;
  // Inward is the side of the wall the pool lies on: test a point just off it.
  let n: Vec2 = [-best.t[1], best.t[0]];
  if (!pointInRing(best.q[0] + n[0] * 0.3, best.q[1] + n[1] * 0.3, best.ring)) n = [-n[0], -n[1]];
  // A right-handed basis: x along the wall, y up, z into the pool.
  const tx = -n[1], tz = n[0];
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(tx, 0, tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], 0, n[1]));
  const width = 2.4, tread = 0.36, rise = 0.28, white: THREE.BufferGeometry[] = [], nosing: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const top = -rise * (i + 1), height = top + POOL_DEPTH, mid = (i + 0.5) * tread;
    white.push(new THREE.BoxGeometry(width, height, tread).translate(0, -POOL_DEPTH + height / 2, mid).applyMatrix4(basis));
    nosing.push(new THREE.BoxGeometry(width, 0.012, 0.06).translate(0, top + 0.006, (i + 1) * tread - 0.03).applyMatrix4(basis));
  }
  return {
    at: best.q,
    meshes: [
      new THREE.Mesh(mergeGeometries(white, false), new THREE.MeshStandardMaterial({ color: "#f3f1ea", roughness: 0.6 })),
      new THREE.Mesh(mergeGeometries(nosing, false), new THREE.MeshStandardMaterial({ color: "#1f4f8f", roughness: 0.5 })),
    ],
  };
}

