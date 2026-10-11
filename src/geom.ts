import type { Road, Vec2 } from "./types";

export function project(
  lat: number,
  lon: number,
  origin: { lat: number; lon: number },
): { x: number; z: number } {
  const radius = 6_378_137;
  const x =
    ((lon - origin.lon) * Math.PI) / 180 * radius * Math.cos((origin.lat * Math.PI) / 180);
  const z = -(((lat - origin.lat) * Math.PI) / 180) * radius;
  return { x, z };
}

export function centroid(ring: Vec2[]): { x: number; z: number } {
  let x = 0;
  let z = 0;
  for (const p of ring) {
    x += p[0];
    z += p[1];
  }
  return { x: x / ring.length, z: z / ring.length };
}

export function pointInRing(x: number, z: number, ring: Vec2[]): boolean {
  let inside = false;
  for (let i = 0; i < ring.length; i++) {
    const [x1, z1] = ring[i];
    const [x2, z2] = ring[(i + 1) % ring.length];
    if (z1 > z !== z2 > z && x < ((x2 - x1) * (z - z1)) / (z2 - z1 || 1e-12) + x1) {
      inside = !inside;
    }
  }
  return inside;
}

export function closestOnSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): { x: number; z: number; d: number } {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 < 1e-8 ? 0 : clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1);
  const x = ax + dx * t;
  const z = az + dz * t;
  return { x, z, d: Math.hypot(px - x, pz - z) };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function dampAngle(current: number, target: number, lambda: number): number {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda));
}

/** Our yaw: 0 looks north (−z). Three.js rotation.y that aims local +Z the same way. */
export function rotationYFromYaw(yaw: number): number {
  return Math.PI - yaw;
}

export function yawFromDirection(dx: number, dz: number): number {
  return Math.atan2(dx, -dz);
}

type RingBox = { ring: Vec2[]; minX: number; maxX: number; minZ: number; maxZ: number };

export class Solids {
  private readonly boxes: RingBox[];

  constructor(rings: Vec2[][]) {
    this.boxes = rings.map((ring) => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const [x, z] of ring) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }
      return { ring, minX, maxX, minZ, maxZ };
    });
  }

  resolve(x: number, z: number, radius: number): { x: number; z: number } {
    let px = x;
    let pz = z;
    for (let pass = 0; pass < 3; pass++) {
      for (const box of this.boxes) {
        if (
          px < box.minX - radius ||
          px > box.maxX + radius ||
          pz < box.minZ - radius ||
          pz > box.maxZ + radius
        ) {
          continue;
        }
        const inside = pointInRing(px, pz, box.ring);
        let best = Infinity;
        let cx = px;
        let cz = pz;
        const ring = box.ring;
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i];
          const b = ring[(i + 1) % ring.length];
          const hit = closestOnSegment(px, pz, a[0], a[1], b[0], b[1]);
          if (hit.d < best) {
            best = hit.d;
            cx = hit.x;
            cz = hit.z;
          }
        }
        if (!inside && best >= radius) continue;
        let vx = px - cx;
        let vz = pz - cz;
        let len = Math.hypot(vx, vz);
        if (len < 1e-5) {
          const c = centroid(ring);
          vx = px - c.x;
          vz = pz - c.z;
          len = Math.hypot(vx, vz) || 1;
        }
        if (inside) {
          px = cx - (vx / len) * radius;
          pz = cz - (vz / len) * radius;
        } else {
          px = cx + (vx / len) * radius;
          pz = cz + (vz / len) * radius;
        }
      }
    }
    return { x: px, z: pz };
  }
}

export class CoastField {
  readonly normals: Vec2[];

  constructor(
    readonly coast: Vec2[],
    landRef: Vec2,
  ) {
    const segNormals: Vec2[] = [];
    for (let i = 0; i < coast.length - 1; i++) {
      const [ax, az] = coast[i];
      const [bx, bz] = coast[i + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const length = Math.hypot(dx, dz) || 1;
      let nx = -dz / length;
      let nz = dx / length;
      const mx = (ax + bx) / 2;
      const mz = (az + bz) / 2;
      if ((landRef[0] - mx) * nx + (landRef[1] - mz) * nz < 0) {
        nx = -nx;
        nz = -nz;
      }
      segNormals.push([nx, nz]);
    }
    this.normals = coast.map((_, i) => {
      const a = segNormals[Math.max(0, i - 1)];
      const b = segNormals[Math.min(segNormals.length - 1, i)];
      const nx = a[0] + b[0];
      const nz = a[1] + b[1];
      const length = Math.hypot(nx, nz) || 1;
      return [nx / length, nz / length];
    });
  }

  query(x: number, z: number): { signed: number; normal: Vec2 } {
    let best = Infinity;
    let normal: Vec2 = [0, -1];
    let cx = x;
    let cz = z;
    for (let i = 0; i < this.coast.length - 1; i++) {
      const a = this.coast[i];
      const b = this.coast[i + 1];
      const hit = closestOnSegment(x, z, a[0], a[1], b[0], b[1]);
      if (hit.d < best) {
        best = hit.d;
        cx = hit.x;
        cz = hit.z;
        normal = this.normals[i];
      }
    }
    const signedDot = (x - cx) * normal[0] + (z - cz) * normal[1];
    return { signed: signedDot >= 0 ? best : -best, normal };
  }
}

export type StreetHit = {
  name: string;
  kind: string;
  distance: number;
  point: Vec2;
  tangent: Vec2;
  width: number;
};

export function nearestStreet(x: number, z: number, roads: Road[]): StreetHit | null {
  let best: StreetHit | null = null;
  for (const road of roads) {
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const hit = closestOnSegment(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (!best || hit.d < best.distance) {
        const dx = pts[i + 1][0] - pts[i][0];
        const dz = pts[i + 1][1] - pts[i][1];
        const length = Math.hypot(dx, dz) || 1;
        best = {
          name: road.name,
          kind: road.kind,
          distance: hit.d,
          point: [hit.x, hit.z],
          tangent: [dx / length, dz / length],
          width: road.width,
        };
      }
    }
  }
  return best;
}

export function streetLabel(hit: StreetHit | null): string {
  if (!hit || hit.distance > 22) return "Villacana";
  if (hit.name) return hit.name;
  if (hit.kind === "footway" || hit.kind === "path" || hit.kind === "steps") return "Footpath";
  if (hit.kind === "track") return "Track";
  if (hit.kind === "pedestrian") return "Walkway";
  return "Lane";
}

export function inAnyPool(x: number, z: number, pools: Vec2[][]): boolean {
  for (const ring of pools) {
    if (pointInRing(x, z, ring)) return true;
  }
  return false;
}
