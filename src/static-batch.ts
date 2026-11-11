import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Draw-call batching for the finished, draped scene. Every separate mesh costs a draw call in
 * each pass (colour, shadow and, on desktop, ambient occlusion), and the resort is thousands of
 * small hand-built pieces. Meshes that will not change again and look the same (same material
 * settings, shadow flags, occlusion flag) are merged, per 64 m square of ground, into one mesh
 * in world space.
 *
 * The originals stay in the scene, hidden: names, user data and ray casts (the reference editor,
 * the walk camera, the facade kit's floor levels) still find them, exactly where they were. The
 * merged copies are drawn but take no part in ray casts.
 *
 * Left alone: anything marked `userData.dynamic` (the gate leaf, the player, the overlays that
 * show and hide), nested scenes (batched on their own), LODs, instanced, skinned and morphing
 * meshes, transparent or specially ordered objects, mirrored transforms, and anything hidden
 * when the batch is made. ShaderMaterials (the pool water) are merged only with meshes that use
 * that very material.
 */
export function batchStatic(root: THREE.Object3D, cell = 64): { batches: number; merged: number } {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  type Piece = { object: THREE.Mesh | THREE.Line; geometry: THREE.BufferGeometry };
  const sets = new Map<string, { material: THREE.Material; mesh: boolean; object: THREE.Object3D; pieces: Piece[] }>();
  const canonical = new Map<string, THREE.Material>();
  const box = new THREE.Box3(), mid = new THREE.Vector3(), matrix = new THREE.Matrix4();

  const visit = (object: THREE.Object3D) => {
    if (!object.visible || object.userData.dynamic || object.userData.noBatch) return;
    if (object !== root && ((object as THREE.Scene).isScene || (object as THREE.LOD).isLOD)) return;
    if (object.children.length) { for (const child of object.children) visit(child); return; }
    const mesh = object as THREE.Mesh, line = object as THREE.Line;
    const isMesh = mesh.isMesh && !(mesh as THREE.InstancedMesh).isInstancedMesh && !(mesh as THREE.SkinnedMesh).isSkinnedMesh;
    const isLine = line.isLine && !(line as unknown as THREE.Points).isPoints;
    if (!isMesh && !isLine) return;
    if (object.renderOrder || !object.frustumCulled || object.layers.mask !== 1 || object.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) return;
    if (mesh.morphTargetInfluences?.length) return;
    const geometry = mesh.geometry;
    if (!geometry.attributes.position || Object.keys(geometry.morphAttributes).length) return;
    if (geometry.drawRange.start !== 0 || geometry.drawRange.count !== Infinity) return;
    if (Object.values(geometry.attributes).some((a) => (a as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute)) return;
    matrix.multiplyMatrices(toRoot, object.matrixWorld);
    if (matrix.determinant() <= 0) return;
    // Lines are merged as plain segments, so only plain coloured lines.
    if (isLine && (Array.isArray(line.material) || (line.material as THREE.LineDashedMaterial).isLineDashedMaterial || line.material.vertexColors)) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const parts: { material: THREE.Material; geometry: THREE.BufferGeometry }[] = [];
    if (Array.isArray(mesh.material)) {
      for (const group of geometry.groups) {
        const material = mesh.material[group.materialIndex ?? 0];
        if (material) parts.push({ material, geometry: groupPart(geometry, group.start, group.count) });
      }
    } else parts.push({ material: mesh.material, geometry });
    if (materials.some((m) => m.transparent || m.clippingPlanes?.length)) return;
    box.setFromObject(object); box.getCenter(mid);
    const square = `${Math.floor(mid.x / cell)},${Math.floor(mid.z / cell)}`;
    for (const part of parts) {
      const sign = signature(part.material);
      const material = canonical.get(sign) ?? (canonical.set(sign, part.material), part.material);
      const attributes = Object.entries(part.geometry.attributes).map(([name, a]) => `${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`).sort().join(",");
      const key = [sign, isMesh ? "mesh" : line.type, object.castShadow, object.receiveShadow, !!object.userData.noOcclusion, isMesh ? attributes : "line", part.geometry.index ? "indexed" : "flat", square].join("|");
      let set = sets.get(key);
      if (!set) sets.set(key, (set = { material, mesh: isMesh, object, pieces: [] }));
      set.pieces.push({ object: mesh, geometry: part.geometry });
    }
  };
  visit(root);

  let batches = 0, merged = 0;
  const hidden = new Set<THREE.Object3D>();
  for (const set of sets.values()) {
    if (set.pieces.length < 2) continue;
    const geometries = set.pieces.map(({ object, geometry }) => {
      const g = set.mesh ? geometry.clone() : lineSegments(object as THREE.Line);
      g.clearGroups();
      return g.applyMatrix4(matrix.multiplyMatrices(toRoot, object.matrixWorld));
    });
    const joined = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!joined) continue;
    joined.computeBoundingSphere();
    const batch = set.mesh ? new THREE.Mesh(joined, set.material) : new THREE.LineSegments(joined, set.material);
    batch.castShadow = set.object.castShadow; batch.receiveShadow = set.object.receiveShadow;
    batch.userData.noOcclusion = set.object.userData.noOcclusion;
    batch.userData.noDrape = true; batch.userData.batch = true;
    batch.name = `batch:${set.material.type}`;
    batch.raycast = () => {};
    root.add(batch);
    batches++;
    for (const piece of set.pieces) hidden.add(piece.object);
  }
  // A mesh is hidden only once every material part of it has gone into a batch.
  for (const object of hidden) {
    const mesh = object as THREE.Mesh;
    const parts = Array.isArray(mesh.material) ? mesh.geometry.groups.length : 1;
    const placed = [...sets.values()].reduce((n, set) => n + (set.pieces.length >= 2 ? set.pieces.filter((p) => p.object === object).length : 0), 0);
    if (placed === parts) { object.visible = false; merged++; }
  }
  return { batches, merged };
}

/** One material group of a geometry, as its own geometry. */
function groupPart(geometry: THREE.BufferGeometry, start: number, count: number): THREE.BufferGeometry {
  const part = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) part.setAttribute(name, attribute);
  if (geometry.index) {
    const end = Math.min(geometry.index.count, start + count);
    part.setIndex(Array.from(geometry.index.array.slice(start, end)));
    return part;
  }
  const end = Math.min(geometry.attributes.position.count, start + count);
  const flat = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const a = attribute as THREE.BufferAttribute;
    flat.setAttribute(name, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, end * a.itemSize), a.itemSize, a.normalized));
  }
  return flat;
}

/** A line, loop or segments as plain segment pairs. */
function lineSegments(line: THREE.Line): THREE.BufferGeometry {
  const position = line.geometry.attributes.position, index = line.geometry.index;
  const at = (i: number) => (index ? index.getX(i) : i);
  const count = index ? index.count : position.count, out: number[] = [];
  const push = (i: number) => out.push(position.getX(at(i)), position.getY(at(i)), position.getZ(at(i)));
  if ((line as THREE.LineSegments).isLineSegments) for (let i = 0; i + 1 < count; i += 2) { push(i); push(i + 1); }
  else {
    for (let i = 0; i + 1 < count; i++) { push(i); push(i + 1); }
    if ((line as THREE.LineLoop).isLineLoop && count > 2) { push(count - 1); push(0); }
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
}

/**
 * What a material looks like: every setting that changes how it draws. Two materials with the
 * same signature draw the same, so their meshes can share one. A shader material, or one with
 * custom shader code, matches only itself.
 */
function signature(material: THREE.Material): string {
  if ((material as THREE.ShaderMaterial).isShaderMaterial) return material.uuid;
  const out: string[] = [material.type];
  for (const [key, value] of Object.entries(material)) {
    if (key === "uuid" || key === "name" || key === "id" || key === "version" || key.startsWith("_")) continue;
    if (value === null || value === undefined || typeof value === "number" || typeof value === "string" || typeof value === "boolean") out.push(`${key}=${value}`);
    else if ((value as THREE.Color).isColor) out.push(`${key}=#${(value as THREE.Color).getHexString()}`);
    else if ((value as THREE.Texture).isTexture) out.push(`${key}=${(value as THREE.Texture).uuid}`);
    else if ((value as THREE.Vector2).isVector2 || (value as THREE.Vector3).isVector3 || (value as THREE.Euler).isEuler) out.push(`${key}=${(value as THREE.Vector3).toArray().join(",")}`);
    else if (typeof value === "function") {
      if (key === "onBeforeCompile" && value !== THREE.Material.prototype.onBeforeCompile) return material.uuid;
    } else {
      try { out.push(`${key}=${JSON.stringify(value)}`); } catch { return material.uuid; }
    }
  }
  if (material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey) return material.uuid;
  return out.join(";");
}
