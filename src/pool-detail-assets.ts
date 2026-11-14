import * as THREE from "three";

/** Small pool fittings read from IMG_2193/2194 and IMG_2332. Dimensions are estimates. */
const steel = () => new THREE.MeshStandardMaterial({ color: "#d8dfe0", metalness: .82, roughness: .28 });

export function poolShower(height: number): THREE.Group {
  const group = new THREE.Group(), metal = steel();
  const pipe = new THREE.CurvePath<THREE.Vector3>();
  pipe.add(new THREE.LineCurve3(new THREE.Vector3(0, .04, 0), new THREE.Vector3(0, height - .6, 0)));
  // Tall inclined neck turns over into a small downward-facing head, rather than a broad rain disc.
  pipe.add(new THREE.CubicBezierCurve3(new THREE.Vector3(0, height - .6, 0), new THREE.Vector3(0, height + .02, .15), new THREE.Vector3(0, height + .04, .47), new THREE.Vector3(0, height - .15, .49)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(pipe, 40, .024, 10, false), metal));
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, .035, 24), metal);
  flange.position.y = .018; group.add(flange);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.065, .045, .04, 24), metal);
  head.position.set(0, height - .18, .49); group.add(head);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.054, 24), new THREE.MeshStandardMaterial({ color: "#676d6c", roughness: .85 }));
  face.rotation.x = Math.PI / 2; face.position.set(0, height - .201, .49); group.add(face);
  // A small push control is visible on the post; plumbing below ground is not inferred.
  const button = new THREE.Mesh(new THREE.CylinderGeometry(.029, .029, .055, 16).rotateX(Math.PI / 2), metal);
  button.position.set(0, height * .48, .042); group.add(button);
  return group;
}

/** Concentric interrupted slots with a solid centre, as on the west crazy-paved path. */
export function roundPathDrain(diameter: number): THREE.Group {
  const group = new THREE.Group(), radius = diameter / 2;
  const surround = new THREE.Mesh(new THREE.BoxGeometry(diameter * 1.18, .012, diameter * 1.18), new THREE.MeshStandardMaterial({ color: "#b5ad98", roughness: .95 }));
  surround.position.y = -.004; group.add(surround);
  const recess = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .013, 48), new THREE.MeshStandardMaterial({ color: "#252a28", roughness: .9 }));
  recess.position.y = -.005; group.add(recess);
  const metal = new THREE.MeshStandardMaterial({ color: "#737a70", metalness: .45, roughness: .7 });
  for (const [inner, outer] of [[.86, 1], [.62, .73]]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * inner, radius * outer, 48), metal);
    ring.rotation.x = -Math.PI / 2; ring.position.y = .003; group.add(ring);
  }
  const centre = new THREE.Mesh(new THREE.CircleGeometry(radius * .48, 32), metal);
  centre.rotation.x = -Math.PI / 2; centre.position.y = .003; group.add(centre);
  for (let i = 0; i < 4; i++) {
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(radius * .52, .004, .016), metal);
    const a = i * Math.PI / 2;
    bridge.position.set(Math.cos(a) * radius * .74, 0, Math.sin(a) * radius * .74);
    bridge.rotation.y = -a; group.add(bridge);
  }
  return group;
}

/** Pale flush access lid on the slab deck, distinct from the dark path drain. */
export function poolAccessCap(diameter: number): THREE.Group {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(diameter / 2, diameter / 2, .012, 36), new THREE.MeshStandardMaterial({ color: "#a7a99b", roughness: .8 }));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(diameter / 2 - .012, diameter / 2 - .012, .014, 36), new THREE.MeshStandardMaterial({ color: "#dfdfcf", roughness: .9 }));
  lid.position.y = .003; group.add(rim, lid);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.012, 12), new THREE.MeshStandardMaterial({ color: "#555c56", roughness: 1 }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(0, .011, -.035); group.add(hole);
  return group;
}

/** Paired slender curls inside the existing gate leaf; no opening or hinge changes. */
export function gateScrollwork(width: number, material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 56; i++) {
      const t = i / 56, a = t * Math.PI * 3.5, radius = .018 + Math.sin(Math.PI * t) * .085;
      points.push(new THREE.Vector3(width / 2 + side * (.065 + Math.sin(a) * radius), .42 + t * .55, .028 + Math.cos(a) * .002));
    }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 56, .009, 6, false), material));
  }
  return group;
}
