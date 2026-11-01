import * as THREE from "three";
import { pointInRing } from "./geom";
import type { SkeletonPool, Vec2 } from "./types";

/** Height of the deck's top above the lawn: the photos show a low step down at its outer edge. */
const DECK_TOP = 0.03;
/** Width of the rounded edging stones along the outer edge (IMG_2204: a paler strip under the fence spigots). */
const EDGING = 0.12;
/** One deck-slab image covers this many metres, as on the ground (src/materials.ts). */
const SLAB_METRES = 4.8;

/** Push each point of a ring outwards (negative: inwards) along its own corner direction. */
function offset(ring: Vec2[], amount: number): Vec2[] {
  const n = ring.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1];
  const sign = area > 0 ? 1 : -1;
  return ring.map(([x, z], i) => {
    const [px, pz] = ring[(i - 1 + n) % n], [nx, nz] = ring[(i + 1) % n], len = Math.hypot(nx - px, nz - pz) || 1;
    return [x + ((nz - pz) / len) * amount * sign, z - ((nx - px) / len) * amount * sign];
  });
}

/** A test for points on the measured deck of any of these pools (within `margin` of its outer edge, outside the water). */
export function onPoolDeck(pools: SkeletonPool[], margin = 0): (x: number, z: number) => boolean {
  const decks = pools.filter((p) => p.deck).map((p) => ({ edge: offset(p.deck!, margin), ring: p.ring }));
  return (x, z) => decks.some((d) => pointInRing(x, z, d.edge) && !pointInRing(x, z, d.ring));
}

/**
 * Paint the measured decks into the ground canvas: the cover's 25 cm cells, rounded by the class
 * smoothing, leave the deck's outer edge wavy. Deck pixels outside the outline become lawn and pixels
 * inside it deck, so the full-resolution slab mask and the lawn detail follow the outline. The painted
 * deck stops a pixel and a half inside the outline, under the deck mesh (addPoolDecks): sampled
 * between pixels it would otherwise show as a pale fringe round the edging stones.
 */
export function paintPoolDecks(ctx: CanvasRenderingContext2D, size: number, min: Vec2, metres: number, pools: SkeletonPool[], deck: string, lawn: string): void {
  const rgb = (hex: string) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  const d = rgb(deck), l = rgb(lawn), px = size / metres;
  for (const pool of pools) {
    if (!pool.deck) continue;
    const edge = offset(pool.deck, -1.5 / px), xs = pool.deck.map((p) => p[0]), zs = pool.deck.map((p) => p[1]);
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - 1.5 - min[0]) * px)), i1 = Math.min(size, Math.ceil((Math.max(...xs) + 1.5 - min[0]) * px));
    const j0 = Math.max(0, Math.floor((Math.min(...zs) - 1.5 - min[1]) * px)), j1 = Math.min(size, Math.ceil((Math.max(...zs) + 1.5 - min[1]) * px));
    if (i1 <= i0 || j1 <= j0) continue;
    const image = ctx.getImageData(i0, j0, i1 - i0, j1 - j0), a = image.data;
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const k = ((j - j0) * (i1 - i0) + (i - i0)) * 4, x = min[0] + (i + 0.5) / px, z = min[1] + (j + 0.5) / px;
      const isDeck = Math.abs(a[k] - d[0]) + Math.abs(a[k + 1] - d[1]) + Math.abs(a[k + 2] - d[2]) < 24;
      const within = pointInRing(x, z, edge);
      if (within && !isDeck) { a[k] = d[0]; a[k + 1] = d[1]; a[k + 2] = d[2]; }
      else if (!within && isDeck) { a[k] = l[0]; a[k + 1] = l[1]; a[k + 2] = l[2]; }
    }
    ctx.putImageData(image, i0, j0);
  }
}

/**
 * The measured stone deck round each small pool (data/pool_decks.json, outline in skeleton.json):
 * cream slabs from the water ring out to a clean curved edge, finished with rounded edging stones
 * a few centimetres above the lawn. The pool's own coping sits over its inner edge.
 */
export function addPoolDecks(scene: THREE.Scene, pools: SkeletonPool[], slabs: HTMLCanvasElement, turnDegrees: number): void {
  const texture = new THREE.CanvasTexture(slabs);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  const surface = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
  const edging = new THREE.MeshStandardMaterial({ color: "#efe6d1", roughness: 0.8 });
  const turn = (turnDegrees * Math.PI) / 180, c = Math.cos(turn), s = Math.sin(turn);
  for (const pool of pools) {
    if (!pool.deck) continue;
    const inner = offset(pool.deck, -EDGING);
    const shape = new THREE.Shape(inner.map(([x, z]) => new THREE.Vector2(x, -z)));
    shape.holes.push(new THREE.Path(pool.ring.map(([x, z]) => new THREE.Vector2(x, -z))));
    const geometry = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
    // Slabs square to the houses, as on the ground's own deck (src/materials.ts).
    const at = geometry.getAttribute("position"), uv = geometry.getAttribute("uv");
    for (let i = 0; i < at.count; i++) {
      const x = at.getX(i), z = -at.getZ(i);
      uv.setXY(i, (c * x - s * z) / SLAB_METRES, (s * x + c * z) / SLAB_METRES);
    }
    const deck = new THREE.Mesh(geometry, surface);
    deck.position.y = DECK_TOP;
    deck.receiveShadow = true;
    deck.name = `pool-deck-${pool.id}`;
    deck.userData.referenceSurface = true;
    scene.add(deck);
    // Edging: flat top from the slabs out, a quarter-round nose, then a face down below the lawn.
    const r = 0.035, profile: [number, number][] = [[-EDGING, DECK_TOP], [-r, DECK_TOP]];
    for (let k = 1; k <= 5; k++) { const a = (Math.PI / 2) * (k / 5); profile.push([-r + r * Math.sin(a), DECK_TOP - r + r * Math.cos(a)]); }
    profile.push([0, -0.06]);
    const rings = profile.map(([out]) => offset(pool.deck!, out));
    const positions: number[] = [], index: number[] = [], n = pool.deck.length;
    rings.forEach((ring, m) => ring.forEach(([x, z]) => positions.push(x, profile[m][1], z)));
    for (let m = 0; m < profile.length - 1; m++) for (let i = 0; i < n; i++) {
      const a = m * n + i, b = m * n + ((i + 1) % n), cc = (m + 1) * n + ((i + 1) % n), dd = (m + 1) * n + i;
      index.push(a, b, cc, a, cc, dd);
    }
    // Wind every face up and out, whichever way the outline runs: the flat top must face up.
    const v = (k: number) => new THREE.Vector3(positions[k * 3], positions[k * 3 + 1], positions[k * 3 + 2]);
    if (new THREE.Vector3().subVectors(v(index[1]), v(index[0])).cross(new THREE.Vector3().subVectors(v(index[2]), v(index[0]))).y < 0)
      for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2], index[k + 1]];
    const edge = new THREE.BufferGeometry();
    edge.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    edge.setIndex(index);
    edge.computeVertexNormals();
    const stones = new THREE.Mesh(edge, edging);
    stones.receiveShadow = true;
    stones.name = `pool-deck-edge-${pool.id}`;
    scene.add(stones);
  }
}
