import { asset } from "./asset";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Painted sprites for plants. Each kind is a small picture drawn once onto a
 * canvas, then stood up in the world as two crossed flat cards.
 *
 * Palms, hedges, bougainvillea and Strelitzia use an original photo-referenced
 * atlas; the procedural painters remain immediate fallbacks and fill other kinds.
 */
export type SpriteKind =
  | "tree"
  | "feathery_tree"
  | "pollarded_tree"
  | "pine"
  | "palm"
  | "bird_of_paradise"
  | "yucca"
  | "hedge"
  | "hibiscus_hedge"
  | "bougainvillea"
  | "oleander"
  | "cactus"
  | "grass";

/** Width and height in metres, and whether the sprite throws a shadow. */
export const SPRITE_SIZE: Record<SpriteKind, { w: number; h: number; shadow: boolean }> = {
  tree: { w: 5.2, h: 6.2, shadow: true },
  feathery_tree: { w: 5.6, h: 5.4, shadow: true },
  pollarded_tree: { w: 2.6, h: 4.2, shadow: true },
  pine: { w: 6, h: 16, shadow: false },
  palm: { w: 5, h: 10, shadow: false },
  bird_of_paradise: { w: 3.4, h: 4.6, shadow: true },
  yucca: { w: 4.2, h: 4.8, shadow: true },
  hedge: { w: 1.7, h: 1.3, shadow: false },
  hibiscus_hedge: { w: 1.7, h: 1.3, shadow: false },
  bougainvillea: { w: 2.6, h: 2.6, shadow: false },
  oleander: { w: 1.6, h: 1.5, shadow: false },
  cactus: { w: 3.2, h: 4.6, shadow: true },
  grass: { w: 0.55, h: 0.34, shadow: false },
};

export type SpritePlacement = { x: number; y?: number; z: number; scale?: number };

/** Stand a set of sprites of one kind in the scene. */
export function addSprites(scene: THREE.Scene, kind: SpriteKind, places: SpritePlacement[]): void {
  if(scene.userData.layoutOnly)return;
  const guard=scene.userData.decorationClearance as ((x:number,z:number,radius:number)=>boolean)|undefined;
  if(guard)places=places.filter(p=>guard(p.x,p.z,SPRITE_SIZE[kind].w*(p.scale??1)/2));
  if (!places.length) return;
  const { w, h, shadow } = SPRITE_SIZE[kind];
  const card = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
  const geometry = mergeGeometries([card, card.clone().rotateY(Math.PI / 2)])!;
  const material = new THREE.MeshStandardMaterial({ map: paint(kind), alphaTest: 0.4, side: THREE.DoubleSide, roughness:0.9 });
  if(kind==="palm") {
    // Discard isolated red matte fringe from the generated alpha atlas.
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>","#include <map_fragment>\nif(diffuseColor.r>.7 && diffuseColor.g<.3 && diffuseColor.b<.3) discard;");};
    material.customProgramCacheKey=()=>"palm-alpha-fringe-v1";
  }
  if(kind in ATLAS_CELLS) atlasFor(kind).then(texture=>{if(texture){material.map=texture;material.needsUpdate=true;}});
  const mesh = new THREE.InstancedMesh(geometry, material, places.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  places.forEach((p, i) => {
    const s = p.scale ?? 1;
    q.setFromAxisAngle(up, rand(p.x * 3.3, p.z * 1.9) * Math.PI);
    m.compose(new THREE.Vector3(p.x, p.y ?? 0, p.z), q, new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
  });
  mesh.userData.spriteKind=kind;mesh.userData.spriteWidth=w;
  mesh.castShadow = shadow;
  scene.add(mesh);
}

function rand(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** One small shared atlas request; fallbacks remain visible until it arrives. */
const ATLAS_CELLS:Partial<Record<SpriteKind,[number,number,number,number]>>={
  palm:[0,.5,.5,.5],hedge:[.5,.5,.5,.3],bougainvillea:[0,0,.5,.5],bird_of_paradise:[.5,0,.5,.5],
};
let atlas:Promise<THREE.Texture|null>|undefined;
const atlasTextures=new Map<SpriteKind,THREE.Texture>();
async function atlasFor(kind:SpriteKind):Promise<THREE.Texture|null> {
  const existing=atlasTextures.get(kind);if(existing)return existing;
  atlas??=new THREE.TextureLoader().loadAsync(asset("/art/villacana-vegetation.png")).catch(()=>null);
  const source=await atlas,cell=ATLAS_CELLS[kind];if(!source||!cell)return null;
  const texture=source.clone();texture.colorSpace=THREE.SRGBColorSpace;texture.offset.set(cell[0],cell[1]);texture.repeat.set(cell[2],cell[3]);texture.anisotropy=4;texture.needsUpdate=true;atlasTextures.set(kind,texture);return texture;
}

const cache = new Map<SpriteKind, THREE.CanvasTexture>();

function paint(kind: SpriteKind): THREE.CanvasTexture {
  const cached = cache.get(kind);
  if (cached) return cached;
  const { w, h } = SPRITE_SIZE[kind];
  const c = document.createElement("canvas");
  const px = 256 / Math.max(w, h);
  c.width = Math.max(32, Math.round(w * px));
  c.height = Math.max(32, Math.round(h * px));
  const g = c.getContext("2d")!;
  // Painters work in a unit box: x across 0..1, y up 0..1 from the ground.
  g.translate(0, c.height);
  g.scale(c.width, -c.height);
  PAINTERS[kind](new Brush(g, kind.length * 7.3, c.width / c.height));
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(kind, texture);
  return texture;
}

/** A few painterly strokes with a repeatable random wobble. */
class Brush {
  private seed: number;

  constructor(
    readonly g: CanvasRenderingContext2D,
    seed: number,
    /** Width over height of the picture, to keep blobs round. */
    readonly aspect: number,
  ) {
    this.seed = seed;
  }

  next(): number {
    this.seed += 1;
    return rand(this.seed, this.seed * 0.37);
  }

  /** A clump of leaves: dark underneath, lighter towards the top, as if lit from above. */
  foliage(cx: number, cy: number, rx: number, ry: number, dark: string, mid: string, light: string, dabs = 60): void {
    const g = this.g;
    for (const [colour, lift, share] of [[dark, -0.12, 1], [mid, 0.04, 0.8], [light, 0.2, 0.45]] as const) {
      g.fillStyle = colour;
      for (let i = 0; i < dabs * share * 6; i++) {
        const a = this.next() * Math.PI * 2;
        const d = Math.sqrt(this.next()) * (share === 1 ? 1 : 0.82);
        const r = (0.045 + this.next() * 0.075) * (share === 1 ? 1 : 0.8);
        g.beginPath();
        g.ellipse(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry + lift * ry, r * rx, r * rx * this.aspect * 0.55, this.next()*Math.PI, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  /** A trunk or stem from one point to another, tapering. */
  stem(x0: number, y0: number, x1: number, y1: number, width: number, colour: string): void {
    const g = this.g;
    g.strokeStyle = colour;
    g.lineCap = "round";
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2 + (this.next() - 0.5) * 0.08, (y0 + y1) / 2, x1, y1);
    g.stroke();
  }

  /** A long leaf from a base point, at an angle from straight up. */
  leaf(x: number, y: number, angle: number, length: number, width: number, colour: string): void {
    const g = this.g;
    g.save();
    g.translate(x, y);
    g.scale(1, this.aspect);
    g.rotate(-angle);
    g.fillStyle = colour;
    g.beginPath();
    g.ellipse(0, length / 2, width / 2, length / 2, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  dots(cx: number, cy: number, rx: number, ry: number, count: number, size: number, colours: string[]): void {
    const g = this.g;
    for (let i = 0; i < count; i++) {
      const a = this.next() * Math.PI * 2;
      const d = Math.sqrt(this.next());
      g.fillStyle = colours[Math.floor(this.next() * colours.length)];
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, size, size * this.aspect, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
}

const TRUNK = "#6b4a33";

const PAINTERS: Record<SpriteKind, (b: Brush) => void> = {
  tree(b) {
    b.stem(0.5, 0, 0.5, 0.5, 0.06, TRUNK);
    b.stem(0.5, 0.4, 0.36, 0.6, 0.035, TRUNK);
    b.stem(0.5, 0.42, 0.64, 0.62, 0.035, TRUNK);
    b.foliage(0.5, 0.68, 0.4, 0.26, "#2c5f37", "#3f7d45", "#63a05a", 90);
  },
  feathery_tree(b) {
    b.stem(0.48, 0, 0.5, 0.55, 0.045, "#7a5a40");
    b.stem(0.5, 0.45, 0.3, 0.68, 0.025, "#7a5a40");
    b.stem(0.5, 0.45, 0.72, 0.7, 0.025, "#7a5a40");
    b.foliage(0.5, 0.74, 0.44, 0.2, "#4d7d3a", "#7aa648", "#b3c95e", 110);
  },
  pollarded_tree(b) {
    b.stem(0.5, 0, 0.48, 0.62, 0.12, "#5a4636");
    b.stem(0.48, 0.55, 0.3, 0.74, 0.08, "#5a4636");
    b.stem(0.48, 0.55, 0.68, 0.76, 0.08, "#5a4636");
    for (const [x, y] of [[0.28, 0.8], [0.5, 0.72], [0.7, 0.82]]) b.foliage(x, y, 0.16, 0.1, "#3c6b3a", "#5c8f47", "#86b35a", 26);
  },
  pine(b) {
    b.stem(0.5, 0, 0.5, 0.9, 0.05, "#4a382c");
    for (let i = 0; i < 9; i++) {
      const y = 0.3 + i * 0.075;
      const half = 0.42 * (1 - i / 11);
      b.foliage(0.5, y, half, 0.06, "#16321f", "#234a2c", "#2f5f37", 34);
    }
  },
  palm(b) {
    b.stem(0.5, 0, 0.52, 0.78, 0.05, "#7b6248");
    for (let i = 0; i < 11; i++) {
      const a = -1.5 + (i / 10) * 3;
      b.leaf(0.52, 0.76, a, 0.44, 0.07, i % 2 ? "#3f7d45" : "#2f6b3a");
    }
  },
  bird_of_paradise(b) {
    for (let i = 0; i < 7; i++) {
      const a = -0.75 + (i / 6) * 1.5 + (b.next() - 0.5) * 0.15;
      const top = 0.42 + b.next() * 0.18;
      const x = 0.5 + Math.sin(a) * top * 0.5;
      const y = Math.cos(a) * top;
      b.stem(0.5, 0, x, y, 0.035, "#5d7d3a");
      b.leaf(x, y - 0.03, a * 1.15, 0.42, 0.2, i % 2 ? "#3c8a48" : "#2f7340");
      b.leaf(x, y - 0.02, a * 1.15, 0.36, 0.07, "#62a85a");
    }
  },
  yucca(b) {
    b.stem(0.5, 0, 0.46, 0.4, 0.07, "#6b5540");
    b.stem(0.46, 0.35, 0.28, 0.6, 0.05, "#6b5540");
    b.stem(0.46, 0.35, 0.7, 0.64, 0.05, "#6b5540");
    for (const [x, y] of [[0.26, 0.62], [0.47, 0.5], [0.72, 0.66]]) {
      for (let i = 0; i < 26; i++) {
        const a = -2.2 + b.next() * 4.4;
        b.leaf(x, y, a, 0.24 + b.next() * 0.1, 0.025, i % 3 ? "#3f6f3d" : "#6b9a4f");
      }
    }
  },
  hedge(b) {
    b.foliage(0.5, 0.42, 0.44, 0.36, "#234f2c", "#2f6b3a", "#4f8f4a", 80);
  },
  hibiscus_hedge(b) {
    b.foliage(0.5, 0.42, 0.44, 0.36, "#27562f", "#357a3d", "#5a9a4c", 80);
    b.dots(0.5, 0.48, 0.36, 0.28, 9, 0.035, ["#e8508c", "#d83a3a", "#f08fb4"]);
  },
  bougainvillea(b) {
    b.foliage(0.5, 0.45, 0.42, 0.4, "#2f5f37", "#3f7d45", "#5c9a4f", 40);
    b.dots(0.5, 0.5, 0.42, 0.4, 150, 0.04, ["#c81f7a", "#e23c93", "#a8186a", "#ee6cb0"]);
  },
  oleander(b) {
    // Upright stems, each a spray of narrow pointed leaves.
    for (let i = 0; i < 9; i++) {
      const x = 0.15 + b.next() * 0.7;
      const top = 0.55 + b.next() * 0.35;
      b.stem(x, 0, x + (b.next() - 0.5) * 0.1, top, 0.02, "#6f8a45");
      for (let k = 0; k < 14; k++) {
        const y = top * (0.25 + b.next() * 0.75);
        b.leaf(x, y, (b.next() - 0.5) * 2.4, 0.2, 0.03, k % 3 ? "#4f8a4a" : "#7fae5c");
      }
    }
  },
  cactus(b) {
    // Many upright arms rising from one base.
    for (let i = 0; i < 11; i++) {
      const x = 0.5 + (i - 5) * 0.075;
      const top = 0.95 - Math.abs(i - 5) * 0.07 - b.next() * 0.08;
      b.stem(0.5 + (i - 5) * 0.03, 0.05, x, top, 0.075, i % 2 ? "#5d8f5a" : "#4a7a4c");
    }
  },
  grass(b) {
    for (let i = 0; i < 9; i++) {
      const x = 0.15 + b.next() * 0.7;
      const lean = (b.next() - 0.5) * 0.5;
      b.stem(x, 0, x + lean, 0.55 + b.next() * 0.4, 0.07, i % 3 ? "#5c9a4f" : "#86b85a");
    }
  },
};
