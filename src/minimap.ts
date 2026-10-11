import type { MapData } from "./types";

export type MapDot = { x: number; z: number; found: boolean };

export class Minimap {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly map: MapData,
  ) {}

  draw(x: number, z: number, yaw: number, dots: MapDot[]): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const size = this.canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#9fd0e2";
    ctx.fillRect(0, 0, size, size);

    const b = this.map.bounds;
    const pad = 14;
    const scale = Math.min((size - pad * 2) / (b.maxX - b.minX), (size - pad * 2) / (b.maxZ - b.minZ));
    const ox = (size - (b.maxX - b.minX) * scale) / 2;
    const oy = (size - (b.maxZ - b.minZ) * scale) / 2;
    const toScreen = (px: number, pz: number) => [ox + (px - b.minX) * scale, oy + (pz - b.minZ) * scale] as const;

    const land = [
      [b.minX, b.minZ],
      [b.maxX, b.minZ],
      this.map.coast[this.map.coast.length - 1],
      ...[...this.map.coast].reverse().slice(1),
    ];
    ctx.beginPath();
    land.forEach((p, i) => {
      const [sx, sy] = toScreen(p[0], p[1]);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.fillStyle = "#8fbe6c";
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 250, 242, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    for (const road of this.map.roads) {
      ctx.beginPath();
      road.points.forEach((p, i) => {
        const [sx, sy] = toScreen(p[0], p[1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    }

    ctx.fillStyle = "#2eb6d4";
    for (const pool of this.map.pools) {
      ctx.beginPath();
      pool.ring.forEach((p, i) => {
        const [sx, sy] = toScreen(p[0], p[1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.fill();
    }

    for (const dot of dots) {
      const [sx, sy] = toScreen(dot.x, dot.z);
      ctx.beginPath();
      ctx.arc(sx, sy, dot.found ? 3.2 : 4, 0, Math.PI * 2);
      ctx.fillStyle = dot.found ? "#c4542c" : "#f2c14d";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#1d2430";
      ctx.stroke();
    }

    const [px, py] = toScreen(x, z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(yaw);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5.5, 6);
    ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fillStyle = "#c4542c";
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#1d2430";
    ctx.font = "800 13px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", size / 2, 16);
    ctx.restore();
  }
}
