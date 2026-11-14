import * as THREE from "three";
import { centroid } from "./geom";
import type { Seaside } from "./seaside";
import type { Seafront, Vec2 } from "./types";

function flat(scene: THREE.Scene, ring: Vec2[], color: string, height: number, noDrape = false): void {
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  mesh.position.y = height; mesh.receiveShadow = true; mesh.userData.noDrape = noDrape; scene.add(mesh);
}

/** Weathered deck boards, running across the terrace. Schematic, from IMG_2606. */
function plankTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#b08968"; g.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 32) {
    g.fillStyle = x % 64 ? "#c4a27a" : "#9a7352";
    g.fillRect(x + 1, 0, 28, 128);
    g.strokeStyle = "#6e5340"; g.lineWidth = 2; g.strokeRect(x + 1, 0, 28, 128);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.35, 0.35);
  return t;
}

function outline(scene: THREE.Scene, points: Vec2[], color: string, height: number, closed = false, noDrape = false): void {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints((closed ? [...points, points[0]] : points).map(([x, z]) => new THREE.Vector3(x, height, z))), new THREE.LineBasicMaterial({ color }));
  line.userData.noDrape = noDrape; scene.add(line);
}

/** Shared seaside geometry: the blueprint and walk use the same outlines. */
export function addSeafrontOutlines(scene: THREE.Scene, sf: Seafront, restaurant = true, seaside?: Seaside): void {
  // With seaside heights the sand and paseo are drawn by addSeaside; only the sea is flat.
  // The sea stays at sea level: it is not draped over the land's heights.
  flat(scene, [...sf.coast, [1500, 1500], [-1500, 1500]], "#147ba8", seaside ? seaside.seaY : 0.12, true);
  if (!seaside) {
    flat(scene, sf.beach.ring, "#e1c99c", 0.14);
    outline(scene, sf.coast, "#e2f9f5", 0.17);
    // A continuous ribbon along the mapped paseo, with joined corners.
    const points = sf.paseo.points;
    const side = (sign: number): Vec2[] => points.map(([x,z], i) => {
      const a = points[Math.max(0,i-1)], b = points[Math.min(points.length-1,i+1)];
      const length = Math.hypot(b[0]-a[0],b[1]-a[1]) || 1;
      return [x + sign*(b[1]-a[1])/length*sf.paseo.width/2, z-sign*(b[0]-a[0])/length*sf.paseo.width/2];
    });
    const path = [...side(1), ...side(-1).reverse()];
    flat(scene,path,"#ce9878",0.18);
    outline(scene,path,"#f2debb",0.2,true);
  }
  if (!restaurant) return;
  // The restaurant stands on the sand, at whatever height the beach has there.
  // That height is final: the survey grid is not added again, or the pad sinks.
  const c = centroid(sf.restaurant.ring), base = seaside ? seaside.y(c.x, c.z) : 0;
  // Timber deck along the seaward wall (IMG_2606): weathered planks, not the old pad that ran out over the sand.
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(sf.restaurant.terrace.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.9 }));
  deck.position.y = base + 0.28; deck.receiveShadow = true; deck.userData.noDrape = !!seaside; deck.name = "barraka-deck"; scene.add(deck);
  outline(scene,sf.restaurant.terrace,"#6d5a42",base+0.3,true, !!seaside);
  // The parapet, clerestory, awnings and thatched eaves are the building itself (src/barraka-facade.ts).
}
