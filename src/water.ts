import * as THREE from "three";
import type { Vec2 } from "./types";

/** How far the pool floor is below the deck, in metres. */
export const POOL_DEPTH = 1.15;
/** Where the player's feet rest in a pool: standing on the floor, chest-deep. */
export const POOL_STAND = -1.05;
const SURFACE = -0.1;

export type Pools = { update(time: number): void };

/**
 * Build each pool as a real basin: tiled walls and floor below ground level,
 * a see-through surface, and a pattern of light that drifts over the tiles.
 */
export function addPools(scene: THREE.Scene, rings: Vec2[][], styles: { color?: string; tileColor?: string; deckY?: number }[] = []): Pools {
  const light = lightPattern();
  const tiles = new THREE.MeshBasicMaterial({ map: light, color: "#bfeaf5" });
  const surface = new THREE.MeshStandardMaterial({
    color: "#39b5e2",
    transparent: true,
    opacity: 0.55,
    roughness: 0.08,
    metalness: 0.1,
    depthWrite: false,
  });
  const rim = new THREE.MeshStandardMaterial({ color: "#f4eede", roughness: 0.8 });

  for (const [index, ring] of rings.entries()) {
    const style = styles[index];
    const basin=new THREE.Group();basin.position.y=style?.deckY??0;scene.add(basin);
    const poolTiles = style?.tileColor ? tiles.clone() : tiles;
    if (style?.tileColor) poolTiles.color.set(style.tileColor);
    const poolSurface = style?.color ? surface.clone() : surface;
    if (style?.color) poolSurface.color.set(style.color);
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));

    const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), poolTiles);
    floor.position.y = -POOL_DEPTH;
    basin.add(floor);

    // Walls, facing inwards.
    const positions: number[] = [];
    const uvs: number[] = [];
    let along = 0;
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      const next = along + Math.hypot(bx - ax, bz - az);
      positions.push(ax, 0, az, bx, 0, bz, bx, -POOL_DEPTH, bz, ax, 0, az, bx, -POOL_DEPTH, bz, ax, -POOL_DEPTH, az);
      uvs.push(along, 0, next, 0, next, -POOL_DEPTH, along, 0, next, -POOL_DEPTH, along, -POOL_DEPTH);
      along = next;
    }
    const walls = new THREE.BufferGeometry();
    walls.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    walls.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const wallMaterial = poolTiles.clone();
    wallMaterial.side = THREE.DoubleSide;
    basin.add(new THREE.Mesh(walls, wallMaterial));

    const top = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), poolSurface);
    top.position.y = SURFACE;
    top.renderOrder = 2;
    basin.add(top);

    // A raised stone edge round the pool.
    const edge = new THREE.Shape(outset(ring, 0.5).map(([x, z]) => new THREE.Vector2(x, -z)));
    edge.holes.push(new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
    const lip = new THREE.Mesh(new THREE.ExtrudeGeometry(edge, { depth: 0.07, bevelEnabled: false }).rotateX(-Math.PI / 2), rim);
    lip.receiveShadow = true;
    basin.add(lip);
  }

  return {
    update(time) {
      light.offset.set(time * 0.035, Math.sin(time * 0.4) * 0.05 + time * 0.02);
    },
  };
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
  g.strokeStyle = "rgba(255,255,255,0.75)";
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
