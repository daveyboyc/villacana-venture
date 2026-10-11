import * as THREE from "three";
import { asset } from "./asset";
import { centroid, clamp, CoastField, dampAngle, pointInRing, Solids } from "./geom";
import { Player, type MoveWorld } from "./player";
import type { InputState, Skeleton, SkeletonBuilding, Vec2 } from "./types";

/** The one area being built out first: the courtyard around this pool. */
const POOL_ID = "north";
const RADIUS = 60;

const WALL = "#ffffff";
const ROOF_GREY = "#d9d5cc";
const ROOF_TERRACE = "#c98f6e";
const SHUTTER = "#7a4a2a";
const PLANTING: [number, number, number] = [58, 110, 62];

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const input: InputState = { moveX: 0, moveZ: 0, run: false, jump: false, lookDx: 0, lookDy: 0, zoom: 0, interact: false };

void boot();

async function boot(): Promise<void> {
  const skeleton = (await (await fetch(asset("/map/skeleton.json"))).json()) as Skeleton;
  const pool = skeleton.pools.find((p) => p.id === POOL_ID)!;
  const centre = centroid(pool.ring);
  const near = (ring: Vec2[]) => {
    const c = centroid(ring);
    return Math.hypot(c.x - centre.x, c.z - centre.z) < RADIUS + 25;
  };
  const buildings = skeleton.buildings.filter((b) => near(b.ring));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#bfe3f2");
  scene.fog = new THREE.Fog("#cfe9f3", 90, 260);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  scene.add(new THREE.HemisphereLight("#f4fbff", "#e6d6bd", 2.1));
  const sun = new THREE.DirectionalLight("#fff1d6", 1.9);
  sun.position.set(centre.x - 60, 90, centre.z + 40);
  sun.target.position.set(centre.x, 0, centre.z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const reach = RADIUS + 30;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 260 });
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  await addGround(scene, skeleton, centre);
  addBuildings(scene, buildings, skeleton.floorHeight);
  addShutters(scene, buildings, skeleton.floorHeight);
  addPorches(scene, buildings, skeleton.floorHeight);
  for (const p of skeleton.pools) if (near(p.ring)) addPool(scene, p.ring);

  const player = new Player();
  scene.add(player.group);
  const solids = new Solids(buildings.map((b) => b.ring));
  const spawn = findSpawn(centre, pool.ring, buildings);
  player.place(spawn[0], spawn[1], 0);
  const world: MoveWorld = {
    solids,
    // The sea is outside this area; a far-off coast keeps the player on dry land.
    coast: new CoastField([[-5000, 9000], [5000, 9000]], [0, 0]),
    pools: [],
    bounds: { minX: centre.x - RADIUS, maxX: centre.x + RADIUS, minZ: centre.z - RADIUS, maxZ: centre.z + RADIUS },
  };

  bindInput();
  let camYaw = Math.atan2(centre.x - spawn[0], -(centre.z - spawn[1]));
  let pitch = 0.45;
  let distance = 6;
  let lookHold = 0;
  const target = new THREE.Vector3();
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    readKeys();
    player.update(dt, input, world, camYaw);

    const moving = input.moveX * input.moveX + input.moveZ * input.moveZ > 0.04;
    if (input.lookDx || input.lookDy) lookHold = 0.9;
    lookHold = Math.max(0, lookHold - dt);
    camYaw += input.lookDx * 0.0045;
    pitch = clamp(pitch + input.lookDy * 0.0035, 0.15, 1.2);
    distance = clamp(distance * (1 + input.zoom * 0.08), 3.5, 40);
    if (lookHold === 0 && moving) camYaw = dampAngle(camYaw, player.yaw, dt * 2.2);

    target.set(player.x, player.y + 1.3, player.z);
    const hd = Math.cos(pitch) * distance;
    camera.position.set(target.x - Math.sin(camYaw) * hd, target.y + Math.sin(pitch) * distance, target.z + Math.cos(camYaw) * hd);
    camera.lookAt(target);
    renderer.render(scene, camera);

    input.jump = false;
    input.lookDx = 0;
    input.lookDy = 0;
    input.zoom = 0;
  });
}

function findSpawn(centre: { x: number; z: number }, pool: Vec2[], buildings: SkeletonBuilding[]): Vec2 {
  for (let r = 7; r < 30; r += 1.5) {
    for (let a = Math.PI; a < Math.PI * 3; a += Math.PI / 8) {
      const x = centre.x + Math.sin(a) * r;
      const z = centre.z + Math.cos(a) * r;
      if (pointInRing(x, z, pool)) continue;
      if (buildings.some((b) => nearRing(x, z, b.ring, 1.5))) continue;
      return [x, z];
    }
  }
  return [centre.x, centre.z];
}

function nearRing(x: number, z: number, ring: Vec2[], margin: number): boolean {
  if (pointInRing(x, z, ring)) return true;
  return ring.some((p) => Math.hypot(p[0] - x, p[1] - z) < margin);
}

async function addGround(scene: THREE.Scene, skeleton: Skeleton, centre: { x: number; z: number }): Promise<void> {
  const cover = skeleton.cover;
  const image = await new THREE.ImageLoader().loadAsync(asset(cover.image));
  const w = cover.maxX - cover.minX;
  const h = cover.maxZ - cover.minZ;

  // Redraw the part of the cover around this area larger and softened, so the
  // edges between grass, path and deck are soft lines instead of squares.
  const span = RADIUS + 40;
  const size = 2048;
  const paint = document.createElement("canvas");
  paint.width = paint.height = size;
  const pctx = paint.getContext("2d")!;
  pctx.fillStyle = "#c9a07a";
  pctx.fillRect(0, 0, size, size);
  pctx.filter = "blur(2.5px)";
  const perMetre = image.width / w;
  pctx.drawImage(
    image,
    (centre.x - span - cover.minX) * perMetre,
    (centre.z - span - cover.minZ) * perMetre,
    span * 2 * perMetre,
    span * 2 * perMetre,
    0,
    0,
    size,
    size,
  );
  const texture = new THREE.CanvasTexture(paint);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(span * 2, span * 2).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }),
  );
  ground.position.set(centre.x, 0, centre.z);
  ground.receiveShadow = true;
  scene.add(ground);

  // Trees and hedges stand wherever the ground cover is planting.
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const ctx = probe.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height).data;
  const isPlanting = (x: number, z: number) => {
    const px = Math.floor(((x - cover.minX) / w) * image.width);
    const pz = Math.floor(((z - cover.minZ) / h) * image.height);
    if (px < 0 || pz < 0 || px >= image.width || pz >= image.height) return false;
    const i = (pz * image.width + px) * 4;
    return Math.abs(data[i] - PLANTING[0]) + Math.abs(data[i + 1] - PLANTING[1]) + Math.abs(data[i + 2] - PLANTING[2]) < 40;
  };
  const spots: { x: number; z: number; s: number }[] = [];
  const step = 3.4;
  for (let x = centre.x - RADIUS; x <= centre.x + RADIUS; x += step) {
    for (let z = centre.z - RADIUS; z <= centre.z + RADIUS; z += step) {
      const jx = x + (hash(x, z) - 0.5) * 1.6;
      const jz = z + (hash(z, x) - 0.5) * 1.6;
      if (isPlanting(jx, jz)) spots.push({ x: jx, z: jz, s: 0.8 + hash(x + 7, z) * 0.6 });
    }
  }
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.14, 0.2, 1, 6),
    new THREE.MeshStandardMaterial({ color: "#6b4a33", roughness: 0.9 }),
    spots.length,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: "#3f7d45", roughness: 0.85, flatShading: true }),
    spots.length,
  );
  const m = new THREE.Matrix4();
  spots.forEach((spot, i) => {
    const trunk = 1.6 * spot.s;
    m.compose(new THREE.Vector3(spot.x, trunk / 2, spot.z), new THREE.Quaternion(), new THREE.Vector3(1, trunk, 1));
    trunks.setMatrixAt(i, m);
    const r = 1.7 * spot.s;
    m.compose(new THREE.Vector3(spot.x, trunk + r * 0.6, spot.z), new THREE.Quaternion(), new THREE.Vector3(r, r * 0.85, r));
    crowns.setMatrixAt(i, m);
  });
  trunks.castShadow = crowns.castShadow = true;
  scene.add(trunks, crowns);
}

function shapeOf(ring: Vec2[], holes: Vec2[][] = []): THREE.Shape {
  // Shape y is north, so the extruded solid can be laid flat with one turn.
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const hole of holes) shape.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))));
  return shape;
}

function addBuildings(scene: THREE.Scene, buildings: SkeletonBuilding[], floorHeight: number): void {
  const wall = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.92 });
  const grey = new THREE.MeshStandardMaterial({ color: ROOF_GREY, roughness: 0.95 });
  const terrace = new THREE.MeshStandardMaterial({ color: ROOF_TERRACE, roughness: 0.9 });
  for (const b of buildings) {
    const c = centroid(b.ring);
    // Yards and terraces are low walled enclosures, not houses.
    const height = b.floors > 0 ? b.floors * floorHeight : 1.1;
    const cap = b.floors === 0 || hash(c.x, c.z) < 0.22 ? terrace : grey;
    const geometry = new THREE.ExtrudeGeometry(shapeOf(b.ring, b.holes), { depth: height, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, [cap, wall]);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

function addShutters(scene: THREE.Scene, buildings: SkeletonBuilding[], floorHeight: number): void {
  const houses = buildings.filter((b) => b.floors > 0);
  const windows: THREE.Matrix4[] = [];
  const doors: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const b of houses) {
    const ring = b.ring;
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 2.6) continue;
      let nx = (bz - az) / length;
      let nz = -(bx - ax) / length;
      const mx = (ax + bx) / 2;
      const mz = (az + bz) / 2;
      if (pointInRing(mx + nx * 0.3, mz + nz * 0.3, ring)) {
        nx = -nx;
        nz = -nz;
      }
      const count = Math.max(1, Math.floor(length / 3.1));
      const turn = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(nx, nz));
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        const x = ax + (bx - ax) * t + nx * 0.04;
        const z = az + (bz - az) * t + nz * 0.04;
        // A wall shared with the next house has no openings.
        if (houses.some((o) => o !== b && pointInRing(x + nx * 0.5, z + nz * 0.5, o.ring))) continue;
        for (let f = 0; f < b.floors; f++) {
          const door = f === 0 && hash(x, z) < 0.3;
          const y = f * floorHeight + (door ? 1.05 : 1.55);
          (door ? doors : windows).push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), turn, new THREE.Vector3(1, 1, 1)));
        }
      }
    }
  }
  const material = new THREE.MeshStandardMaterial({ map: slatTexture(), roughness: 0.8, side: THREE.DoubleSide });
  const place = (geometry: THREE.PlaneGeometry, list: THREE.Matrix4[]) => {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    scene.add(mesh);
  };
  place(new THREE.PlaneGeometry(1.1, 1.3), windows);
  place(new THREE.PlaneGeometry(1.0, 2.1), doors);
}

/**
 * Front porches on walls that face open ground: white piers, a clay-tiled
 * lean-to roof, and on two-storey houses a balcony with a wooden rail.
 */
function addPorches(scene: THREE.Scene, buildings: SkeletonBuilding[], floorHeight: number): void {
  const houses = buildings.filter((b) => b.floors > 0);
  const blocked = (x: number, z: number) => houses.some((o) => pointInRing(x, z, o.ring));
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3(1, 0, 0);
  const parts: Record<"white" | "tile" | "wood", THREE.Matrix4[]> = { white: [], tile: [], wood: [] };
  const WIDTH = 3.4;
  const DEPTH = 1.5;

  for (const b of houses) {
    const ring = b.ring;
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < WIDTH + 0.6) continue;
      const tx = (bx - ax) / length;
      const tz = (bz - az) / length;
      let nx = tz;
      let nz = -tx;
      if (pointInRing((ax + bx) / 2 + nx * 0.3, (az + bz) / 2 + nz * 0.3, ring)) {
        nx = -nx;
        nz = -nz;
      }
      const turn = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(nx, nz));
      const count = Math.floor(length / (WIDTH + 1.6)) || 1;
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        // Only where the house looks out over a lane or garden.
        if ([1, 2.5, 4.5].some((d) => blocked(x + nx * d, z + nz * d))) continue;
        // A box given in porch space: across the wall, up, and out from it.
        const box = (list: THREE.Matrix4[], across: number, y: number, out: number, sx: number, sy: number, sz: number, tilt = 0) => {
          const q = tilt ? turn.clone().multiply(new THREE.Quaternion().setFromAxisAngle(side, tilt)) : turn;
          const p = new THREE.Vector3(x + tx * across + nx * out, y, z + tz * across + nz * out);
          list.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(sx, sy, sz)));
        };
        const top = Math.min(b.floors, 2) * floorHeight - 0.35;
        for (const edge of [-WIDTH / 2 + 0.15, WIDTH / 2 - 0.15]) {
          box(parts.white, edge, floorHeight / 2, DEPTH - 0.15, 0.3, floorHeight, 0.3);
        }
        box(parts.tile, 0, top - 0.22, DEPTH / 2 + 0.1, WIDTH + 0.3, 0.12, DEPTH + 0.5, 0.3);
        if (b.floors >= 2) {
          box(parts.white, 0, floorHeight - 0.08, DEPTH / 2, WIDTH, 0.16, DEPTH);
          box(parts.wood, 0, floorHeight + 0.95, DEPTH - 0.05, WIDTH, 0.08, 0.08);
          for (let r = -4; r <= 4; r++) box(parts.wood, (r * WIDTH) / 9, floorHeight + 0.5, DEPTH - 0.05, 0.06, 0.9, 0.06);
          for (const edge of [-WIDTH / 2 + 0.1, WIDTH / 2 - 0.1]) {
            box(parts.wood, edge, floorHeight + (top - floorHeight - 0.5) / 2, DEPTH - 0.1, 0.12, top - floorHeight - 0.5, 0.12);
          }
        }
      }
    }
  }
  const colours = { white: WALL, tile: "#b9663f", wood: SHUTTER };
  const unit = new THREE.BoxGeometry(1, 1, 1);
  for (const key of ["white", "tile", "wood"] as const) {
    const mesh = new THREE.InstancedMesh(unit, new THREE.MeshStandardMaterial({ color: colours[key], roughness: 0.9 }), parts[key].length);
    parts[key].forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = key !== "wood";
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

/** Brown wooden Persian-blind slats. */
function slatTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = SHUTTER;
  g.fillRect(0, 0, 64, 96);
  g.fillStyle = "#5b3519";
  for (let y = 6; y < 92; y += 6) g.fillRect(5, y, 54, 2);
  g.strokeStyle = "#4a2a14";
  g.lineWidth = 4;
  g.strokeRect(2, 2, 60, 92);
  g.fillRect(31, 2, 2, 92);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addPool(scene: THREE.Scene, ring: Vec2[]): void {
  const c = centroid(ring);
  const rimRing = ring.map(([x, z]): Vec2 => {
    const d = Math.hypot(x - c.x, z - c.z) || 1;
    return [x + ((x - c.x) / d) * 0.7, z + ((z - c.z) / d) * 0.7];
  });
  const flat = (shape: THREE.Shape, y: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), material);
    mesh.position.y = y;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };
  flat(shapeOf(rimRing, [ring]), 0.12, new THREE.MeshStandardMaterial({ color: "#f4eede", roughness: 0.8 }));
  flat(shapeOf(ring), 0.04, new THREE.MeshStandardMaterial({ color: "#3fb6e0", roughness: 0.15, emissive: "#0f6f96", emissiveIntensity: 0.35 }));
}

function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const keys = new Set<string>();
let stick: { id: number; x: number; y: number } | null = null;

function readKeys(): void {
  if (stick) return;
  input.moveX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  input.moveZ = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  input.run = keys.has("ShiftLeft") || keys.has("ShiftRight");
}

function bindInput(): void {
  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (e.code === "Space") input.jump = true;
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  document.querySelector("#jump")!.addEventListener("pointerdown", () => (input.jump = true));

  // Left half of a touch screen walks, anything else looks around.
  const looks = new Map<number, { x: number; y: number }>();
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === "touch" && e.clientX < window.innerWidth / 2 && !stick) {
      stick = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else {
      looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (stick && e.pointerId === stick.id) {
      input.moveX = clamp((e.clientX - stick.x) / 50, -1, 1);
      input.moveZ = clamp(-(e.clientY - stick.y) / 50, -1, 1);
      return;
    }
    const prev = looks.get(e.pointerId);
    if (!prev) return;
    input.lookDx += e.clientX - prev.x;
    input.lookDy += e.clientY - prev.y;
    looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const release = (e: PointerEvent) => {
    if (stick && e.pointerId === stick.id) {
      stick = null;
      input.moveX = 0;
      input.moveZ = 0;
    }
    looks.delete(e.pointerId);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    input.zoom += Math.sign(e.deltaY);
  }, { passive: false });
}
