import data from "../data/plain_fronts.json";

/**
 * Faces the photos show plain (data/plain_fronts.json): no generated porches and, where marked, no
 * generated windows, doors or shutters. A wall is in a front when its midpoint lies in the front's box
 * and its outward normal (nx, nz) points the front's way.
 */
type Front = { id: string; box: number[]; facing: number[]; noPorches: boolean; noOpenings: boolean };
const fronts = data.fronts as Front[];

function match(x: number, z: number, nx: number, nz: number, keep: (f: Front) => boolean): boolean {
  return fronts.some((f) => keep(f) && x >= f.box[0] && z >= f.box[1] && x <= f.box[2] && z <= f.box[3] && nx * f.facing[0] + nz * f.facing[1] > 0.5);
}

/** No generated porch (balcony, porch roof, awning) on this wall. */
export function plainForPorches(x: number, z: number, nx: number, nz: number): boolean {
  return match(x, z, nx, nz, (f) => f.noPorches);
}

/** No generated windows, doors or shutters on this wall. */
export function plainForOpenings(x: number, z: number, nx: number, nz: number): boolean {
  return match(x, z, nx, nz, (f) => f.noOpenings);
}

type Bare = { id: string; box: number[] };
const bare = ((data as { bareWalls?: Bare[] }).bareWalls ?? []);

/** A generated low garden wall the photos show bare: no hashed hedge run on it. */
export function bareGardenWall(x: number, z: number): boolean {
  return bare.some((b) => x >= b.box[0] && z >= b.box[1] && x <= b.box[2] && z <= b.box[3]);
}
