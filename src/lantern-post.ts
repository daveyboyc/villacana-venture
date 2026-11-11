import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The resort's traditional lantern post, as in IMG_2552, IMG_2336, IMG_2597 and IMG_2503: a bottle-green
 * tapered steel post with a thicker base sleeve on a bolted square plate; a collar and ball under four
 * curved cradle arms; a four-sided black lantern, taller than wide and wider at the top, with frosted
 * glass and a pale lamp inside; and a weathered straight-sided pyramid roof with a vent cap and finial.
 * One set of geometry and materials is shared by every post. Local frame: y up, standing on y = 0.
 * An original model of the fitting, built from numbers; no photo pixels are used.
 */
export const LANTERN_HEIGHT = 3.82;
/** Half-width of the roof, the widest part: the footprint a route guard should keep clear. */
export const LANTERN_RADIUS = 0.22;

const POST_TOP = 2.93, BODY = [3.01, 3.47] as const, HALF = [0.092, 0.168] as const, BAR = 0.016;

function texture(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void, repeat = false): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const noise = (n: number) => { const x = Math.sin(n * 127.1 + 11.7) * 43758.5453; return x - Math.floor(x); };

/** Painted steel: an even coat with faint runs, dust and a few chips, lighter towards the foot. */
function paintTexture(): THREE.CanvasTexture {
  return texture(128, 512, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 90; i++) {
      const x = noise(i) * 128, y = noise(i + 50) * 512, len = 30 + noise(i + 90) * 160;
      g.strokeStyle = `rgba(${noise(i + 7) > 0.5 ? "255,255,255" : "0,0,0"},${0.03 + noise(i + 3) * 0.05})`; g.lineWidth = 1 + noise(i + 5) * 3;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (noise(i + 9) - 0.5) * 4, y + len); g.stroke();
    }
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(190,196,180,${0.03 + noise(i * 3.1) * 0.07})`; g.fillRect(noise(i * 1.7) * 128, noise(i * 2.3) * 512, 1 + noise(i) * 2, 1 + noise(i + 1) * 2); }
    const dust = g.createLinearGradient(0, 512, 0, 380); dust.addColorStop(0, "rgba(170,165,140,0.35)"); dust.addColorStop(1, "rgba(170,165,140,0)");
    g.fillStyle = dust; g.fillRect(0, 380, 128, 132);
  }, true);
}
/** The roof's weathered black paint: chalky grey bloom and streaks running down the slope. */
function roofTexture(): THREE.CanvasTexture {
  return texture(256, 256, (g) => {
    g.fillStyle = "#2a2e30"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) {
      const x = noise(i * 1.3) * 256, y = noise(i * 2.9) * 256, r = 10 + noise(i * 4.1) * 38;
      const blot = g.createRadialGradient(x, y, 0, x, y, r); const a = 0.07 + noise(i * 5.7) * 0.16;
      blot.addColorStop(0, `rgba(${noise(i) > 0.35 ? "128,132,130" : "12,14,15"},${a})`); blot.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = blot; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 14; i++) {
      const x = noise(i * 7.7) * 256;
      g.strokeStyle = `rgba(170,174,168,${0.03 + noise(i * 3.3) * 0.06})`; g.lineWidth = 3 + noise(i) * 9;
      g.beginPath(); g.moveTo(x, noise(i * 9.1) * 120); g.lineTo(x + (noise(i * 2.1) - 0.5) * 8, 256); g.stroke();
    }
  });
}
/** Lantern glass: clear at the top, clouded with dust and water marks lower down and at the edges. */
function glassTexture(): THREE.CanvasTexture {
  return texture(128, 256, (g) => {
    g.clearRect(0, 0, 128, 256);
    const haze = g.createLinearGradient(0, 0, 0, 256); haze.addColorStop(0, "rgba(232,236,230,0.42)"); haze.addColorStop(0.5, "rgba(232,234,226,0.58)"); haze.addColorStop(1, "rgba(222,222,208,0.8)");
    g.fillStyle = haze; g.fillRect(0, 0, 128, 256);
    for (const x of [0, 128]) { const edge = g.createLinearGradient(x, 0, x === 0 ? 26 : 102, 0); edge.addColorStop(0, "rgba(205,208,198,0.55)"); edge.addColorStop(1, "rgba(200,204,196,0)"); g.fillStyle = edge; g.fillRect(x === 0 ? 0 : 102, 0, 26, 256); }
    for (let i = 0; i < 26; i++) {
      const x = noise(i * 3.7) * 128, y = 40 + noise(i * 5.3) * 120;
      g.strokeStyle = `rgba(240,242,236,${0.06 + noise(i * 1.9) * 0.1})`; g.lineWidth = 1 + noise(i * 2.3) * 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (noise(i) - 0.5) * 5, y + 30 + noise(i * 6.1) * 80); g.stroke();
    }
  });
}

/** A box from a to b: a bar of square section `size`. */
function bar(a: THREE.Vector3, b: THREE.Vector3, size: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(size, a.distanceTo(b), size);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}
/** Four flat sides lofted through square sections [half-width, y]: smooth up the profile, crisp at the corners. */
function squareLoft(profile: [number, number][]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], n = profile.length;
  const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < 4; k++) {
    const turn = (k * Math.PI) / 2;
    const corner = (i: number, side: number) => {
      const [h, y] = profile[i], a = profile[Math.max(0, i - 1)], b = profile[Math.min(n - 1, i + 1)];
      const p = v.set(side * h, y, h).applyAxisAngle(up, turn).toArray();
      const normal = new THREE.Vector3(0, -(b[0] - a[0]), b[1] - a[1]).normalize().applyAxisAngle(up, turn).toArray();
      return { p, normal, uv: [(side + 1) / 2, i / (n - 1)] };
    };
    for (let i = 0; i < n - 1; i++) {
      const a0 = corner(i, -1), b0 = corner(i, 1), a1 = corner(i + 1, -1), b1 = corner(i + 1, 1);
      for (const c of [a0, b0, b1, a0, b1, a1]) { pos.push(...c.p); nor.push(...c.normal); uv.push(...c.uv); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const lathe = (points: [number, number][], segments = 28) => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
const merge = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;

type Kit = { parts: [THREE.BufferGeometry, THREE.Material, string][] };
let kit: Kit | undefined;

function build(): Kit {
  // ---- Painted steel: base plate and bolts, sleeve, tapered post, collar, ball, hub and the four cradle arms.
  const steel: THREE.BufferGeometry[] = [new THREE.BoxGeometry(0.24, 0.012, 0.24).translate(0, 0.006, 0)];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    steel.push(new THREE.CylinderGeometry(0.007, 0.007, 0.045, 8).translate(sx * 0.092, 0.03, sz * 0.092));
    steel.push(new THREE.CylinderGeometry(0.016, 0.016, 0.013, 6).translate(sx * 0.092, 0.019, sz * 0.092));
  }
  steel.push(lathe([
    [0, 0.012], [0.074, 0.012], [0.074, 0.026], [0.06, 0.04], [0.057, 0.05], [0.056, 0.52], [0.061, 0.528], [0.061, 0.552], [0.05, 0.566], [0.046, 0.58],
    [0.043, 1.2], [0.038, 2.0], [0.032, 2.64], [0.039, 2.652], [0.045, 2.672], [0.039, 2.692], [0.03, 2.702], [0.026, 2.73],
    [0.034, 2.745], [0.047, 2.762], [0.053, 2.785], [0.047, 2.808], [0.034, 2.825], [0.022, 2.838], [0.019, 2.87], [0.03, 2.882], [0.03, 2.905], [0.016, 2.915], [0.014, POST_TOP + 0.08], [0, POST_TOP + 0.08],
  ]));
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2, out = (r: number, y: number) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    // Each arm leaves the hub, bows outward and turns up under a corner of the lantern.
    const arm = new THREE.CatmullRomCurve3([out(0.02, 2.875), out(0.085, 2.868), out(0.132, 2.905), out(0.128, 2.965), out(HALF[0] * Math.SQRT2 * 0.92, BODY[0])]);
    steel.push(new THREE.TubeGeometry(arm, 20, 0.0075, 8));
    steel.push(new THREE.SphereGeometry(0.013, 10, 8).translate(...out(0.135, 2.93).toArray()));
  }
  // ---- Black lantern frame: floor plate, slanted corner bars, bottom and top rails, lamp holder.
  const frame: THREE.BufferGeometry[] = [new THREE.BoxGeometry(HALF[0] * 2 + BAR, 0.014, HALF[0] * 2 + BAR).translate(0, BODY[0] - 0.007, 0)];
  for (let k = 0; k < 4; k++) {
    const turn = (k * Math.PI) / 2, up = new THREE.Vector3(0, 1, 0), at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyAxisAngle(up, turn);
    frame.push(bar(at(HALF[0], BODY[0], HALF[0]), at(HALF[1], BODY[1], HALF[1]), BAR));
    frame.push(bar(at(-HALF[0], BODY[0] + 0.008, HALF[0]), at(HALF[0], BODY[0] + 0.008, HALF[0]), BAR));
    frame.push(bar(at(-HALF[1] - BAR / 2, BODY[1], HALF[1]), at(HALF[1] + BAR / 2, BODY[1], HALF[1]), BAR * 1.25));
  }
  frame.push(new THREE.CylinderGeometry(0.026, 0.032, 0.06, 16).translate(0, BODY[0] + 0.03, 0));
  // ---- Glass: four panes just inside the bars.
  const glass: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const pane = new THREE.BufferGeometry(), i = 0.006, [hb, ht] = [HALF[0] - i, HALF[1] - i];
    pane.setAttribute("position", new THREE.Float32BufferAttribute([-hb, BODY[0] + 0.012, hb, hb, BODY[0] + 0.012, hb, ht, BODY[1] - 0.008, ht, -hb, BODY[0] + 0.012, hb, ht, BODY[1] - 0.008, ht, -ht, BODY[1] - 0.008, ht], 3));
    pane.setAttribute("uv", new THREE.Float32BufferAttribute([0.24, 0, 0.76, 0, 1, 1, 0.24, 0, 1, 1, 0, 1], 2));
    pane.computeVertexNormals(); glass.push(pane.rotateY((k * Math.PI) / 2));
  }
  // ---- The lamp: a pale tube with a rounded end, on its holder.
  const bulb = new THREE.CapsuleGeometry(0.032, 0.16, 6, 16).translate(0, BODY[0] + 0.19, 0);
  // ---- Roof: underside plate, flared square canopy with a drip edge, vent, cap and finial.
  const y0 = BODY[1] + 0.012;
  const roof: THREE.BufferGeometry[] = [
    new THREE.BoxGeometry(0.39, 0.012, 0.39).translate(0, y0 - 0.006, 0),
    // A cornice band, then straight sloping sides to a flat top: steeper than a pagoda, with a small overhang.
    squareLoft([[0.196, y0 - 0.014], [0.204, y0 - 0.008], [0.204, y0 + 0.012], [0.196, y0 + 0.022], [0.176, y0 + 0.05], [0.118, y0 + 0.19], [0.108, y0 + 0.212], [0.1, y0 + 0.218]]),
    new THREE.BoxGeometry(0.2, 0.01, 0.2).translate(0, y0 + 0.216, 0),
    // Vent chimney, its wider cap and the finial.
    lathe([[0, y0 + 0.21], [0.058, y0 + 0.21], [0.058, y0 + 0.262], [0.05, y0 + 0.268], [0.05, y0 + 0.28], [0.08, y0 + 0.284], [0.083, y0 + 0.294], [0.07, y0 + 0.306], [0.036, y0 + 0.322], [0.016, y0 + 0.33], [0.013, y0 + 0.338], [0.021, y0 + 0.343], [0.023, y0 + 0.351], [0.012, y0 + 0.358], [0, y0 + 0.362]], 24),
  ];
  const steelMat = new THREE.MeshStandardMaterial({ color: "#27473a", map: paintTexture(), roughness: 0.46, metalness: 0.55 });
  const frameMat = new THREE.MeshStandardMaterial({ color: "#16191a", roughness: 0.5, metalness: 0.55 });
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), roughness: 0.82, metalness: 0.25 });
  const glassMat = new THREE.MeshStandardMaterial({ color: "#f2f5f1", map: glassTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.06, metalness: 0, envMapIntensity: 1.6 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: "#efe8cf", roughness: 0.4, emissive: "#ffe9b0", emissiveIntensity: 0.16 });
  return { parts: [[merge(steel), steelMat, "post"], [merge(frame), frameMat, "frame"], [merge(roof), roofMat, "roof"], [bulb, bulbMat, "lamp"], [merge(glass), glassMat, "glass"]] };
}

export type LanternPostOptions = { height?: number; name?: string };
/** One lantern post, `height` metres to the finial (default 3.5 m). */
export function lanternPost(o: LanternPostOptions = {}): THREE.Group {
  kit ??= build();
  const g = new THREE.Group(); g.name = o.name ?? "lantern-post";
  for (const [geometry, material, part] of kit.parts) {
    const m = new THREE.Mesh(geometry, material); m.name = `${g.name}-${part}`;
    m.castShadow = part !== "glass" && part !== "lamp"; m.receiveShadow = part !== "glass";
    if (part === "glass") m.renderOrder = 3;
    g.add(m);
  }
  g.scale.setScalar((o.height ?? 3.5) / LANTERN_HEIGHT);
  g.userData.lanternPost = true;
  return g;
}
