import * as THREE from "three";
import data from "../data/backdrop.json";
import { addSprites, type SpriteKind, type SpritePlacement } from "./sprites";

/**
 * The trees and mountains beyond the resort (data/backdrop.json, scripts/build_backdrop.py):
 * trees where the aerial shows canopy and where the north-pool photos show them over the roofs,
 * groves filling the land beyond the aerial, and the mountain ridge traced from the photos.
 */
type Tree = [SpriteKind, number, number, number, string];
const trees = data.trees as unknown as Tree[];
const [bx0, bz0, bx1, bz1] = data.block;
const TURN = (26 * Math.PI) / 180;
/** Trees nearer than this to a shown pool get the detailed models; the rest the light distant ones.
 * Palms always use the distant model here: the detailed palm is 11,000 triangles. */
const NEAR = 85;

/** Whether a point is inside the resort block, whose own trees come from the ground cover and the props. */
export function inResortBlock(x: number, z: number): boolean {
  const tx = x * Math.cos(TURN) - z * Math.sin(TURN), tz = x * Math.sin(TURN) + z * Math.cos(TURN);
  return tx >= bx0 && tx <= bx1 && tz >= bz0 && tz <= bz1;
}

export function addBackdropTrees(scene: THREE.Scene, courts: { x: number; z: number }[]): void {
  const near = new Map<SpriteKind, SpritePlacement[]>(), far = new Map<SpriteKind, SpritePlacement[]>();
  for (const [kind, x, z, scale] of trees) {
    const close = kind !== "palm" && courts.some((c) => Math.hypot(c.x - x, c.z - z) < NEAR);
    const list = close ? near : far;
    if (!list.has(kind)) list.set(kind, []);
    list.get(kind)!.push({ x, z, scale });
  }
  for (const [kind, places] of near) addSprites(scene, kind, places);
  for (const [kind, places] of far) addSprites(scene, kind, places, { far: true });
}

/**
 * Photo-measured inland mountain range (Sierra Bermeja, Monte Mayor, broad massif, Benahavís ridge,
 * and La Concha / Sierra Blanca) seen north and north-east of Villacana.
 *
 * Calibrated from solved cameras (IMG_2204, IMG_2205, IMG_2206, IMG_2360), rooftop panoramas
 * (IMG_2214, IMG_2215, IMG_2219, rooftop1-4), and paseo/beach horizons (IMG_2224, IMG_2226,
 * IMG_2350, IMG_2480, IMG_2481, IMG_2482, IMG_2597).
 *
 * Each entry is [signedCompassBearingDeg, elevationDeg] relative to true north (0 = N, + = E, - = W).
 */
const RESORT_CENTRE: [number, number] = [-80, 90];
const FAR_DISTANCE = 4200;
const NEAR_DISTANCE = 3700;

const FAR_RIDGE: [number, number][] = [
  [-112, -0.5],
  [-102, 0.0],
  [-92, 1.2],
  [-82, 2.7],
  [-74, 4.2],
  [-66, 5.2],
  [-60, 4.9],
  [-55, 5.4],
  [-50, 4.8],
  [-46, 4.6],
  [-42, 5.4],
  [-39, 4.6],
  [-35, 4.5],
  [-32, 4.4],
  [-28, 4.0],
  [-24, 4.8],
  [-21, 4.5],
  [-18, 5.0],
  [-14, 3.8],
  [-10, 3.7],
  [-6, 4.4],
  [-3, 5.2],
  [-1, 5.6],
  [0, 5.45],
  [1, 5.9],
  [3.5, 5.5],
  [7, 4.8],
  [10.5, 4.1],
  [14.5, 3.3],
  [17.5, 3.6],
  [20, 3.9],
  [23.5, 3.9],
  [26.5, 2.7],
  [30, 2.3],
  [34, 2.2],
  [38, 2.4],
  [41.5, 3.0],
  [44.5, 3.75],
  [45.5, 3.55],
  [46.6, 4.15],
  [48.5, 3.45],
  [51.5, 2.7],
  [54.5, 2.25],
  [57.5, 1.7],
  [60.5, 1.0],
  [63.5, 1.3],
  [66.5, 0.95],
  [71, 0.4],
  [75, 0.0],
  [82, -0.5],
];

// Closer conical foothill (Monte Mayor) and adjacent low foothills, standing in front of the main massif.
const NEAR_RIDGE: [number, number][] = [
  [-26, 0.0],
  [-19, 1.7],
  [-14, 2.3],
  [-11, 2.7],
  [-8.5, 2.75],
  [-7.0, 3.8],
  [-6.0, 5.1],
  [-4.8, 3.9],
  [-3.2, 2.8],
  [-1.0, 1.6],
  [2.5, 0.25],
  [4.0, 0.0],
];

export function addRidge(scene: THREE.Scene): void {
  const [cx, cz] = RESORT_CENTRE;
  const cSky = new THREE.Color("#bfe3f2");
  const cHorizon = new THREE.Color("#9db4c4");

  const farPos: number[] = [], farCol: number[] = [];
  {
    const cCrest = new THREE.Color("#7b91a6");
    const cMid = new THREE.Color("#879cad");
    const levels = (bearingDeg: number, elevDeg: number) => {
      const a = (bearingDeg * Math.PI) / 180;
      const x = cx + Math.sin(a) * FAR_DISTANCE;
      const z = cz - Math.cos(a) * FAR_DISTANCE;
      const yCrest = FAR_DISTANCE * Math.tan((elevDeg * Math.PI) / 180);
      const yHorizon = Math.min(0, yCrest);
      const yMid = yHorizon + (yCrest - yHorizon) * 0.44;
      const ySkirt = -180;
      const haze = Math.max(0, Math.min(0.45, (Math.abs(bearingDeg) - 25) / 110));
      const tipFade = Math.max(0, Math.min(1, elevDeg / 0.6));
      const topCol = cHorizon.clone().lerp(cCrest.clone().lerp(cHorizon, haze * 0.45), tipFade);
      const midCol = cHorizon.clone().lerp(cMid.clone().lerp(cHorizon, haze * 0.35), tipFade);
      const footCol = elevDeg <= 0 ? cSky.clone().lerp(cHorizon, Math.max(0, 1 + elevDeg * 2)) : cHorizon;
      return [
        { x, y: ySkirt, z, c: cSky },
        { x, y: yHorizon, z, c: footCol },
        { x, y: yMid, z, c: midCol },
        { x, y: yCrest, z, c: topCol },
      ];
    };
    const pushV = (v: { x: number; y: number; z: number; c: THREE.Color }) => {
      farPos.push(v.x, v.y, v.z);
      farCol.push(v.c.r, v.c.g, v.c.b);
    };
    for (let i = 0; i < FAR_RIDGE.length - 1; i++) {
      const a = levels(FAR_RIDGE[i][0], FAR_RIDGE[i][1]);
      const b = levels(FAR_RIDGE[i + 1][0], FAR_RIDGE[i + 1][1]);
      for (let band = 0; band < a.length - 1; band++) {
        pushV(a[band]); pushV(b[band]); pushV(b[band + 1]);
        pushV(a[band]); pushV(b[band + 1]); pushV(a[band + 1]);
      }
    }
  }

  const farGeo = new THREE.BufferGeometry();
  farGeo.setAttribute("position", new THREE.Float32BufferAttribute(farPos, 3));
  farGeo.setAttribute("color", new THREE.Float32BufferAttribute(farCol, 3));
  const farMesh = new THREE.Mesh(
    farGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }),
  );
  farMesh.name = "mountain-ridge";
  farMesh.frustumCulled = false;
  farMesh.userData.noDrape = true;
  farMesh.userData.noOcclusion = true;
  farMesh.userData.noBatch = true;
  scene.add(farMesh);

  // Near foothill (Monte Mayor) fades smoothly in front of the far range without leaving a hard skirt edge.
  const nearPos: number[] = [], nearCol: number[] = [];
  {
    const cCrest = new THREE.Color("#6b7a7d");
    const cMid = new THREE.Color("#7d8d92");
    const levels = (bearingDeg: number, elevDeg: number) => {
      const a = (bearingDeg * Math.PI) / 180;
      const x = cx + Math.sin(a) * NEAR_DISTANCE;
      const z = cz - Math.cos(a) * NEAR_DISTANCE;
      const yCrest = NEAR_DISTANCE * Math.tan((elevDeg * Math.PI) / 180);
      const yBase = -10;
      const yMid = yBase + (yCrest - yBase) * 0.45;
      const edgeAlpha = Math.max(0, Math.min(1, elevDeg / 0.8));
      return [
        { x, y: yBase, z, c: cHorizon, alpha: 0 },
        { x, y: yMid, z, c: cMid, alpha: 0.9 * edgeAlpha },
        { x, y: yCrest, z, c: cCrest, alpha: edgeAlpha },
      ];
    };
    const pushV = (v: { x: number; y: number; z: number; c: THREE.Color; alpha: number }) => {
      nearPos.push(v.x, v.y, v.z);
      nearCol.push(v.c.r, v.c.g, v.c.b, v.alpha);
    };
    for (let i = 0; i < NEAR_RIDGE.length - 1; i++) {
      const a = levels(NEAR_RIDGE[i][0], NEAR_RIDGE[i][1]);
      const b = levels(NEAR_RIDGE[i + 1][0], NEAR_RIDGE[i + 1][1]);
      for (let band = 0; band < a.length - 1; band++) {
        pushV(a[band]); pushV(b[band]); pushV(b[band + 1]);
        pushV(a[band]); pushV(b[band + 1]); pushV(a[band + 1]);
      }
    }
  }

  const nearGeo = new THREE.BufferGeometry();
  nearGeo.setAttribute("position", new THREE.Float32BufferAttribute(nearPos, 3));
  nearGeo.setAttribute("color", new THREE.Float32BufferAttribute(nearCol, 4));
  const nearMesh = new THREE.Mesh(
    nearGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  nearMesh.name = "mountain-ridge-near";
  nearMesh.frustumCulled = false;
  nearMesh.userData.noDrape = true;
  nearMesh.userData.noOcclusion = true;
  nearMesh.userData.noBatch = true;
  scene.add(nearMesh);
}
