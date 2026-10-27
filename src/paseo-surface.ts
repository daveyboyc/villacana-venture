import * as THREE from "three";

/** Original procedural drawing of the shallow board stamp in IMG_2351/2481–83.
 * No source pixels. Estimated 0.2 m course pitch; never displaced geometry.
 * One 3 m repeat supplies both metric axes of the existing paseo ribbon.
 */
export function paseoSurfaceMaterial(): THREE.MeshStandardMaterial {
  const size = 1024, canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  let seed = 2483;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = "#c28b7e"; g.fillRect(0, 0, size, size);
  const rows = 15, pitch = size / rows;
  // Fine grain runs across the walk. Courses do not reset at geometry segments.
  for (let row = 0; row < rows; row++) {
    const y = row * pitch, tone = Math.floor(random() * 16) - 8;
    g.fillStyle = `rgb(${190 + tone},${133 + tone},${120 + tone})`;
    g.fillRect(0, y, size, pitch);
    for (let j = 0; j < 100; j++) {
      const x = random() * size, yy = y + random() * pitch;
      g.strokeStyle = j % 3 ? "rgba(91,66,57,.075)" : "rgba(242,215,193,.16)";
      g.lineWidth = .4 + random() * 1.4;
      g.beginPath(); g.moveTo(x, yy);
      g.bezierCurveTo(x + 20, yy - 2, x + 60, yy + 2, x + 25 + random() * 170, yy);
      g.stroke();
    }
    // Shallow mould lines rather than dark tile grout or raised planks.
    g.fillStyle = "rgba(84,60,52,.18)"; g.fillRect(0, y, size, 1.4);
    g.fillStyle = "rgba(245,218,198,.23)"; g.fillRect(0, y + 1.4, size, 1);
    const joint = ((row * 7) % 15 + .5) * size / 15;
    g.fillStyle = "rgba(84,60,52,.22)"; g.fillRect(joint, y, 1.5, pitch);
  }
  // Dust/wear has soft, low contrast edges. Wrap marks at tile boundaries.
  for (let i = 0; i < 90; i++) {
    const x = random() * size, y = random() * size, radius = 12 + random() * 65;
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      const fade = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, radius);
      fade.addColorStop(0, i % 3 ? "rgba(231,205,181,.12)" : "rgba(75,62,52,.08)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = fade; g.fillRect(x + dx - radius, y + dy - radius, radius * 2, radius * 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: .95, side: THREE.DoubleSide });
  material.name = "paseo-weathered-stamped-concrete";
  return material;
}
