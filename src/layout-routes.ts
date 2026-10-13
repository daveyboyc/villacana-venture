import * as THREE from "three";
import { roadHeight } from "./boundaries";
import { siteY } from "./terrain";
import type { ProtectedRoute } from "./route-clearance";
import type { BoundaryReference } from "./types";
/** Survey-overlay markers; visual only, not another wall or obstacle. */
export function addLayoutRoutes(
  scene: THREE.Scene,
  routes: ProtectedRoute[],
  reference: BoundaryReference,
  height: (x: number, z: number) => number,
): void {
  const ink = new THREE.MeshBasicMaterial({ color: "#286b88" });
  for (const route of routes)
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz);
      const road = reference.roads.find((r) => r.id === route.id);
      for (let at = 0.4; at < length; at += 2) {
        const x = a[0] + (dx / length) * at,
          z = a[1] + (dz / length) * at;
        const y = road
          ? siteY(x, z) + roadHeight(road, x, z).height + 0.024
          : height(x, z) + (route.id === "dali-shared-footpath" ? 0.3 : 0.025);
        const marker = new THREE.Mesh(
          new THREE.BoxGeometry(Math.min(0.65, length - at), 0.014, 0.06),
          ink,
        );
        marker.position.set(x, y, z);
        marker.rotation.y = -Math.atan2(dz, dx);
        marker.userData.noDrape = true;
        marker.name = `route:${route.id}`;
        scene.add(marker);
      }
    }
}
