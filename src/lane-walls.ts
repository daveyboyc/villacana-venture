import * as THREE from "three";
import data from "../data/lane_walls.json";
import { groundElenaWall } from "./elena-wall-ground";
import { plasterMaterial } from "./materials";
import type { Vec2 } from "./types";

/** Garden and patio walls along Calle Elena and Calle Jorge (data/lane_walls.json). Structure, so they show in
 * Layout and with Show details; solid, with closed timber doors where a photo shows one. */
export type LaneWallDoor = { id: string; at: Vec2; width: number; height: number };
export type LaneWall = { id: string; name: string; area: string; points: Vec2[]; height: number; thickness: number; raise: number; doors: LaneWallDoor[]; evidence: string[]; basis: string };
export const laneWalls: LaneWall[] = data.walls.map((w) => ({ ...w, points: w.points as Vec2[], doors: w.doors.map((d) => ({ ...d, at: d.at as Vec2 })) }));

const COPING = 0.05, FOOT = 0.08, DOOR_INSET = 0.04;

function strip(a: Vec2, b: Vec2, thickness: number): Vec2[] {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = ((b[1] - a[1]) / l) * thickness / 2, nz = (-(b[0] - a[0]) / l) * thickness / 2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
}

/** Where each door sits on its wall: the segment, and the distances along it of the door's two jambs. */
export function laneWallDoorSpans(w: LaneWall): { door: LaneWallDoor; segment: number; from: number; to: number; offset: number }[] {
  return w.doors.map((door) => {
    let best = { segment: 0, along: 0, offset: Infinity };
    w.points.slice(1).forEach((b, i) => {
      const a = w.points[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
      const along = Math.max(0, Math.min(l, (door.at[0] - a[0]) * ux + (door.at[1] - a[1]) * uz));
      const px = a[0] + ux * along, pz = a[1] + uz * along, offset = Math.hypot(door.at[0] - px, door.at[1] - pz);
      if (offset < Math.abs(best.offset)) best = { segment: i, along, offset };
    });
    return { door, segment: best.segment, from: best.along - door.width / 2, to: best.along + door.width / 2, offset: best.offset };
  });
}

/** Collision follows the drawn wall, doors included (they are closed). */
export const laneWallRings = (): Vec2[][] => laneWalls.flatMap((w) => w.points.slice(1).map((b, i) => strip(w.points[i], b, w.thickness)));

function box(a: Vec2, b: Vec2, y0: number, y1: number, width: number, material: THREE.Material, name: string): THREE.Mesh {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, y1 - y0, width), material);
  mesh.position.set((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2);
  mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.name = name;
  return groundElenaWall(mesh);
}

export function addLaneWalls(scene: THREE.Scene): void {
  const plaster = plasterMaterial("#fffdf5");
  const timber = new THREE.MeshStandardMaterial({ color: "#5a3420", roughness: 0.8 });
  const group = new THREE.Group();
  group.name = data.id;
  group.userData.noDrape = true;
  group.userData.structural = true;
  for (const w of laneWalls) {
    const top = w.raise + w.height, spans = laneWallDoorSpans(w);
    w.points.slice(1).forEach((b, i) => {
      const a = w.points[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), at = (s: number): Vec2 => [a[0] + (b[0] - a[0]) * s / l, a[1] + (b[1] - a[1]) * s / l];
      // Solid runs between the doors on this segment, each with a coping a little wider than the wall.
      const cuts = spans.filter((s) => s.segment === i).sort((p, q) => p.from - q.from);
      let from = 0;
      for (const cut of [...cuts, { from: l, to: l, door: null as LaneWallDoor | null }]) {
        if (cut.from - from > 0.02) {
          group.add(box(at(from), at(cut.from), -FOOT, top - COPING, w.thickness, plaster, w.id));
          group.add(box(at(from), at(cut.from), top - COPING, top, w.thickness + 0.06, plaster, w.id));
        }
        if (cut.door) {
          // Wall over the door, and a closed timber leaf set just inside the outer face.
          const d = cut.door, p = at(cut.from), q = at(cut.to), head = w.raise + d.height;
          group.add(box(p, q, head, top - COPING, w.thickness, plaster, w.id));
          group.add(box(p, q, top - COPING, top, w.thickness + 0.06, plaster, w.id));
          group.add(box(p, q, -FOOT, head, Math.max(0.06, w.thickness - 2 * DOOR_INSET), timber, d.id));
        }
        from = cut.to;
      }
    });
  }
  scene.add(group);
}
