import * as THREE from "three";

/** The north pool's crazy paving, for the ground plan's crazy-paving finish (src/ground-plan.ts) and the raised terraces. */
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
