import * as THREE from "three";
import data from "../data/alberto_passage.json";
import skeleton from "../public/map/skeleton.json";
import { looseShrub } from "./clipped-plants";
import { centroid, pointInRing } from "./geom";
import { plasterMaterial } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/**
 * The CALLE ALBERTO 22 40 covered porch off Calle Eva east (IMG_2792), built in the only recess of
 * the registry facade the camera faces: arch on square piers, red studded ramp, tiled step platform,
 * plaque and AGUA POTABLE hatch on the back wall. The passage beyond is not seen and is not cut
 * through the house; the map shows its likely line to the inner courtyard as inferred.
 */
export const albertoPassage = data;
const F = data.frame, O = F.origin as Vec2, A = F.along as Vec2, I = F.in as Vec2, W = F.width, D = F.depth;
/** Point at `a` metres along the facade from the recess's south corner, `d` metres into the house. */
export const albertoAt = (a: number, d: number): Vec2 => [O[0] + A[0] * a + I[0] * d, O[1] + A[1] * a + I[1] * d];
export const albertoRect = (a0: number, a1: number, d0: number, d1: number): Vec2[] => [albertoAt(a0, d0), albertoAt(a1, d0), albertoAt(a1, d1), albertoAt(a0, d1)];
/** The recess the porch fills, plus its front step: generated walls and clutter give way here. */
export const albertoPorchRing = (): Vec2[] => albertoRect(-0.1, W + 0.1, data.platform.step.from - 0.1, D);
export const inAlbertoPorch = (x: number, z: number) => pointInRing(x, z, albertoPorchRing());
export function suppressInAlbertoPorch<T extends { gardenWalls: Vec2[]; gardenGates: Vec2[]; props: { x: number; z: number }[] }>(s: T): void {
  s.gardenWalls = s.gardenWalls.filter(([x, z]) => !inAlbertoPorch(x, z));
  s.gardenGates = s.gardenGates.filter(([x, z]) => !inAlbertoPorch(x, z));
  s.props = s.props.filter((p) => !inAlbertoPorch(p.x, p.z));
}

const host = skeleton.buildings.find((b) => b.id === data.hostBuilding)!;
/** The house keeps one level: the ground at its middle, as addBuildings places it. */
const houseBase = (): number => { const c = centroid(host.ring as Vec2[]); return siteY(c.x, c.z); };

function canvas(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** Black glazed letter tiles with white letters, one tile per letter (IMG_2792). */
function plaqueTexture(words: string[]): THREE.CanvasTexture {
  const letters = words.join(" ").length, tile = 64;
  return canvas(letters * tile, tile, (g) => {
    g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, letters * tile, tile);
    let i = 0;
    for (const [k, w] of words.entries()) {
      for (const ch of w) {
        const x = i * tile;
        g.fillStyle = "#121212"; g.fillRect(x + 2, 2, tile - 4, tile - 4);
        g.strokeStyle = "#e8e6df"; g.lineWidth = 2; g.strokeRect(x + 5, 5, tile - 10, tile - 10);
        g.fillStyle = "#f2f0ea"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "bold 40px Arial, sans-serif"; g.fillText(ch, x + tile / 2, tile / 2 + 2);
        i++;
      }
      if (k < words.length - 1) i++;
    }
  });
}
function hatchTexture(): THREE.CanvasTexture {
  return canvas(200, 170, (g) => {
    g.fillStyle = "#efeee8"; g.fillRect(0, 0, 200, 170); g.strokeStyle = "#c4c3ba"; g.lineWidth = 8; g.strokeRect(8, 8, 184, 154);
    g.fillStyle = "#b1b0a7"; g.textAlign = "center"; g.font = "bold 30px Arial, sans-serif"; g.fillText("AGUA", 100, 75); g.fillText("POTABLE", 100, 112);
  });
}
function studTexture(): THREE.CanvasTexture {
  const t = canvas(128, 128, (g) => {
    g.fillStyle = "#9c3b30"; g.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 16) for (let y = 0; y < 128; y += 16) { g.fillStyle = "#b8493c"; g.fillRect(x + 4, y + 4, 8, 8); g.fillStyle = "#7e2e25"; g.fillRect(x + 10, y + 10, 3, 3); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function quarryTexture(): THREE.CanvasTexture {
  const t = canvas(128, 128, (g) => {
    g.fillStyle = "#d9d3c7"; g.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? "#b4553d" : "#ad5038"; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/** A box between run coordinates, from y0 to y1 above the lane, turned with the facade. */
function block(a0: number, a1: number, d0: number, d1: number, y0: number, y1: number, material: THREE.Material | THREE.Material[], name: string): THREE.Mesh {
  const g = new THREE.BoxGeometry(a1 - a0, y1 - y0, d1 - d0), m = new THREE.Mesh(g, material);
  const c = albertoAt((a0 + a1) / 2, (d0 + d1) / 2);
  m.position.set(c[0], (y0 + y1) / 2, c[1]); m.rotation.y = -Math.atan2(A[1], A[0]);
  m.name = name; m.castShadow = m.receiveShadow = true; return m;
}

export function addAlbertoPassage(scene: THREE.Scene): void {
  const group = new THREE.Group(); group.name = data.id; group.userData.noDrape = true;
  const ground = siteY(...albertoAt(W / 2, 0)), base = houseBase();
  group.position.y = ground; scene.add(group);
  const top = host.floors * skeleton.floorHeight + base - ground, ar = data.arch, white = plasterMaterial("#fbfaf4");
  // Piers either side of the opening, a little proud of the facade, with a stepped impost.
  for (const [a0, a1] of [[0, ar.pier], [W - ar.pier, W]]) {
    group.add(block(a0, a1, -ar.proud, 0.2, 0, ar.spring, white, data.id + "-pier"));
    group.add(block(a0 - 0.04, a1 + 0.04, -ar.proud - 0.04, 0.22, ar.spring, ar.spring + 0.09, white, data.id + "-impost"));
  }
  // Spandrel above the arch: a plate with a semi-elliptical opening, then the house wall closes the recess above the ceiling.
  const span = W - 2 * ar.pier, rise = ar.crown - ar.spring, plate = new THREE.Shape();
  plate.moveTo(-W / 2, ar.spring); plate.lineTo(-span / 2, ar.spring);
  for (let k = 0; k <= 24; k++) { const t = Math.PI - (Math.PI * k) / 24; plate.lineTo(Math.cos(t) * span / 2, ar.spring + Math.sin(t) * rise); }
  plate.lineTo(W / 2, ar.spring); plate.lineTo(W / 2, ar.ceiling + 0.12); plate.lineTo(-W / 2, ar.ceiling + 0.12); plate.closePath();
  const spandrel = new THREE.Mesh(new THREE.ExtrudeGeometry(plate, { depth: 0.3, bevelEnabled: false }), white);
  // ExtrudeGeometry runs along local +z, which the facade turn points into the house.
  const front = albertoAt(W / 2, -ar.proud);
  spandrel.position.set(front[0], 0, front[1]); spandrel.rotation.y = -Math.atan2(A[1], A[0]); spandrel.name = data.id + "-arch"; spandrel.castShadow = true;
  group.add(spandrel);
  if (top > ar.ceiling + 0.1) group.add(block(0, W, 0, D, ar.ceiling, top, white, data.id + "-house-over"));
  // Floor: red studded ramp on the right (north) share, a tiled step platform on the left.
  const R = data.ramp, rampLen = D - R.from, studs = new THREE.MeshStandardMaterial({ map: studTexture(), roughness: 0.95 });
  studs.map!.repeat.set((R.along[1] - R.along[0]) / 0.3, rampLen / 0.3);
  const rampGeo = new THREE.PlaneGeometry(R.along[1] - R.along[0], Math.hypot(rampLen, R.rise)).rotateX(-Math.PI / 2);
  const ramp = new THREE.Mesh(rampGeo, studs), rc = albertoAt((R.along[0] + R.along[1]) / 2, (R.from + D) / 2);
  ramp.position.set(rc[0], R.rise / 2 + 0.07, rc[1]); ramp.rotation.order = "YXZ"; ramp.rotation.y = -Math.atan2(A[1], A[0]); ramp.rotation.x = -Math.atan2(R.rise, rampLen);
  ramp.name = data.id + "-ramp"; ramp.receiveShadow = true; group.add(ramp);
  const Pf = data.platform, tiles = new THREE.MeshStandardMaterial({ map: quarryTexture(), roughness: 0.8 });
  tiles.map!.repeat.set(2, 2);
  group.add(block(Pf.along[0], Pf.along[1], Pf.from, D, 0.06, 0.06 + Pf.height, [white, white, tiles, white, white, white], data.id + "-platform"));
  group.add(block(Pf.along[0], Pf.along[1], Pf.step.from, Pf.from, 0.06, 0.06 + Pf.step.height, [white, white, tiles, white, white, white], data.id + "-step"));
  // Back wall furniture: black letter tiles and the service hatch, just off the wall face.
  const onWall = (a0: number, a1: number, y0: number, y1: number, map: THREE.Texture, name: string) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(a1 - a0, y1 - y0), new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.4 }));
    const c = albertoAt((a0 + a1) / 2, D - 0.012); m.position.set(c[0], (y0 + y1) / 2, c[1]);
    m.rotation.y = -Math.atan2(A[1], A[0]) + Math.PI; m.name = name; group.add(m);
  };
  const pl = data.plaque, letters = pl.text.join(" ").length;
  onWall(pl.along[0], pl.along[0] + Math.min(pl.along[1] - pl.along[0], letters * pl.height), pl.up, pl.up + pl.height, plaqueTexture(pl.text), data.id + "-plaque");
  onWall(data.hatch.along[0], data.hatch.along[1], data.hatch.up[0], data.hatch.up[1], hatchTexture(), data.id + "-hatch");
  if (scene.userData.layoutOnly) return;
  const guard = scene.userData.decorationClearance as ((x: number, z: number, r: number) => boolean) | undefined;
  const clay = new THREE.MeshStandardMaterial({ color: "#a65a3a", roughness: 0.9 });
  for (const p of data.plants) {
    const at = albertoAt(p.along, p.in), big = p.kind === "big-leaf", r = big ? 0.7 : 0.4;
    if (guard && !guard(at[0], at[1], r)) continue;
    const onPlatform = p.along >= Pf.along[0] && p.along <= Pf.along[1] && p.in >= Pf.from, y = onPlatform ? 0.06 + Pf.height : 0.06;
    const plant = new THREE.Group(); plant.name = p.id; plant.position.set(at[0], y, at[1]);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(big ? 0.3 : 0.26, big ? 0.22 : 0.19, big ? 0.5 : 0.42, 18), clay);
    pot.position.y = big ? 0.25 : 0.21; pot.castShadow = true; plant.add(pot);
    const leaves = big
      ? looseShrub({ width: 1.3, depth: 1.1, height: 2.1, seed: 211, leaf: "glossy", leafSize: [0.24, 0.1], greens: ["#3e6a2e", "#4f7b37", "#2f5527"], stems: 6 })
      : looseShrub({ width: 0.75, depth: 0.7, height: 0.65, seed: 223, leaf: "glossy", leafSize: [0.07, 0.055], greens: ["#5f8a4d", "#6f9a58", "#4f7a40"], stems: 4 });
    leaves.position.y = big ? 0.45 : 0.36; plant.add(leaves);
    plant.userData.footprint = albertoRect(p.along - r, p.along + r, p.in - r, p.in + r);
    group.add(plant);
  }
}
