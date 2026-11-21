import * as THREE from "three";
import data from "../data/loira_boundary.json";
import { barrierRings } from "./boundaries";
import { plasterMaterial, surfaceTexture } from "./materials";
import { siteY } from "./terrain";
import type { Vec2 } from "./types";

type WallWindow = (typeof data.windows)[number];

export const loiraWall = { ...data, points: data.points as Vec2[] };
export const loiraWallRings = () => barrierRings([{ ...loiraWall, solid: true }]);

export function addLoiraBoundary(scene: THREE.Scene): void {
  const wall = new THREE.Group();
  wall.name = loiraWall.id;
  wall.userData.noDrape = true;
  wall.userData.structural = true;
  const plaster = plasterMaterial("#fffdf5");
  const { points, thickness, height, windows } = loiraWall;
  const iron = new THREE.MeshStandardMaterial({ color: "#302e2c", roughness: 0.68 });
  const tile = new THREE.MeshStandardMaterial({ map: surfaceTexture("paving"), color: "#ba8068", roughness: 0.88 });

  for (const [i, a] of points.slice(0, -1).entries()) {
    const b = points[i + 1], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / length, dz = (b[1] - a[1]) / length;
    const shape = new THREE.Shape();
    const start = i === 0 ? 0 : -thickness / 2;
    const end = i === points.length - 2 ? length : length + thickness / 2;
    shape.moveTo(start, -0.18);
    shape.lineTo(end, -0.18);
    shape.lineTo(end, height);
    const openings = windows.filter(window => window.segment === i).sort((a, b) => b.along - a.along);
    for (const window of openings) {
      const left = window.along - window.width / 2, right = window.along + window.width / 2;
      shape.lineTo(right + 0.22, height);
      shape.lineTo(right + 0.22, window.cap);
      shape.lineTo(left - 0.22, window.cap);
      shape.lineTo(left - 0.22, height);
      const opening = new THREE.Path();
      opening.moveTo(left, window.sill);
      opening.lineTo(left, window.spring);
      if (window.rise > 0) {
        opening.absellipse(window.along, window.spring, window.width / 2, window.rise, Math.PI, 0, true);
      } else {
        opening.lineTo(right, window.spring);
      }
      opening.lineTo(right, window.sill);
      opening.closePath();
      shape.holes.push(opening);
    }
    shape.lineTo(start, height);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 12 });
    const coords = geometry.getAttribute("position");
    for (let k = 0; k < coords.count; k++) {
      const s = coords.getX(k), across = coords.getZ(k) - thickness / 2;
      const x = a[0] + dx * s - dz * across, z = a[1] + dz * s + dx * across;
      coords.setXYZ(k, x, coords.getY(k) + siteY(a[0] + dx * s, a[1] + dz * s) + 0.06, z);
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, plaster);
    mesh.name = loiraWall.id;
    mesh.castShadow = mesh.receiveShadow = true;
    wall.add(mesh);
    for (const window of openings) {
      const x = a[0] + dx * window.along, z = a[1] + dz * window.along;
      const frame = windowFittings(window, thickness, iron, tile);
      frame.position.set(x, siteY(x, z) + 0.06, z);
      frame.rotation.y = -Math.atan2(dz, dx);
      wall.add(frame);
    }
  }
  scene.add(wall);
}

/** Fixed ironwork and terracotta sill at the photographed opening. */
function windowFittings(window: WallWindow, thickness: number, iron: THREE.Material, tile: THREE.Material): THREE.Group {
  const frame = new THREE.Group();
  frame.name = window.id + "-fittings";
  const add = (width: number, height: number, depth: number, x: number, y: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, 0);
    mesh.castShadow = mesh.receiveShadow = true;
    frame.add(mesh);
  };
  const halfWidth = window.width / 2;
  add(window.width, 0.034, thickness + 0.045, 0, window.sill + 0.013, tile);
  for (let i = -3; i <= 3; i++) {
    const x = i * window.width / 8;
    const top = window.spring + window.rise * Math.sqrt(1 - (x / halfWidth) ** 2);
    add(0.022, top - window.sill, 0.022, x, (top + window.sill) / 2, iron);
  }
  for (const fraction of [0.25, 0.70, 0.95]) {
    const y = window.sill + fraction * (window.spring - window.sill);
    add(window.width, 0.022, 0.025, 0, y, iron);
  }
  return frame;
}
