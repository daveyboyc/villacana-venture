import * as THREE from "three";

export const SKY_HORIZON = "#a9d4f2";
export const SKY_MID = "#5fa5e8";
export const SKY_ZENITH = "#2476d4";

const VERTEX_SHADER = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uHorizon;
uniform vec3 uMid;
uniform vec3 uZenith;
varying vec3 vDir;

void main() {
  float elevDeg = degrees(asin(clamp(normalize(vDir).y, -1.0, 1.0)));
  float low = smoothstep(0.0, 12.0, elevDeg);
  float tLow = low > 0.0 ? pow(low, 0.8) : 0.0;
  float high = smoothstep(10.0, 70.0, elevDeg);
  float tHigh = high > 0.0 ? pow(high, 0.85) : 0.0;
  vec3 col = mix(uHorizon, uMid, tLow);
  col = mix(col, uZenith, tHigh);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * Clear Mediterranean sky dome that follows the camera so the horizon never clips.
 */
export function addSky(scene: THREE.Scene, camera: THREE.Camera, centre?: { x: number; z: number }): THREE.Mesh {
  const geo = new THREE.SphereGeometry(5200, 32, 24);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uHorizon: { value: new THREE.Color(SKY_HORIZON) },
      uMid: { value: new THREE.Color(SKY_MID) },
      uZenith: { value: new THREE.Color(SKY_ZENITH) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "sky-dome";
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  mesh.userData.noDrape = true;
  mesh.userData.noOcclusion = true;
  mesh.userData.noBatch = true;
  if (centre) mesh.position.set(centre.x, 0, centre.z);
  else mesh.position.copy(camera.position);
  mesh.onBeforeRender = (_renderer, _scene, activeCamera) => {
    mesh.position.copy(activeCamera ? activeCamera.position : camera.position);
    mesh.updateMatrixWorld();
  };
  scene.add(mesh);
  return mesh;
}
