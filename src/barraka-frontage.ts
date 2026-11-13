import * as THREE from "three";
import data from "../data/barraka_frontage.json";
import { Foliage, seeded } from "./clipped-plants";
import { routeClearance, type ProtectedRoute } from "./route-clearance";
import type { Vec2 } from "./types";

/** Barraka's roped lounge garden and the painted paseo crossing (data/barraka_frontage.json). Details only: no collision, terrain or footprint. */
export const loungeCentre = data.lounge.centre as Vec2;
export const crossingAt = data.crossing.at as Vec2;

/** A dark woven surface: the pod armchairs and sofa frames are grey-brown wicker (IMG_2609, IMG_2631). */
function wickerMaterial(): THREE.MeshStandardMaterial {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d")!; g.fillStyle = "#59534c"; g.fillRect(0, 0, 128, 128);
  for (let i = -128; i < 256; i += 9) {
    g.strokeStyle = "rgba(30,26,22,.55)"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.strokeStyle = "rgba(150,140,126,.35)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 3);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 1, side: THREE.DoubleSide });
}

export function addBarrakaFrontage(scene: THREE.Scene, groundY: (x: number, z: number) => number): void {
  if (scene.userData.layoutOnly) return;
  const routes = [...(scene.userData.protectedRoutes as ProtectedRoute[] ?? [])];
  const clear = (x: number, z: number, radius: number) => routeClearance(routes, x, z, radius);
  const group = new THREE.Group(); group.name = "barraka-frontage"; group.userData.noDrape = true; scene.add(group);
  const std = (color: string, roughness = .9) => new THREE.MeshStandardMaterial({ color, roughness });
  const timber = std("#7a4c2c"), cream = std("#ece0c4"), black = std("#1e1d1b", .6), terracotta = std("#b4623e"), tan = std("#c9a872"), rope = std("#f1ecdf", 1);
  const wicker = wickerMaterial();
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };

  const lounge = data.lounge, [tx, tz] = lounge.along, [cx, cz] = lounge.centre as Vec2;
  const seating = new THREE.Group(); seating.name = lounge.id; seating.userData.evidence = lounge.evidence; group.add(seating);
  // Rope and posts: a timber post every 2.3 m with a white rope swag between each pair.
  const fence = new THREE.Group(); fence.name = lounge.rope.id; seating.add(fence);
  const allPosts = lounge.rope.posts as Vec2[], standing = allPosts.map(([x, z]) => clear(x, z, .1));
  allPosts.forEach(([x, z], i) => { if (standing[i]) box(fence, .09, lounge.rope.height, .09, x, groundY(x, z) + lounge.rope.height / 2, z, timber); });
  allPosts.slice(1).forEach((b, i) => {
    const a = allPosts[i];
    if (!standing[i] || !standing[i + 1]) return;
    const top = lounge.rope.height - .06, points = [0, .25, .5, .75, 1].map(t => {
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      return new THREE.Vector3(x, groundY(x, z) + top - Math.sin(Math.PI * t) * lounge.rope.sag, z);
    });
    const swag = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .014, 5), rope); swag.castShadow = true; fence.add(swag);
  });

  // Local frame at the seating centre: u along the paseo towards Barraka (the way the seats face), v seaward.
  const local = (u: number, v: number): Vec2 => [cx + tx * u - tz * v, cz + tz * u + tx * v];
  const faceBarraka = Math.atan2(tx, tz);
  const place = (parent: THREE.Object3D, x: number, z: number, heading: number, radius: number, name: string, make: (g: THREE.Group) => void) => {
    // The visible footprint (radius) must keep clear of the paseo and the Barraka walk.
    if (!clear(x, z, radius)) return;
    const g = new THREE.Group(); g.name = name; g.position.set(x, groundY(x, z) + .05, z); g.rotation.y = heading; make(g); parent.add(g);
  };
  const sofa = (g: THREE.Group) => {
    box(g, 1.9, .34, .82, 0, .26, 0, wicker); box(g, 1.9, .46, .14, 0, .6, -.34, wicker);
    for (const s of [-1, 1]) box(g, .14, .3, .82, s * .88, .5, 0, wicker);
    for (const k of [-1, 0, 1]) { box(g, .56, .14, .62, k * .6, .5, .08, cream); box(g, .56, .42, .12, k * .6, .72, -.22, cream).rotation.x = -.12; }
  };
  const pod = (g: THREE.Group) => {
    // A woven bowl open at the front (+z) with a cream seat cushion; about 0.95 m across.
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12, Math.PI * .75, Math.PI * 1.5, 0, Math.PI * .78), wicker);
    shell.scale.set(.48, .46, .46); shell.position.y = .46; shell.castShadow = true; g.add(shell);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .12, 14), cream); cushion.position.y = .3; cushion.castShadow = true; g.add(cushion);
  };
  // Two groups side by side across the paseo's direction: a sofa at the back and two pods in front of it.
  for (const s of [-1, 1]) {
    place(seating, ...local(lounge.sofaU, s * lounge.sofaSpacing / 2), faceBarraka, 1.1, lounge.id + "-sofa", sofa);
    for (const k of [-1, 1]) place(seating, ...local(lounge.podU, s * lounge.sofaSpacing / 2 + k * .55), faceBarraka - k * .3, .6, lounge.id + "-pod", pod);
  }
  place(seating, ...local(lounge.tableU, 0), faceBarraka, .5, lounge.id + "-table", g => box(g, .72, .36, .72, 0, .2, 0, black));
  // The closed cream parasol leaning a little between the two groups.
  place(seating, ...local(lounge.tableU - .3, 0), faceBarraka, .5, lounge.id + "-parasol", g => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, 2.35, 8), std("#8b8b86")); pole.position.y = 1.18; g.add(pole);
    const furled = new THREE.Mesh(new THREE.CylinderGeometry(.03, .2, 1.1, 10), cream); furled.position.y = 1.72; furled.castShadow = true; g.add(furled);
    g.rotation.z = .05;
  });

  // The black wrought-iron menu stand, the easel sign and the terracotta pots at the restaurant end of the rope.
  const [mx, mz] = lounge.menuStand as Vec2, [ex, ez] = lounge.easel as Vec2;
  place(seating, mx, mz, faceBarraka + Math.PI, .3, lounge.id + "-menu-stand", g => {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .05, 14), black); base.position.y = .03; g.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, 1.15, 8), black); stem.position.y = .6; stem.castShadow = true; g.add(stem);
    box(g, .5, .02, .34, 0, 1.2, 0, black).rotation.x = -.45; box(g, .44, .01, .3, 0, 1.213, 0, cream).rotation.x = -.45;
  });
  place(seating, ex, ez, faceBarraka + Math.PI, .55, lounge.id + "-easel-sign", g => {
    for (const dx of [-.35, .35]) { const leg = box(g, .04, 1.75, .035, dx, .86, .18, timber); leg.rotation.z = -dx * .12; leg.rotation.x = -.12; }
    box(g, .04, 1.7, .035, 0, .84, -.3, timber).rotation.x = .2;
    box(g, .78, .98, .02, 0, 1.0, .06, tan);
  });
  (lounge.pots as number[][]).forEach(([x, z, r], i) => place(seating, x, z, 0, r + .05, lounge.id + "-pot", g => {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .62, .5, 16), i === 2 ? std("#f4f1ea") : terracotta); bowl.position.y = .25; bowl.castShadow = true; g.add(bowl);
    const plant = potPlant(i === 1 ? "spike" : "round", 12 + i, r);
    plant.position.y = .48; g.add(plant);
  }));

  // The red and white painted crossing right outside the beach gateway (IMG_2766, IMG_2767): eight bars side by
  // side along the walk, each running straight across the paving from the gate threshold; flush, so no obstruction.
  const c = data.crossing, [ax, az] = c.along, [px, pz] = c.at as Vec2;
  const crossing = new THREE.Group(); crossing.name = c.id; crossing.userData.evidence = c.evidence; crossing.userData.flushRouteSurface = true;
  const barWidth = c.span / c.bars;
  for (let i = 0; i < c.bars; i++) {
    const along = (i + .5) * barWidth - c.span / 2, x = px + ax * along, z = pz + az * along;
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(barWidth * .96, c.length), new THREE.MeshStandardMaterial({ color: i % 2 ? "#b0433d" : "#e9e6dd", roughness: .95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    bar.rotation.set(-Math.PI / 2, 0, Math.atan2(-az, ax)); bar.position.set(x, groundY(x, z) + .05, z); bar.receiveShadow = true; bar.name = c.id + "-bar"; crossing.add(bar);
  }
  group.add(crossing);
}

/** Leaves in a pot: a round glossy bush, or a few upright blades (IMG_2609, IMG_2631). */
function potPlant(kind: "round" | "spike", seed: number, r: number): THREE.Group {
  const rng = seeded(seed), f = new Foliage(rng), n = kind === "spike" ? 12 : 28;
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2, up = kind === "spike" ? 0.55 + rng() * 0.4 : 0.15 + rng() * 0.7;
    const dir = new THREE.Vector3(Math.cos(a) * (1 - up * 0.4), up, Math.sin(a) * (1 - up * 0.4)).normalize();
    const at = dir.clone().multiplyScalar(r * (kind === "spike" ? 0.7 : 0.45) * (0.4 + rng() * 0.7));
    f.leaf(kind === "spike" ? "narrow" : "glossy", at, dir, kind === "spike" ? [r * 1.3, r * 0.22] : [r * 0.7, r * 0.45], kind === "spike" ? "#6d8b58" : (i % 2 ? "#3f6a32" : "#5a8a40"));
  }
  return f.build("pot-plant");
}
