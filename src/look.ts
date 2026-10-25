import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { asset } from "./asset";

/**
 * Lighting and finish for the whole scene (docs/GRAPHICS.md): sky light from a small CC0 sky
 * (Poly Haven, kloofendal 48d partly cloudy), neutral tone mapping (it keeps the painted colours that
 * ACES washed out), a sun shadow box that follows
 * what the camera looks at, and ambient occlusion on desktop screens. ?ao=0 or ?ao=1 forces the
 * occlusion off or on; it is off by default under browser automation so route tests stay quick.
 */
export function setupLook(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, sun: THREE.DirectionalLight, sky: THREE.HemisphereLight, widest: number) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  sky.intensity = 0.9;
  sun.intensity = 2.1;
  sun.shadow.normalBias = 0.03;
  const pmrem = new THREE.PMREMGenerator(renderer);
  new RGBELoader().load(asset("/art/sky-kloofendal-1k.hdr"), (hdr) => {
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    scene.environmentIntensity = 0.55;
    hdr.dispose();
    pmrem.dispose();
  });

  const query = new URLSearchParams(location.search).get("ao");
  const small = matchMedia("(max-width:700px), (max-height:500px)").matches;
  const occlusion = query === "1" || (query !== "0" && !small && !navigator.webdriver);
  let composer: EffectComposer | undefined;
  if (occlusion) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1, scale: 1 });
    gtao.blendIntensity = 0.75;
    // Double-sided cut-out cards (plants, shutters, wire) would occlude as solid rectangles; the
    // ground's own cut-outs stay in. The far backdrop has no
    // useful depth: leave both out of the occlusion pass, as three already does for lines and points.
    const remembered = (gtao as unknown as { _visibilityCache: Map<THREE.Object3D, boolean> })._visibilityCache;
    gtao.overrideVisibility = () => scene.traverse((o) => {
      remembered.set(o, o.visible);
      const cut = (o as THREE.Mesh).isMesh && [((o as THREE.Mesh).material)].flat().some((m) => m.alphaTest > 0 && m.side === THREE.DoubleSide);
      if ((o as THREE.Line).isLine || (o as THREE.Points).isPoints || cut || o.userData.noOcclusion) o.visible = false;
    });
    composer.addPass(gtao);
    composer.addPass(new OutputPass());
    const fit = () => composer!.setSize(innerWidth, innerHeight);
    addEventListener("resize", fit);
    fit();
  }

  // The sun keeps its direction; its shadow box is centred where the view meets the ground.
  const offset = sun.position.clone().sub(sun.target.position).normalize().multiplyScalar(160);
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ray = new THREE.Ray(), hit = new THREE.Vector3(), centre = new THREE.Vector3();
  return {
    occlusion,
    render() {
      ray.origin.copy(camera.position);
      camera.getWorldDirection(ray.direction);
      if (!ray.intersectPlane(ground, hit) || hit.distanceTo(camera.position) > 250) hit.copy(camera.position).addScaledVector(ray.direction.setY(0).normalize(), 40).setY(0);
      const span = THREE.MathUtils.clamp(hit.distanceTo(camera.position) * 1.3, 40, widest);
      if (!centre.equals(hit) || sun.shadow.camera.right !== span) {
        centre.copy(hit);
        sun.target.position.copy(centre);
        sun.position.copy(centre).add(offset);
        Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span });
        sun.shadow.camera.updateProjectionMatrix();
      }
      if (composer) composer.render();
      else renderer.render(scene, camera);
    },
  };
}
