import * as THREE from "three";
import data from "../data/elena_north_corner_details.json";
import corner from "../data/elena_north_corner.json";
import { wallClimber } from "./clipped-plants";
import { wallFrame } from "./elena-junction-details";
import { lanternPost, LANTERN_HEIGHT } from "./lantern-post";
import { siteY } from "./terrain";

/**
 * Show-details pieces at the west corner of the Elena north mouth (data/elena_north_corner_details.json): bougainvillea
 * over the corner patio wall, the black lantern on its bracket at the corner, and the CALLE DE ELENA tiles on the wall
 * facing the lane. The fan palms and the hedge are the beds' planting (src/cervantes-lane-edges.ts); the magnolia in
 * the patio is a tree in data/objects.json. Each piece keeps the shared route guard with its whole footprint.
 */
type Guard = (x: number, z: number, radius: number) => boolean;

/** One tall tile per letter, dark capitals in a dark border on a white glaze, as on the corner (IMG_2800, IMG_2967). */
function letterTiles(text: string, aspect: number): THREE.CanvasTexture {
  const tile = 64, high = Math.round(tile * aspect), canvas = document.createElement("canvas"); canvas.width = tile * text.length; canvas.height = high;
  const g = canvas.getContext("2d")!;
  [...text].forEach((ch, i) => {
    const x = i * tile;
    g.fillStyle = "#f5f2ea"; g.fillRect(x, 0, tile, high);
    g.strokeStyle = "#1b2230"; g.lineWidth = 5; g.strokeRect(x + 4, 4, tile - 8, high - 8);
    g.strokeStyle = "rgba(80,80,80,0.35)"; g.lineWidth = 2; g.strokeRect(x + 1, 1, tile - 2, high - 2);
    g.fillStyle = "#141821"; g.font = `bold ${Math.round(high * 0.62)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(ch, x + tile / 2, high / 2 + 3, tile - 12);
  });
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** The resort lantern without its post, hung from a scrolled iron bracket fixed to the wall. Local z out of the wall. */
function wallLantern(name: string, out: number): THREE.Group {
  const lantern = lanternPost({ name, height: LANTERN_HEIGHT * 0.85 });
  lantern.children.filter((c) => c.name.endsWith("-post")).forEach((c) => lantern.remove(c));
  const s = lantern.scale.y, group = new THREE.Group(); group.name = name;
  // Hang the lantern body (3.01 m up its post) from the bracket arm.
  lantern.position.set(0, -3.47 * s, out); group.add(lantern);
  const iron = new THREE.MeshStandardMaterial({ color: "#1a1c1d", roughness: 0.55, metalness: 0.5 });
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, out + 0.02), iron); arm.position.set(0, 0.08, out / 2); group.add(arm);
  const stay = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, Math.hypot(out, 0.3)), iron);
  stay.position.set(0, -0.07, out / 2); stay.rotation.x = Math.atan2(0.3, out); group.add(stay);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.02), iron); plate.position.set(0, -0.02, 0.01); group.add(plate);
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), iron); drop.position.set(0, 0.02, out); group.add(drop);
  group.traverse((o) => { o.castShadow = true; o.userData.noDrape = true; });
  return group;
}

export function addElenaNorthCornerDetails(into: THREE.Scene, keep: (x: number, z: number) => boolean): void {
  const guard = into.userData.decorationClearance as Guard | undefined;
  const clear = (x: number, z: number, r: number) => !guard || guard(x, z, r);
  const root = new THREE.Group(); root.name = data.id; root.userData.noDrape = true; root.userData.omitted = [] as string[];
  const omit = (id: string) => (root.userData.omitted as string[]).push(id);
  let seed = 917;
  const BED = corner.planters[0].height, bark = new THREE.MeshStandardMaterial({ color: "#6a5642", roughness: 1 });

  // Bougainvillea in 0.6 m pieces over the wall faces, so the guard bounds each with its footprint.
  for (const c of data.climbers) {
    const f = wallFrame(data.wall, c.segment, c.side), pieces = Math.max(1, Math.round((c.to - c.from) / 0.6)), len = (c.to - c.from) / pieces;
    for (let i = 0; i < pieces; i++) {
      const s = c.from + i * len, mid = s + len / 2, off = f.half + c.depth / 2;
      const cx = f.a[0] + f.u[0] * mid + f.n[0] * off, cz = f.a[1] + f.u[1] * mid + f.n[1] * off;
      if (!keep(cx, cz) || !clear(cx, cz, Math.hypot(len, c.depth) / 2)) { omit(`${c.id}-${i}`); continue; }
      // The leafy mass starts `base` up and may rise about half a metre over the coping.
      const piece = wallClimber({ length: len, height: Math.min(c.height, f.height + 0.5 - c.base), depth: c.depth, seed: seed++, flowers: Math.round((c.flowers * len) / (c.to - c.from)), flowerColour: c.colour, sparse: (c as { sparse?: boolean }).sparse });
      const start = f.forward ? s : s + len;
      const sx = f.a[0] + f.u[0] * start + f.n[0] * f.half, sz = f.a[1] + f.u[1] * start + f.n[1] * f.half;
      piece.position.set(sx, siteY(sx, sz) + c.base, sz); piece.quaternion.copy(f.turn);
      piece.name = c.id; piece.traverse((o) => { o.userData.noDrape = true; }); root.add(piece);
    }
    // Bare trained stems from the bed up to the flowering mass (IMG_2455, IMG_2800).
    const stems = (c as { stems?: number }).stems ?? 0;
    for (let i = 0; i < stems; i++) {
      const s = c.from + ((i + 0.5) * (c.to - c.from)) / stems, x = f.a[0] + f.u[0] * s + f.n[0] * (f.half + 0.08), z = f.a[1] + f.u[1] * s + f.n[1] * (f.half + 0.08);
      const rise = c.base - BED + 0.2, stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, rise, 6), bark);
      stem.position.set(x, siteY(x, z) + BED + rise / 2, z); stem.rotation.z = ((seed++ % 5) - 2) * 0.06;
      stem.castShadow = true; stem.name = c.id + "-stem"; stem.userData.noDrape = true; root.add(stem);
    }
  }

  // The lantern on its bracket at the corner.
  {
    const l = data.lamp, f = wallFrame(data.wall, l.segment, l.side);
    const x = f.a[0] + f.u[0] * l.at + f.n[0] * f.half, z = f.a[1] + f.u[1] * l.at + f.n[1] * f.half;
    const cx = x + f.n[0] * l.out, cz = z + f.n[1] * l.out;
    if (keep(cx, cz) && clear(cx, cz, 0.2)) {
      const lamp = wallLantern(l.id, l.out); lamp.position.set(x, siteY(x, z) + l.y, z); lamp.quaternion.copy(f.turn); root.add(lamp);
    } else omit(l.id);
  }

  // CALLE DE ELENA: a tile per letter, the words read left to right by someone facing the wall.
  {
    const sg = data.sign, f = wallFrame(data.wall, sg.segment, sg.side), widths = sg.words.map((w) => w.length * sg.tileW);
    const total = widths.reduce((a, b) => a + b, 0) + sg.gap * (sg.words.length - 1);
    let run = 0;
    sg.words.forEach((word, i) => {
      // Along x of the facing viewer: from the sign's left end.
      const centre = sg.centre + (f.forward ? 1 : -1) * (-total / 2 + run + widths[i] / 2);
      run += widths[i] + sg.gap;
      const x = f.a[0] + f.u[0] * centre + f.n[0] * (f.half + 0.012), z = f.a[1] + f.u[1] * centre + f.n[1] * (f.half + 0.012);
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(widths[i], sg.tileH), new THREE.MeshStandardMaterial({ map: letterTiles(word, sg.tileH / sg.tileW), roughness: 0.45 }));
      plaque.position.set(x, siteY(x, z) + sg.y, z); plaque.quaternion.copy(f.turn);
      plaque.name = sg.id; plaque.userData.noDrape = true; root.add(plaque);
    });
  }
  into.add(root);
}
