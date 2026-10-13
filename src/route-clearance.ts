import { closestOnSegment } from "./geom";
import threshold from "../data/dali_cervantes_threshold.json";
import type { BoundaryReference, Vec2 } from "./types";
export type ProtectedRoute = {
  id: string;
  name: string;
  points: Vec2[];
  width: number;
};
export function protectedRoutes(
  reference: BoundaryReference,
  paseo?: ProtectedRoute,
  extra: ProtectedRoute[] = [],
): ProtectedRoute[] {
  return [
    ...reference.roads.map((r, i) => ({ ...r, id: r.id ?? `road-${i}` })),
    {
      id: "dali-shared-footpath",
      name: "Dalí house-side footpath",
      points: threshold.footpathCentreline as Vec2[],
      width: 1.3,
    },
    ...(paseo ? [paseo] : []),
    ...extra,
  ];
}
/** Include the entire visible object footprint, not just its centre. */
export function routeClearance(
  routes: ProtectedRoute[],
  x: number,
  z: number,
  radius = 0,
): boolean {
  return !routes.some((r) =>
    r.points
      .slice(1)
      .some(
        (b, i) =>
          closestOnSegment(x, z, ...r.points[i], ...b).d <
          r.width / 2 + radius + 0.15,
      ),
  );
}
export function propRadius(kind: string): number {
  return (
    (
      {
        parasol: 1.5,
        sun_lounger: 1.15,
        blue_sun_lounger: 1.15,
        pump_box: 0.72,
        plant_pot: 0.55,
        life_ring: 0.42,
        lamp_post: 0.35,
      } as Record<string, number>
    )[kind] ?? 0.7
  );
}
