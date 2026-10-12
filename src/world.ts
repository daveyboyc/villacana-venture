import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { asset } from "./asset";
import { centroid, CoastField, Solids } from "./geom";
import { addBoundaryReference, barrierRings } from "./boundaries";
import type { BoundaryReference, Building, MapData, Vec2 } from "./types";

export type BuiltWorld = {
  solids: Solids;
  coast: CoastField;
  pools: Vec2[][];
  bounds: MapData["bounds"];
  occluders: THREE.Object3D;
  update: (time: number, cameraPosition: THREE.Vector3) => void;
};

export function buildWorld(scene: THREE.Scene, map: MapData, reference?: BoundaryReference): BuiltWorld {
  const coast = new CoastField(map.coast, map.landRef);
  const bounds = map.bounds;

  scene.add(new THREE.AmbientLight("#fff6ea", 0.38));
  const hemi = new THREE.HemisphereLight("#d7ecff", "#e7c99a", 0.72);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1d0", 2.55);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 220;
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.bias = -0.00045;
  sun.shadow.normalBias = 0.035;
  scene.add(sun, sun.target);

  const sky = makeSky();
  scene.add(sky);

  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.maxX - bounds.minX + 900, bounds.maxZ - bounds.minZ + 900),
    new THREE.MeshStandardMaterial({ color: "#c6b48a", roughness: 1 }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.set((bounds.minX + bounds.maxX) / 2, -0.08, (bounds.minZ + bounds.maxZ) / 2);
  base.receiveShadow = true;
  scene.add(base);

  const landRing: Vec2[] = [
    [bounds.minX, bounds.minZ],
    [bounds.maxX, bounds.minZ],
    map.coast[map.coast.length - 1],
    ...[...map.coast].reverse().slice(1),
  ];
  scene.add(flatMesh(landRing, 0, "#7eae5c", 1));
  placeAerialGround(scene, map);

  for (const garden of map.gardens) {
    scene.add(flatMesh(garden.ring, 0.012, garden.kind === "park" ? "#6ea44e" : "#63a24c", 1));
  }
  for (const pitch of map.pitches) {
    const tennis = /tennis/i.test(pitch.sport);
    scene.add(flatMesh(pitch.ring, 0.02, tennis ? "#2f8f68" : "#5c9a3e", 0.95));
  }
  for (const beach of map.beaches) {
    scene.add(flatMesh(beach.ring, 0.028, "#e6d3a4", 1));
  }

  const sand = ribbon(map.coast, coast.normals, 34, 0.034, "#e7d4a6", 1);
  sand.receiveShadow = true;
  scene.add(sand);
  const foam = ribbon(map.coast, coast.normals, 2.4, 0.05, "#f4efe4", 0.55, true);
  scene.add(foam);

  const seaEdge = map.coast.map((p, i) => {
    const n = coast.normals[i];
    return [p[0] - n[0] * 6, p[1] - n[1] * 6] as Vec2;
  });
  const seaRing: Vec2[] = [
    ...seaEdge,
    [bounds.maxX, bounds.maxZ],
    [bounds.minX, bounds.maxZ],
  ];
  const sea = flatMesh(seaRing, -0.22, "#147eaf", 0.2);
  const seaUniforms = { uTime: { value: 0 } };
  sea.material = new THREE.ShaderMaterial({
    uniforms: seaUniforms,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vPos;
      void main() {
        float wave = sin(vPos.x * 0.11 + uTime * 0.8) * sin(vPos.z * 0.09 - uTime * 0.55);
        float spark = smoothstep(0.86, 1.0, sin(vPos.x * 0.35 + uTime * 1.4) * sin(vPos.z * 0.28 - uTime));
        vec3 deep = vec3(0.04, 0.32, 0.55);
        vec3 mid = vec3(0.16, 0.62, 0.74);
        vec3 col = mix(deep, mid, 0.45 + wave * 0.28);
        col += spark * vec3(0.85, 0.92, 0.75) * 0.45;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(sea);

  const roadMat = new THREE.MeshStandardMaterial({
    color: "#d9d0c2",
    roughness: 0.94,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const pathMat = new THREE.MeshStandardMaterial({
    color: "#e6d7b4",
    roughness: 0.96,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const roadGeos: THREE.BufferGeometry[] = [];
  const pathGeos: THREE.BufferGeometry[] = [];
  for (const road of map.roads) {
    const y = road.kind === "footway" || road.kind === "path" || road.kind === "steps" ? 0.036 : 0.03;
    const geo = roadStrip(road.points, road.width, y);
    if (!geo) continue;
    if (y > 0.07) pathGeos.push(geo);
    else roadGeos.push(geo);
  }
  addMerged(scene, roadGeos, roadMat, true);
  addMerged(scene, pathGeos, pathMat, true);

  const pools = map.pools.map((pool) => pool.ring);
  const rimGeos: THREE.BufferGeometry[] = [];
  const mainWater: THREE.BufferGeometry[] = [];
  const babyWater: THREE.BufferGeometry[] = [];
  for (const pool of map.pools) {
    const rim = flatGeometry(outset(pool.ring, 0.55), 0.055);
    const water = flatGeometry(pool.ring, 0.09);
    if (rim) rimGeos.push(rim);
    if (water) (pool.kind === "baby" ? babyWater : mainWater).push(water);
  }
  addMerged(
    scene,
    rimGeos,
    new THREE.MeshStandardMaterial({ color: "#efe6d6", roughness: 0.8 }),
    true,
  );
  const waterMaterial = (color: string) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.18, metalness: 0.04 });
  addMerged(scene, mainWater, waterMaterial("#2eb6d4"), false);
  addMerged(scene, babyWater, waterMaterial("#9fe4ef"), false);

  const wallGeos: THREE.BufferGeometry[] = [];
  const roofGeos: THREE.BufferGeometry[] = [];
  const plinthGeos: THREE.BufferGeometry[] = [];
  const doors: { x: number; y: number; z: number; yaw: number; color: string }[] = [];
  const windows: { x: number; z: number; yaw: number }[] = [];

  for (const building of map.buildings) {
    try {
      const height = building.inferred ? 5.5 + hash(building.door.x, building.door.z) * 1.5 : building.height;
      const plinth = extrude(outset(building.ring, 0.12), 0.48, 0);
      const walls = extrude(building.ring, height - 0.3, 0.36);
      const roof = extrude(outset(building.ring, 0.38), 0.42, height - 0.12);
      if (plinth) paint(plinth, "#e5d6c2");
      if (walls) paint(walls, wallTint(building));
      if (roof) paint(roof, roofTint(building));
      if (plinth) plinthGeos.push(plinth);
      if (walls) wallGeos.push(walls);
      if (roof) roofGeos.push(roof);
      const yaw = building.door.yaw;
      const fx = Math.sin(yaw);
      const fz = -Math.cos(yaw);
      doors.push({
        x: building.door.x + fx * 0.14,
        y: 1.12,
        z: building.door.z + fz * 0.14,
        yaw,
        color: building.door.color,
      });
      if (building.inferred && building.width > 0) {
        pushWindows(windows, building);
      }
    } catch {
      // A broken footprint should not take the whole neighbourhood down.
    }
  }

  addMerged(scene, plinthGeos, coloredMaterial("#e5d6c2", 0.9), true);
  const wallMesh = addMerged(scene, wallGeos, coloredMaterial("#f4f0e6", 0.78), true);
  const roofMesh = addMerged(scene, roofGeos, coloredMaterial("#c4623a", 0.82), true);
  const occluders = new THREE.Group();
  if (wallMesh) occluders.add(wallMesh);
  if (roofMesh) occluders.add(roofMesh);
  scene.add(occluders);

  addDoors(scene, doors);
  addWindows(scene, windows);
  addPalms(scene, map);
  addMountains(scene, bounds);
  const clouds = addClouds(scene, bounds);
  const gulls = addGulls(scene);

  const coastLengths = cumulative(map.coast);

  if (reference) addBoundaryReference(scene, reference);
  return {
    solids: new Solids([...map.buildings.map((b) => b.ring), ...barrierRings(reference?.barriers ?? [])]),
    coast,
    pools,
    bounds: map.bounds,
    occluders,
    update(time, cameraPosition) {
      seaUniforms.uTime.value = time;
      sky.position.copy(cameraPosition);
      sun.position.set(cameraPosition.x - 55, 78, cameraPosition.z + 28);
      sun.target.position.set(cameraPosition.x, 0, cameraPosition.z);
      sun.target.updateMatrixWorld();
      clouds.forEach((cloud, i) => {
        cloud.position.x = cloud.userData.baseX + Math.sin(time * 0.05 + i) * 18;
        cloud.position.z = cloud.userData.baseZ + i * 0.2;
      });
      gulls.forEach((gull, i) => {
        const along = (time * 7 + i * 40) % coastLengths.total;
        const at = pointAlong(map.coast, coastLengths.lengths, along);
        const n = coast.normals[at.index];
        gull.position.set(at.x + n[0] * (10 + i * 3), 7.5 + Math.sin(time * 1.4 + i) * 1.1, at.z + n[1] * (10 + i * 3));
        gull.rotation.y = Math.atan2(at.tx, at.tz);
        const flap = Math.sin(time * 9 + i) * 0.55;
        gull.children[0].rotation.z = flap;
        gull.children[1].rotation.z = -flap;
      });
    },
  };
}

function placeAerialGround(scene: THREE.Scene, map: MapData): void {
  const ground = map.ground;
  if (!ground) return;
  const texture = new THREE.TextureLoader().load(asset(ground.image));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const width = ground.maxX - ground.minX;
  const depth = ground.maxZ - ground.minZ;
  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }),
  );
  mesh.position.set((ground.minX + ground.maxX) / 2, 0.05, (ground.minZ + ground.maxZ) / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function makeSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1600, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 top = vec3(0.34, 0.66, 0.93);
        vec3 mid = vec3(0.64, 0.83, 0.96);
        vec3 hor = vec3(0.98, 0.86, 0.70);
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.22, h));
        col = mix(col, top, smoothstep(0.18, 0.75, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}

function flatMesh(ring: Vec2[], y: number, color: string, roughness: number): THREE.Mesh {
  const geo = flatGeometry(ring, y) ?? new THREE.BufferGeometry();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, roughness, side: THREE.DoubleSide }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

function flatGeometry(ring: Vec2[], y: number): THREE.BufferGeometry | null {
  if (ring.length < 3) return null;
  const oriented = windUp(ring);
  const shape = new THREE.Shape();
  shape.moveTo(oriented[0][0], -oriented[0][1]);
  for (let i = 1; i < oriented.length; i++) shape.lineTo(oriented[i][0], -oriented[i][1]);
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  forceUpNormals(geo);
  return geo;
}

function extrude(ring: Vec2[], height: number, y0: number): THREE.BufferGeometry | null {
  if (ring.length < 3 || height <= 0) return null;
  const oriented = windUp(ring);
  const shape = new THREE.Shape();
  shape.moveTo(oriented[0][0], -oriented[0][1]);
  for (let i = 1; i < oriented.length; i++) shape.lineTo(oriented[i][0], -oriented[i][1]);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y0, 0);
  return finite(geo) ? geo : null;
}

function ribbon(
  coast: Vec2[],
  normals: Vec2[],
  width: number,
  y: number,
  color: string,
  opacity: number,
  transparent = false,
): THREE.Mesh {
  const positions: number[] = [];
  for (let i = 0; i < coast.length - 1; i++) {
    const a = coast[i];
    const b = coast[i + 1];
    const na = normals[i];
    const nb = normals[i + 1];
    const a2: Vec2 = [a[0] + na[0] * width, a[1] + na[1] * width];
    const b2: Vec2 = [b[0] + nb[0] * width, b[1] + nb[1] * width];
    pushTri(positions, a, b, b2, y);
    pushTri(positions, a, b2, a2, y);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  forceUpNormals(geo);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 1,
    transparent,
    opacity,
    depthWrite: !transparent,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = !transparent;
  return mesh;
}

function roadStrip(points: Vec2[], width: number, y: number): THREE.BufferGeometry | null {
  if (points.length < 2) return null;
  const half = width / 2;
  const positions: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    // Overlap the joint so a bend does not leave a wedge of grass.
    const extend = Math.min(half, len * 0.45);
    const ax = a[0] - dx * extend;
    const az = a[1] - dz * extend;
    const bx = b[0] + dx * extend;
    const bz = b[1] + dz * extend;
    const lx = dz * half;
    const lz = -dx * half;
    const aL: Vec2 = [ax + lx, az + lz];
    const aR: Vec2 = [ax - lx, az - lz];
    const bL: Vec2 = [bx + lx, bz + lz];
    const bR: Vec2 = [bx - lx, bz - lz];
    pushTri(positions, aL, aR, bR, y);
    pushTri(positions, aL, bR, bL, y);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  forceUpNormals(geo);
  return geo;
}

function pushTri(out: number[], a: Vec2, b: Vec2, c: Vec2, y: number): void {
  out.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]);
}

function windUp(ring: Vec2[]): Vec2[] {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, z1] = ring[i];
    const [x2, z2] = ring[(i + 1) % ring.length];
    area += x1 * -z2 - x2 * -z1;
  }
  return area < 0 ? [...ring].reverse() : ring;
}

function forceUpNormals(geo: THREE.BufferGeometry): void {
  const pos = geo.getAttribute("position");
  const normals = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) normals[i * 3 + 1] = 1;
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
}

function paint(geo: THREE.BufferGeometry, color: string): void {
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < pos.count; i++) c.toArray(colors, i * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function coloredMaterial(color: string, roughness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
}

function addMerged(
  scene: THREE.Scene,
  geos: THREE.BufferGeometry[],
  material: THREE.Material,
  shadows: boolean,
): THREE.Mesh | null {
  const ready = geos.filter((geo) => finite(geo)).map((geo) => (geo.index ? geo.toNonIndexed() : geo));
  if (!ready.length) return null;
  const merged = mergeGeometries(ready, false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  scene.add(mesh);
  return mesh;
}

function finite(geo: THREE.BufferGeometry): boolean {
  const pos = geo.getAttribute("position");
  if (!pos || pos.count < 3) return false;
  for (let i = 0; i < Math.min(8, pos.count); i++) {
    if (!Number.isFinite(pos.getX(i)) || !Number.isFinite(pos.getY(i)) || !Number.isFinite(pos.getZ(i))) {
      return false;
    }
  }
  return true;
}

function wallTint(building: Building): string {
  const shift = (hash(building.door.x, building.door.z) - 0.5) * 0.04;
  const color = new THREE.Color("#f6f1e7");
  color.offsetHSL(0.02 * shift, 0, shift);
  return `#${color.getHexString()}`;
}

function roofTint(building: Building): string {
  const shift = (hash(building.door.z, building.door.x) - 0.5) * 0.08;
  const color = new THREE.Color("#c4623a");
  color.offsetHSL(shift * 0.2, 0.05, shift);
  return `#${color.getHexString()}`;
}

function pushWindows(windows: { x: number; z: number; yaw: number }[], building: Building): void {
  const c = centroid(building.ring);
  const yaw = building.face;
  const fx = Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = Math.sin(yaw);
  const front = building.depth / 2;
  for (const side of [-1.45, 1.45]) {
    windows.push({
      x: c.x + fx * (front + 0.08) + rx * side,
      z: c.z + fz * (front + 0.08) + rz * side,
      yaw,
    });
  }
}

function addDoors(scene: THREE.Scene, doors: { x: number; y: number; z: number; yaw: number; color: string }[]): void {
  if (!doors.length) return;
  const geo = new THREE.BoxGeometry(0.92, 2.05, 0.1);
  const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7 });
  const mesh = new THREE.InstancedMesh(geo, mat, doors.length);
  mesh.castShadow = true;
  const dummy = new THREE.Object3D();
  doors.forEach((door, i) => {
    dummy.position.set(door.x, door.y, door.z);
    dummy.rotation.set(0, Math.PI - door.yaw, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(door.color));
  });
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
}

function addWindows(scene: THREE.Scene, windows: { x: number; z: number; yaw: number }[]): void {
  if (!windows.length) return;
  const geo = new THREE.BoxGeometry(0.72, 0.86, 0.06);
  const mat = new THREE.MeshStandardMaterial({
    color: "#9fd0de",
    roughness: 0.18,
    metalness: 0.05,
    emissive: "#163040",
    emissiveIntensity: 0.18,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, windows.length);
  const dummy = new THREE.Object3D();
  windows.forEach((win, i) => {
    dummy.position.set(win.x, 3.35, win.z);
    dummy.rotation.set(0, Math.PI - win.yaw, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(mesh);
}

function addPalms(scene: THREE.Scene, map: MapData): void {
  const palms = map.palms;
  if (!palms.length) return;
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.19, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#8d5a34", roughness: 0.86 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palms.length);
  trunks.castShadow = true;
  const frondGeo = new THREE.ConeGeometry(0.18, 1.45, 4);
  frondGeo.translate(0, 0.55, 0);
  frondGeo.rotateX(1.15);
  const frondMat = new THREE.MeshStandardMaterial({ color: "#2f8f46", roughness: 0.75 });
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, palms.length * 6);
  fronds.castShadow = true;
  const flowerGeo = new THREE.SphereGeometry(0.48, 7, 5);
  flowerGeo.scale(1.15, 0.7, 1.15);
  const flowerMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7 });
  const flowerCount = Math.ceil(palms.length / 2);
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const dummy = new THREE.Object3D();
  const palette = ["#d23b78", "#e4574f", "#ef5d9a", "#f08a2a"];
  let flowerIndex = 0;
  palms.forEach((palm, i) => {
    const height = 2.35 * palm.s;
    dummy.position.set(palm.x, 0, palm.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(palm.s, height, palm.s);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let f = 0; f < 6; f++) {
      dummy.position.set(palm.x, height * 0.92, palm.z);
      dummy.scale.set(palm.s, palm.s, palm.s);
      dummy.rotation.set(0, (f / 6) * Math.PI * 2 + i, 0);
      dummy.updateMatrix();
      fronds.setMatrixAt(i * 6 + f, dummy.matrix);
    }
    if (i % 2 === 0 && flowerIndex < flowerCount) {
      const angle = hash(palm.x, palm.z) * Math.PI * 2;
      dummy.position.set(palm.x + Math.cos(angle) * 0.9, 0.42, palm.z + Math.sin(angle) * 0.9);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      flowers.setMatrixAt(flowerIndex, dummy.matrix);
      flowers.setColorAt(flowerIndex, new THREE.Color(palette[i % palette.length]));
      flowerIndex++;
    }
  });
  flowers.count = flowerIndex;
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  scene.add(trunks, fronds, flowers);
}

function addMountains(scene: THREE.Scene, bounds: MapData["bounds"]): void {
  const mat = new THREE.MeshStandardMaterial({ color: "#8f9b86", roughness: 1 });
  const specs = [
    [-260, 70, 150],
    [-40, 96, 180],
    [180, 64, 130],
    [360, 80, 160],
  ];
  for (const [x, height, radius] of specs) {
    const geo = new THREE.ConeGeometry(radius, height, 7);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2 - 8, bounds.minZ - radius * 0.55);
    scene.add(mesh);
  }
}

function addClouds(scene: THREE.Scene, bounds: MapData["bounds"]): THREE.Object3D[] {
  const mat = new THREE.MeshStandardMaterial({ color: "#fffaf4", roughness: 1 });
  const clouds: THREE.Object3D[] = [];
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Group();
    for (let p = 0; p < 3; p++) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(7 + p * 2, 8, 6), mat);
      ball.position.set(p * 8 - 8, p === 1 ? 3 : 0, 0);
      ball.scale.set(1.4, 0.7, 1);
      puff.add(ball);
    }
    puff.position.set(bounds.minX + 80 + i * 110, 78 + (i % 3) * 16, bounds.minZ + 40 + (i % 4) * 70);
    puff.userData.baseX = puff.position.x;
    puff.userData.baseZ = puff.position.z;
    scene.add(puff);
    clouds.push(puff);
  }
  return clouds;
}

function addGulls(scene: THREE.Scene): THREE.Group[] {
  const mat = new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.55 });
  const gulls: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const gull = new THREE.Group();
    const wing = new THREE.BoxGeometry(0.62, 0.035, 0.16);
    const left = new THREE.Mesh(wing, mat);
    const right = new THREE.Mesh(wing, mat);
    left.position.x = -0.34;
    right.position.x = 0.34;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.4), mat);
    gull.add(left, right, body);
    scene.add(gull);
    gulls.push(gull);
  }
  return gulls;
}

function cumulative(points: Vec2[]): { lengths: number[]; total: number } {
  const lengths = [0];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
    lengths.push(total);
  }
  return { lengths, total: Math.max(total, 1) };
}

function pointAlong(
  points: Vec2[],
  lengths: number[],
  distance: number,
): { x: number; z: number; tx: number; tz: number; index: number } {
  let index = 0;
  while (index < lengths.length - 2 && lengths[index + 1] < distance) index++;
  const span = lengths[index + 1] - lengths[index] || 1;
  const t = (distance - lengths[index]) / span;
  const a = points[index];
  const b = points[Math.min(points.length - 1, index + 1)];
  const tx = b[0] - a[0];
  const tz = b[1] - a[1];
  return { x: a[0] + tx * t, z: a[1] + tz * t, tx, tz, index };
}

function outset(ring: Vec2[], amount: number): Vec2[] {
  const c = centroid(ring);
  return ring.map(([x, z]) => {
    const dx = x - c.x;
    const dz = z - c.z;
    const len = Math.hypot(dx, dz) || 1;
    return [x + (dx / len) * amount, z + (dz / len) * amount];
  });
}

function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
