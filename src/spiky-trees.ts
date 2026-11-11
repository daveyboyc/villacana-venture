import * as THREE from "three";
import { seeded } from "./clipped-plants";

/** Leaf blades collected into one mesh with a colour per vertex. */
class Blades {
  private pos: number[] = [];
  private col: number[] = [];
  private idx: number[] = [];
  /** A tapered strip from `base` along `dir`, widest a fifth of the way out, bending down towards its tip. */
  add(base: THREE.Vector3, dir: THREE.Vector3, length: number, width: number, droop: number, colour: THREE.Color): void {
    const d = dir.clone().normalize(), side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0));
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const n = 4, start = this.pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = (width / 2) * (t < 0.2 ? 0.55 + 2.25 * t : (1 - t) / 0.8);
      const p = base.clone().addScaledVector(d, length * t); p.y -= droop * length * t * t;
      const shade = 0.85 + 0.3 * t;
      for (const s of [-1, 1]) { this.pos.push(p.x + side.x * w * s, p.y + side.y * w * s, p.z + side.z * w * s); this.col.push(colour.r * shade, colour.g * shade, colour.b * shade); }
      if (i) { const a = start + (i - 1) * 2; this.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  mesh(name: string): THREE.Mesh {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 }));
    m.name = name; m.castShadow = m.receiveShadow = true;
    return m;
  }
}

/** A tapered limb between two points. */
function limb(from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, material: THREE.Material): THREE.Mesh {
  const l = from.distanceTo(to), m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, l, 10), material);
  m.position.copy(from).add(to).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  m.castShadow = true;
  return m;
}

/**
 * The dragon tree on the Calle Jorge kerb corner (IMG_2230, IMG_2594) and the spiky clump in the Guillermo planter
 * (IMG_2773): a stout grey trunk that forks into several limbs, each ending in a dense ball of stiff sword leaves.
 * `fork` is how far up the trunk divides, as a share of the height.
 */
export function dragonTree(o: { height: number; heads: number; seed: number; fork?: number; leaf?: number }): THREE.Group {
  const rng = seeded(o.seed), g = new THREE.Group(), blades = new Blades();
  const bark = new THREE.MeshStandardMaterial({ color: "#6f685b", roughness: 0.95 });
  const forkY = o.height * (o.fork ?? 0.42), leaf = o.leaf ?? 0.78, girth = 0.068 * o.height;
  const fork = new THREE.Vector3((rng() - 0.5) * 0.2, forkY, (rng() - 0.5) * 0.2);
  g.add(limb(new THREE.Vector3(0, -0.2, 0), fork, girth, girth * 0.8, bark));
  const greens = ["#3f5d33", "#4c6c3a", "#5a7b43", "#46653a"].map((c) => new THREE.Color(c)), old = new THREE.Color("#8a8250");
  for (let i = 0; i < o.heads; i++) {
    const a = i * 2.399 + rng() * 0.5, tilt = o.heads === 1 ? 0 : 0.3 + (i / o.heads) * 0.55 + rng() * 0.12;
    const reach = (o.height - forkY - leaf * 0.55) * (0.82 + rng() * 0.3);
    const head = fork.clone().add(new THREE.Vector3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a)).multiplyScalar(reach));
    // The limb sweeps out and then up, in two straight pieces.
    const elbow = fork.clone().lerp(head, 0.55); elbow.y -= reach * 0.1;
    g.add(limb(fork, elbow, girth * 0.62, girth * 0.5, bark), limb(elbow, head, girth * 0.5, girth * 0.42, bark));
    for (let k = 0; k < 90; k++) {
      // Leaves point every way from the head, most of them upwards and outwards; the lowest are older and hang.
      const az = rng() * Math.PI * 2, el = -0.7 + rng() ** 0.75 * 2.2, low = el < -0.1;
      const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
      blades.add(head, dir, leaf * (0.75 + rng() * 0.35), 0.1, low ? 0.35 : 0.12, low && rng() < 0.5 ? old : greens[Math.floor(rng() * greens.length)]);
    }
  }
  g.add(blades.mesh("dragon-tree-leaves"));
  g.name = "dragon-tree";
  return g;
}

/**
 * The tall slender palms on the main-pool lawn (IMG_2764, IMG_2765): a thin, slightly leaning trunk three or four
 * times the height of the crown, and a compact head of arching feather fronds with a few brown ones hanging below.
 */
export function tallPalm(o: { height: number; seed: number }): THREE.Group {
  const rng = seeded(o.seed), g = new THREE.Group(), blades = new Blades();
  const bark = new THREE.MeshStandardMaterial({ color: "#8a7a63", roughness: 0.95 });
  const lean = new THREE.Vector3((rng() - 0.5) * 0.9, 0, (rng() - 0.5) * 0.9), top = o.height - 1.6, pieces = 7;
  const at = (t: number) => new THREE.Vector3(lean.x * t * t, top * t - 0.3, lean.z * t * t);
  for (let i = 0; i < pieces; i++) {
    const t0 = i / pieces, t1 = (i + 1) / pieces, r = (t: number) => 0.27 - 0.07 * t + (t < 0.08 ? 0.07 : 0) + (t > 0.9 ? 0.08 : 0);
    g.add(limb(at(t0), at(t1), r(t0), r(t1), bark));
  }
  const crown = at(1), fresh = ["#47692f", "#557a37", "#3f602b"].map((c) => new THREE.Color(c)), dead = new THREE.Color("#8c7449");
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 8), new THREE.MeshStandardMaterial({ color: "#6f6247", roughness: 1 }));
  boss.position.copy(crown); boss.scale.y = 1.3; boss.castShadow = true; g.add(boss);
  for (let i = 0; i < 64; i++) {
    const hanging = i >= 54, az = i * 2.399 + rng() * 0.4;
    // Young fronds stand up, older ones arch out and down; the last few are dead and hang against the trunk.
    let el = hanging ? -0.9 - rng() * 0.4 : 1.3 - (i / 54) * 1.75 + (rng() - 0.5) * 0.2;
    const length = hanging ? 2.6 : 3.4 + rng() * 0.8, arch = hanging ? 0.5 : 1.0 + rng() * 0.5, steps = 13;
    const p = crown.clone(), colour = hanging ? dead : fresh[Math.floor(rng() * fresh.length)];
    const flat = new THREE.Vector3(Math.cos(az), 0, Math.sin(az)), across = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az));
    for (let k = 0; k < steps; k++) {
      const t = k / steps, dir = flat.clone().multiplyScalar(Math.cos(el)).setY(Math.sin(el));
      blades.add(p, dir, (length / steps) * 1.15, 0.05, 0, colour);
      const leaflet = (0.18 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.6) * (hanging ? 0.7 : 1);
      for (const s of [-1, 1]) blades.add(p, across.clone().multiplyScalar(s).addScaledVector(dir, 0.45).setY(dir.y * 0.45 - 0.3), leaflet, 0.09, 0.3, colour);
      p.addScaledVector(dir, length / steps); el -= arch / steps;
    }
  }
  g.add(blades.mesh("tall-palm-fronds"));
  g.name = "tall-palm";
  return g;
}
