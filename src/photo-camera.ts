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
    /** Publishes the built houses and pool edges, as placed in the scene, for scripts/photo_pose.py. */
    exportModel(scene: THREE.Scene, skeleton: Skeleton, groundY: (x: number, z: number) => number) {
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
      (window as unknown as { villacanaModel: unknown }).villacanaModel = { frame: "scene metres, +x east, +z south, y up", buildings, pools };
    },
  };
}
