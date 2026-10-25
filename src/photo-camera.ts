import * as THREE from "three";
import poseData from "../data/photo_poses.json";
import { asset } from "./asset";
import type { Skeleton, Vec2 } from "./types";

/** A photo's camera in scene metres (+x east, +z south, y up): compass yaw, pitch up and roll in
 * degrees, focal length in pixels of the photo. scripts/photo_pose.py solves it from matched points. */
export type PhotoPose = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number; f: number };
type PoseRecord = { image: [number, number]; initial: PhotoPose; solved?: { pose: PhotoPose; rmsCheckM?: number | null } };
const records = (poseData as unknown as { photos: Record<string, PoseRecord> }).photos;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * ?photocam=<photo id> looks through a photo's camera instead of walking: the render lines up with
 * the photo pixel for pixel, shown over it with an opacity slider (&overlay=0 hides it, for shoot_views).
 * &pose=initial uses the unsolved starting pose. Nothing in the scene changes.
 */
export function photoCamera() {
  const query = new URLSearchParams(location.search), id = query.get("photocam");
  if (!id) return null;
  const file = id.endsWith(".jpg") ? id : id + ".jpg", record = records[file];
  if (!record) throw new Error(`${file} has no camera in data/photo_poses.json`);
  const solved = query.get("pose") !== "initial" && record.solved;
  const pose = solved ? record.solved!.pose : record.initial;
  const [width, height] = record.image;
  document.body.classList.add("photo-camera");
  const style = document.createElement("style");
  style.textContent = "body.photo-camera>:not(#scene):not(#photo-camera){display:none!important}#photo-camera img{position:fixed;pointer-events:none}#photo-camera label{position:fixed;left:12px;bottom:12px;padding:6px 10px;border-radius:8px;background:#fffdf8e6;font:13px system-ui;display:flex;gap:8px;align-items:center}";
  document.head.append(style);
  const panel = document.createElement("div");
  panel.id = "photo-camera";
  panel.hidden = query.get("overlay") === "0";
  const image = document.createElement("img");
  image.src = asset(`/photos-ref/${file}`);
  image.alt = file;
  const label = document.createElement("label");
  const fit = solved ? `solved pose${record.solved!.rmsCheckM != null ? `, held-out checks off by ${record.solved!.rmsCheckM.toFixed(2)} m rms` : ""}` : "unsolved starting pose";
  label.textContent = `${file.replace(/\.jpg$/, "")} · ${fit} · photo`;
  const slider = Object.assign(document.createElement("input"), { type: "range", min: "0", max: "1", step: "0.05", value: "0.5" });
  slider.addEventListener("input", () => { image.style.opacity = slider.value; });
  image.style.opacity = slider.value;
  label.append(slider);
  panel.append(image, label);
  document.body.append(panel);
  return {
    /** Sets the camera to the photo's; the photo is fitted inside the window and the render matches it. */
    apply(camera: THREE.PerspectiveCamera, windowWidth: number, windowHeight: number) {
      const scale = Math.min(windowWidth / width, windowHeight / height);
      camera.position.set(pose.x, pose.y, pose.z);
      camera.rotation.order = "YXZ";
      camera.rotation.set(rad(pose.pitch), -rad(pose.yaw), rad(pose.roll));
      camera.fov = (2 * Math.atan(windowHeight / 2 / (pose.f * scale)) * 180) / Math.PI;
      camera.aspect = windowWidth / windowHeight;
      camera.updateProjectionMatrix();
      Object.assign(image.style, { width: `${width * scale}px`, height: `${height * scale}px`, left: `${(windowWidth - width * scale) / 2}px`, top: `${(windowHeight - height * scale) / 2}px` });
    },
  };
}

/** Publishes the built houses, pool edges and the walkable ground on a 2 m grid, as placed in the
 * scene, for scripts/photo_pose.py and scripts/lidar_check.py (with ?photocam= or ?export=model). */
export function exportModel(scene: THREE.Scene, skeleton: Skeleton, groundY: (x: number, z: number) => number, standY: (x: number, z: number) => number) {
  const meshes = new Map<string, THREE.Object3D>();
  scene.traverse((o) => { if (o.name.startsWith("building:")) meshes.set(o.name.slice(9), o); });
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3(), round = (v: number) => Math.round(v * 1000) / 1000;
  const buildings = skeleton.buildings.flatMap((b) => {
    const mesh = meshes.get(b.id);
    if (!mesh) return [];
    box.setFromObject(mesh);
    return [{ id: b.id, floors: b.floors, passage: !!b.passage, ring: b.ring, base: round(box.min.y), top: round(box.max.y) }];
  });
  const pools = skeleton.pools.map((p) => ({ id: p.id, ring: p.ring.map(([x, z]: Vec2) => [x, round(groundY(x, z)), z]) }));
  const xs = buildings.flatMap((b) => b.ring.map((p) => p[0])), zs = buildings.flatMap((b) => b.ring.map((p) => p[1]));
  const step = 2, x0 = Math.floor(Math.min(...xs) / step) * step - 10, z0 = Math.floor(Math.min(...zs) / step) * step - 10;
  const nx = Math.ceil((Math.max(...xs) + 10 - x0) / step) + 1, nz = Math.ceil((Math.max(...zs) + 10 - z0) / step) + 1;
  const heights: number[] = [];
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) heights.push(Math.round(standY(x0 + i * step, z0 + k * step) * 100) / 100);
  const ground = { x0, z0, step, nx, nz, heights };
  // The rendered edges of every other solid mesh (walls, gateways, steps, terraces, kerbs), grouped by
  // the nearest named object, so photo_pose.py can match a pixel to "an edge of this wall".
  // Unnamed meshes are numbered in build order, which is the same on every load.
  const features = new Map<string, number[][]>(), named = (o: THREE.Object3D | null): string => (!o ? "" : o.name || named(o.parent));
  let unnamed = 0;
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || !mesh.visible || !mesh.geometry) return;
    const id = named(mesh) || `unnamed#${unnamed++}`;
    if (/^(building:|facade-kit|route:)/.test(id) || mesh.geometry.getAttribute("position").count > 6000) return;
    const edges = new THREE.EdgesGeometry(mesh.geometry, 40).applyMatrix4(mesh.matrixWorld).getAttribute("position");
    const list = features.get(id) ?? [];
    for (let i = 0; i < edges.count; i += 2) list.push([edges.getX(i), edges.getY(i), edges.getZ(i), edges.getX(i + 1), edges.getY(i + 1), edges.getZ(i + 1)].map(round));
    features.set(id, list);
  });
  // Street edges, half the mapped width either side of each centre line, on the walkable ground.
  const roads = (skeleton.boundaryReference?.roads ?? []).flatMap((r) => (["left", "right"] as const).map((side) => {
    const line: number[][] = [];
    r.points.slice(1).forEach((b, i) => {
      const a = r.points[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]), half = (r.width ?? 4) / 2 * (side === "left" ? 1 : -1);
      const nx = -(b[1] - a[1]) / length, nz = (b[0] - a[0]) / length;
      for (let t = 0; t <= length; t += 1) {
        const x = a[0] + (b[0] - a[0]) * t / length + nx * half, z = a[1] + (b[1] - a[1]) * t / length + nz * half;
        line.push([round(x), round(standY(x, z)), round(z)]);
      }
    });
    return { id: `${r.id}:${side}`, name: r.name, line };
  }));
  (window as unknown as { villacanaModel: unknown }).villacanaModel = { frame: "scene metres, +x east, +z south, y up", buildings, pools, ground,
    features: [...features].map(([id, segments]) => ({ id, segments })), roads };
}
