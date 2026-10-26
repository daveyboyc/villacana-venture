import * as THREE from 'three';
import {refine,siteY} from './terrain';
import type {Vec2} from './types';

/** Connected Elena walls must use the same ground at a shared vertex. Per-mesh
 * midpoint placement otherwise gives the body, coping and adjoining returns
 * different offsets. Bake surveyed ground once, then skip the generic drape. */
export function groundElenaWall(mesh:THREE.Mesh,anchor?:Vec2):THREE.Mesh {
 mesh.userData.noDrape=true;
 if(anchor){mesh.position.y+=siteY(...anchor);return mesh;}
 mesh.updateMatrixWorld(true);
 const old=mesh.geometry;
 mesh.geometry=refine(old,siteY,mesh.matrixWorld);
 if(mesh.geometry!==old)old.dispose();
 return mesh;
}
