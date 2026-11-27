import type { Seafront, Vec2 } from "./types";

/** Continue the local trace along the seaward side of the mapped beach polygon. */
export function shoreline(sf: Seafront): Vec2[] {
  const beach = sf.beach.ring;
  const join = beach.findIndex(([x,z]) => x === sf.coast[1][0] && z === sf.coast[1][1]);
  if (join < 0) return sf.coast;
  let start = join;
  while (start > 0 && beach[start - 1][0] < beach[start][0]) start--;
  return [...beach.slice(start + 1, join).filter(([x]) => x < sf.coast[0][0]), ...sf.coast];
}

/** Vertical slice through an open polyline or a closed polygon in map coordinates. */
export function crossings(points: Vec2[], x: number, closed = false): number[] {
  const hits: number[] = [];
  for (let i = 0; i < points.length - (closed ? 0 : 1); i++) {
    const [ax, az] = points[i], [bx, bz] = points[(i + 1) % points.length];
    if ((ax <= x && x < bx) || (bx <= x && x < ax)) hits.push(az + (bz - az) * (x - ax) / (bx - ax));
  }
  return hits;
}
