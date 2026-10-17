import * as THREE from "three";
import data from "../data/north_pool_gardens.json";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

/** Only the visible ground-level arc is traced; its unknown continuation stays open. */
export const northPoolGardenPath = data;
export function crazyPavingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#8e887b"; g.fillRect(0, 0, 512, 512);
  const noise = (n: number) => { const a = Math.sin(n * 127.1) * 43758.5; return a - Math.floor(a); };
  const points = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => [c * 80 - 60 + noise(r * 9 + c) * 28, r * 80 - 60 + noise(r * 9 + c + 90) * 28]));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = [points[r][c], points[r][c + 1], points[r + 1][c + 1], points[r + 1][c]];
    const polygons = (r + c) % 3 ? [p] : [[p[0], p[1], p[2]], [p[0], p[2], p[3]]];
    for (const stone of polygons) {
      const v = 164 + noise(r * 8 + c) * 36;
      g.fillStyle = `rgb(${v + 14},${v + 5},${v - 12})`; g.strokeStyle = "#8e887b"; g.lineWidth = 4;
      g.beginPath(); stone.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.setScalar(.65);
  return texture;
}

export function addNorthPoolGardenPath(scene: THREE.Scene): void {
  const ring = data.ring as Vec2[];
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geometry = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute("position"), uv = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, siteY(x, z) + .073); uv.setXY(i, x, z);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: crazyPavingTexture(), color: "#d8cfb9", roughness: 1 }));
  mesh.name = data.id; mesh.userData.noDrape = true; mesh.userData.referenceSurface = true; mesh.receiveShadow = true; scene.add(mesh);
}

export function northPoolGardenPathBlueprint(): { id: string; points: Vec2[]; closed: boolean; fill?: string; stroke?: string; width?: number; dash?: string; title: string } {
  return { id: data.id, points: data.ring as Vec2[], closed: true, fill: "#c8bfa9", title: `${data.name}: ${data.trust} · ${data.evidence.join(", ")}` };
}
