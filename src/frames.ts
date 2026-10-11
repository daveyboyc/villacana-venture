import * as THREE from "three";
import { nearestStreet, project, rotationYFromYaw, yawFromDirection, type CoastField } from "./geom";
import type { AlbumEntry, MapData } from "./types";
import { asset } from "./asset";

export type Frame = {
  entry: AlbumEntry;
  x: number;
  z: number;
  group: THREE.Group;
  badge: THREE.Object3D;
  found: boolean;
};

export async function createFrames(scene: THREE.Scene, map: MapData, coast: CoastField): Promise<Frame[]> {
  const response = await fetch(asset("/photos/album.json"));
  if (!response.ok) throw new Error("The photo album did not load.");
  const album = (await response.json()) as AlbumEntry[];
  const frames: Frame[] = [];
  for (const entry of album) {
    const spot = settle(entry, map, coast);
    const group = new THREE.Group();
    group.position.set(spot.x, 0, spot.z);
    if (spot.yaw != null) group.rotation.y = rotationYFromYaw(spot.yaw);

    const wood = new THREE.MeshStandardMaterial({ color: "#8a5a38", roughness: 0.8 });
    const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.55, 6);
    const left = new THREE.Mesh(postGeo, wood);
    const right = new THREE.Mesh(postGeo, wood);
    left.position.set(-0.72, 0.78, 0);
    right.position.set(0.72, 0.78, 0);
    left.castShadow = true;
    right.castShadow = true;

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 1.16, 0.06),
      new THREE.MeshStandardMaterial({ color: "#f6f0e4", roughness: 0.7 }),
    );
    board.position.set(0, 1.72, 0);
    board.castShadow = true;

    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: "#f6f0e4", roughness: 0.6 }),
    );
    photo.position.set(0, 1.76, 0.04);
    photo.scale.set(1.36, 1.0, 1);
    group.add(left, right, board, photo);

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.38),
      new THREE.MeshStandardMaterial({ map: labelTexture(entry.title), transparent: true, roughness: 0.7 }),
    );
    plate.position.set(0, 1.05, 0.05);
    group.add(plate);

    const badge = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({ color: "#f2c14d", emissive: "#a07820", emissiveIntensity: 0.25, roughness: 0.4 }),
    );
    badge.position.set(0, 2.5, 0);
    badge.visible = false;
    group.add(badge);

    if (entry.image) {
      const texture = await loadTexture(entry.image);
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = photo.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.color.set("#ffffff");
        material.needsUpdate = true;
        const image = texture.image as HTMLImageElement;
        if (image?.width && image.height) {
          const aspect = image.width / image.height;
          let w = 1.02 * aspect;
          let h = 1.02;
          if (w > 1.5) {
            h *= 1.5 / w;
            w = 1.5;
          }
          photo.scale.set(w, h, 1);
          board.scale.set(Math.max(1, (w + 0.16) / 1.62), Math.max(1, (h + 0.16) / 1.16), 1);
        }
      } else {
        applyPlaceholder(photo, entry.title);
      }
    } else {
      applyPlaceholder(photo, entry.title);
    }

    scene.add(group);
    frames.push({ entry, x: spot.x, z: spot.z, group, badge, found: false });
  }
  return frames;
}

function settle(
  entry: AlbumEntry,
  map: MapData,
  coast: CoastField,
): { x: number; z: number; yaw: number | null } {
  let { x, z } = project(entry.lat, entry.lon, map.origin);
  const stepInland = () => {
    for (let i = 0; i < 20; i++) {
      const q = coast.query(x, z);
      if (q.signed >= 8) break;
      x += q.normal[0] * 5;
      z += q.normal[1] * 5;
    }
  };
  stepInland();
  const street = nearestStreet(x, z, map.roads);
  let yaw: number | null = null;
  if (street && street.distance < 24) {
    const rx = -street.tangent[1];
    const rz = street.tangent[0];
    const side = Math.sign((x - street.point[0]) * rx + (z - street.point[1]) * rz) || 1;
    const offset = street.width / 2 + 1.6;
    x = street.point[0] + rx * offset * side;
    z = street.point[1] + rz * offset * side;
    yaw = yawFromDirection(street.point[0] - x, street.point[1] - z);
  }
  stepInland();
  const b = map.bounds;
  x = Math.min(b.maxX - 4, Math.max(b.minX + 4, x));
  z = Math.min(b.maxZ - 4, Math.max(b.minZ + 4, z));
  return { x, z, yaw };
}

function applyPlaceholder(photo: THREE.Mesh, title: string): void {
  const material = photo.material as THREE.MeshStandardMaterial;
  material.map = placeholderTexture(title);
  material.needsUpdate = true;
  photo.scale.set(1.36, 0.96, 1);
}

function labelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);
  g.clearRect(0, 0, 512, 128);
  roundRect(g, 8, 16, 496, 96, 28);
  g.fillStyle = "rgba(246, 240, 228, 0.95)";
  g.fill();
  g.fillStyle = "#1d2430";
  g.font = "700 48px Nunito, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function placeholderTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);
  g.fillStyle = "#f4ecdc";
  g.fillRect(0, 0, 640, 420);
  g.strokeStyle = "#e2d3b4";
  g.lineWidth = 3;
  for (let i = -420; i < 640; i += 28) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 420, 420);
    g.stroke();
  }
  g.fillStyle = "#1d2430";
  g.font = "600 54px Fraunces, serif";
  g.textAlign = "center";
  g.fillText(title, 320, 180);
  g.font = "700 28px Nunito, sans-serif";
  g.fillStyle = "#8a5a38";
  g.fillText("Your photo goes here", 320, 250);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function loadTexture(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      asset(url),
      (texture) => resolve(texture),
      undefined,
      () => resolve(null),
    );
  });
}
