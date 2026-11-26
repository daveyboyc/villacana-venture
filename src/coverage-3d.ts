import * as THREE from "three";
import type { CoverageRequest } from "./coverage";

export type Spot3D = { request: CoverageRequest; number: number };

const COLOURS: Record<string, string> = { open: "#c92a2a", answered: "#e09a00" };

/**
 * World-space 3D markers for photo requests in Inspect view:
 * a ground ring + tinted disc + stem + numbered billboard sprite at `at`,
 * plus a 3D arrow pointing toward `look`. Geometries, materials and badge
 * textures are shared and rebuilt only when the visible spot list changes.
 */
export function coverageSpots3D(options: {
  scene: THREE.Scene;
  groundY: (x: number, z: number) => number;
  onTap: (requestId: string) => void;
}) {
  const group = new THREE.Group();
  group.name = "coverage-request-spots";
  group.visible = false;
  options.scene.add(group);

  let assets: {
    ringGeo: THREE.RingGeometry;
    discGeo: THREE.CircleGeometry;
    stemGeo: THREE.CylinderGeometry;
    shaftGeo: THREE.CylinderGeometry;
    headGeo: THREE.ConeGeometry;
    mats: Record<string, { solid: THREE.MeshBasicMaterial; ring: THREE.MeshBasicMaterial; disc: THREE.MeshBasicMaterial; stem: THREE.MeshBasicMaterial }>;
  } | null = null;

  const textureCache = new Map<string, THREE.CanvasTexture>();
  const spriteMaterials = new Map<string, THREE.SpriteMaterial>();
  let entries: { id: string; sprite: THREE.Sprite; worldPos: THREE.Vector3 }[] = [];
  let lastSig = "";
  let visibleState = false;

  function ensureAssets() {
    if (assets) return assets;
    const ringGeo = new THREE.RingGeometry(1.05, 1.55, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const discGeo = new THREE.CircleGeometry(1.05, 24);
    discGeo.rotateX(-Math.PI / 2);
    const stemGeo = new THREE.CylinderGeometry(0.11, 0.11, 3.2, 8);
    const shaftGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 8);
    shaftGeo.rotateX(Math.PI / 2);
    const headGeo = new THREE.ConeGeometry(0.54, 1.15, 10);
    headGeo.rotateX(Math.PI / 2);

    const makeMats = (hex: string) => ({
      solid: new THREE.MeshBasicMaterial({ color: hex }),
      ring: new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide }),
      disc: new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }),
      stem: new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.82 }),
    });
    assets = {
      ringGeo,
      discGeo,
      stemGeo,
      shaftGeo,
      headGeo,
      mats: {
        open: makeMats(COLOURS.open),
        answered: makeMats(COLOURS.answered),
      },
    };
    return assets;
  }

  function badgeMaterial(num: number, status: string): THREE.SpriteMaterial {
    const key = `${num}:${status === "open" ? "open" : "answered"}`;
    const cached = spriteMaterials.get(key);
    if (cached) return cached;
    let tex = textureCache.get(key);
    if (!tex) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = status === "open" ? COLOURS.open : COLOURS.answered;
      ctx.beginPath();
      ctx.arc(48, 48, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${num >= 100 ? 34 : 44}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(num), 48, 50);
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(key, tex);
    }
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    spriteMaterials.set(key, mat);
    return mat;
  }

  function sync(spots: Spot3D[], visible: boolean) {
    visibleState = visible;
    if (!visible) {
      group.visible = false;
      return;
    }
    const sig = spots.map((s) => `${s.number}:${s.request.id}:${s.request.status}`).join("|");
    if (sig === lastSig) {
      group.visible = spots.length > 0;
      return;
    }
    lastSig = sig;
    group.clear();
    entries = [];
    if (!spots.length) {
      group.visible = false;
      return;
    }
    const { ringGeo, discGeo, stemGeo, shaftGeo, headGeo, mats } = ensureAssets();
    for (const { request, number } of spots) {
      const [x, z] = request.at;
      const y = options.groundY(x, z);
      const m = request.status === "open" ? mats.open : mats.answered;
      const spot = new THREE.Group();
      spot.position.set(x, y, z);
      spot.userData.requestId = request.id;

      const disc = new THREE.Mesh(discGeo, m.disc);
      disc.position.y = 0.06;
      disc.userData.requestId = request.id;

      const ring = new THREE.Mesh(ringGeo, m.ring);
      ring.position.y = 0.08;
      ring.userData.requestId = request.id;

      const stem = new THREE.Mesh(stemGeo, m.stem);
      stem.position.y = 1.68;
      stem.userData.requestId = request.id;

      const sprite = new THREE.Sprite(badgeMaterial(number, request.status));
      sprite.scale.set(2.6, 2.6, 1);
      sprite.position.set(0, 4.05, 0);
      sprite.renderOrder = 15;
      sprite.userData.requestId = request.id;

      spot.add(disc, ring, stem, sprite);

      if (request.look) {
        const dx = request.look[0] - x;
        const dz = request.look[1] - z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.2) {
          const arrowLen = Math.min(Math.max(dist * 0.65, 3.2), 7.5);
          const shaftLen = Math.max(0.6, arrowLen - 1.9);
          const arrow = new THREE.Group();
          arrow.position.y = 0.35;
          arrow.rotation.y = Math.atan2(dx, dz);
          arrow.userData.requestId = request.id;

          const shaft = new THREE.Mesh(shaftGeo, m.solid);
          shaft.scale.set(1, 1, shaftLen);
          shaft.position.z = 1.0 + shaftLen / 2;
          shaft.userData.requestId = request.id;

          const head = new THREE.Mesh(headGeo, m.solid);
          head.position.z = 1.0 + shaftLen + 0.5;
          head.userData.requestId = request.id;

          arrow.add(shaft, head);
          spot.add(arrow);
        }
      }

      group.add(spot);
      entries.push({ id: request.id, sprite, worldPos: new THREE.Vector3(x, y + 4.05, z) });
    }
    group.visible = true;
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const projected = new THREE.Vector3();

  function pick(clientX: number, clientY: number, camera: THREE.Camera, width: number, height: number): boolean {
    if (!group.visible || !entries.length) return false;
    ndc.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(group.children, true);
    for (const hit of hits) {
      const id = hit.object.userData.requestId as string | undefined;
      if (id) {
        options.onTap(id);
        return true;
      }
    }
    // Generous screen-space fallback around the billboard badges for finger taps on phones.
    let bestId: string | null = null;
    let bestDist = 26;
    for (const entry of entries) {
      projected.copy(entry.worldPos).project(camera);
      if (projected.z <= -1 || projected.z >= 1) continue;
      const sx = (projected.x + 1) * width / 2;
      const sy = (1 - projected.y) * height / 2;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestDist) {
        bestDist = d;
        bestId = entry.id;
      }
    }
    if (bestId) {
      options.onTap(bestId);
      return true;
    }
    return false;
  }

  return {
    sync,
    setVisible(visible: boolean) {
      visibleState = visible;
      group.visible = visible && entries.length > 0;
    },
    isVisible: () => visibleState && group.visible,
    pick,
  };
}
