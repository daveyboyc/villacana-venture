import * as THREE from "three";
import lawns from "../data/junction_lawns.json";
import { addSprites } from "./sprites";

/** Three photo-supported clipped trees. Shared sprite guard protects the lanes;
 * scene draping supplies the existing site level, and Layout omits decoration. */
export function addJunctionLawns(scene: THREE.Scene): void {
  addSprites(scene, "pollarded_tree", lawns.trees.map(tree => ({
    x: tree.point[0], z: tree.point[1], scale: tree.scale,
  })));
}
