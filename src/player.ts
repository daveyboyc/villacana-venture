import * as THREE from "three";
import { clamp, dampAngle, inAnyPool, rotationYFromYaw, yawFromDirection, type CoastField, type Solids } from "./geom";
import type { InputState, MapData } from "./types";

export type MoveWorld = {
  solids: Solids;
  coast: CoastField;
  pools: [number, number][][];
  bounds: MapData["bounds"];
  /** How far below the ground the player stands in a pool. Defaults to ankle-deep. */
  poolFloor?: number;
  groundHeight?: (x: number, z: number) => number;
};

const RADIUS = 0.42;

export class Player {
  readonly group = new THREE.Group();
  x = 0;
  y = 0;
  z = 0;
  /** Direction the character is facing. 0 is north. */
  yaw = 0;
  private vy = 0;
  private airborne = false;
  private phase = 0;
  private squash = 1;
  private readonly hips: THREE.Group;
  private readonly legL: THREE.Group;
  private readonly legR: THREE.Group;
  private readonly armL: THREE.Group;
  private readonly armR: THREE.Group;
  private readonly torso: THREE.Group;

  constructor() {
    const skin = new THREE.MeshStandardMaterial({ color: "#f2c39a", roughness: 0.62 });
    const shirt = new THREE.MeshStandardMaterial({ color: "#e25d3c", roughness: 0.7 });
    const shorts = new THREE.MeshStandardMaterial({ color: "#1e3a6e", roughness: 0.72 });
    const hat = new THREE.MeshStandardMaterial({ color: "#e6c27a", roughness: 0.8 });
    const hair = new THREE.MeshStandardMaterial({ color: "#3a2a24", roughness: 0.8 });
    const shoe = new THREE.MeshStandardMaterial({ color: "#5c3a2e", roughness: 0.75 });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: "#fffaf4", roughness: 0.4 });
    const pupil = new THREE.MeshStandardMaterial({ color: "#1b1a22", roughness: 0.35 });

    this.torso = new THREE.Group();
    const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.24), shorts);
    hipsMesh.position.y = 0.74;
    hipsMesh.castShadow = true;
    this.torso.add(hipsMesh);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.28), shirt);
    chest.position.y = 1.02;
    chest.castShadow = true;
    this.torso.add(chest);

    this.hips = new THREE.Group();
    this.hips.position.y = 0.74;
    this.legL = this.makeLeg(-0.1, skin, shorts, shoe);
    this.legR = this.makeLeg(0.1, skin, shorts, shoe);
    this.hips.add(this.legL, this.legR);

    this.armL = this.makeArm(-0.3, skin, shirt);
    this.armR = this.makeArm(0.3, skin, shirt);
    this.armL.position.y = 1.16;
    this.armR.position.y = 1.16;

    const head = new THREE.Group();
    head.position.y = 1.42;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skin);
    skull.castShadow = true;
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), hair);
    hairCap.position.set(0, 0.05, -0.04);
    hairCap.scale.set(1, 0.72, 0.85);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.045, 14), hat);
    brim.position.y = 0.2;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), hat);
    crown.scale.set(1, 0.7, 1);
    crown.position.y = 0.28;
    const eyeL = this.makeEye(-0.09, eyeWhite, pupil);
    const eyeR = this.makeEye(0.09, eyeWhite, pupil);
    head.add(hairCap, skull, brim, crown, eyeL, eyeR);

    this.group.add(this.hips, this.torso, this.armL, this.armR, head);
  }

  private makeLeg(
    x: number,
    skin: THREE.Material,
    shorts: THREE.Material,
    shoe: THREE.Material,
  ): THREE.Group {
    const leg = new THREE.Group();
    leg.position.x = x;
    const short = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.18), shorts);
    short.position.y = -0.12;
    short.castShadow = true;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.16), skin);
    shin.position.y = -0.4;
    shin.castShadow = true;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.26), shoe);
    foot.position.set(0, -0.6, 0.04);
    foot.castShadow = true;
    leg.add(short, shin, foot);
    return leg;
  }

  private makeArm(x: number, skin: THREE.Material, shirt: THREE.Material): THREE.Group {
    const arm = new THREE.Group();
    arm.position.x = x;
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.14), shirt);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.12), skin);
    forearm.position.y = -0.32;
    forearm.castShadow = true;
    arm.add(sleeve, forearm);
    return arm;
  }

  private makeEye(x: number, white: THREE.Material, pupilMat: THREE.Material): THREE.Group {
    const eye = new THREE.Group();
    eye.position.set(x, 0.02, 0.2);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), pupilMat);
    pupil.position.z = 0.035;
    eye.add(ball, pupil);
    return eye;
  }

  place(x: number, z: number, yaw: number): void {
    this.x = x;
    this.z = z;
    this.y = 0;
    this.yaw = yaw;
    this.vy = 0;
    this.airborne = false;
    this.group.position.set(x, 0, z);
    this.group.rotation.set(0, rotationYFromYaw(yaw), 0);
  }

  update(dt: number, input: InputState, world: MoveWorld, cameraYaw: number): { jumped: boolean; landed: boolean } {
    const step = Math.min(dt, 0.05);
    const coast = world.coast.query(this.x, this.z);
    const wet = coast.signed < 2.2 || inAnyPool(this.x, this.z, world.pools);
    const speedScale = wet ? 0.48 : 1;
    const maxSpeed = (input.run ? 10.2 : 4.7) * speedScale;
    const ix = input.moveX;
    const iz = input.moveZ;
    const moving = ix * ix + iz * iz > 0.04;
    const camForwardX = Math.sin(cameraYaw);
    const camForwardZ = -Math.cos(cameraYaw);
    const camRightX = Math.cos(cameraYaw);
    const camRightZ = Math.sin(cameraYaw);
    let wishX = 0;
    let wishZ = 0;
    if (moving) {
      const len = Math.hypot(ix, iz) || 1;
      wishX = ((camForwardX * iz + camRightX * ix) / len) * maxSpeed;
      wishZ = ((camForwardZ * iz + camRightZ * ix) / len) * maxSpeed;
      this.yaw = dampAngle(this.yaw, yawFromDirection(wishX, wishZ), step * 12);
    }

    this.x += (moving ? wishX : 0) * step;
    this.z += (moving ? wishZ : 0) * step;

    const resolved = world.solids.resolve(this.x, this.z, RADIUS);
    this.x = resolved.x;
    this.z = resolved.z;
    const margin = 3;
    this.x = clamp(this.x, world.bounds.minX + margin, world.bounds.maxX - margin);
    this.z = clamp(this.z, world.bounds.minZ + margin, world.bounds.maxZ - margin);
    const again = world.solids.resolve(this.x, this.z, RADIUS);
    this.x = again.x;
    this.z = again.z;

    // Far offshore, a gentle push back toward the beach.
    const water = world.coast.query(this.x, this.z);
    if (water.signed < -70) {
      this.x += water.normal[0] * step * 6;
      this.z += water.normal[1] * step * 6;
    }

    let floor = world.groundHeight?.(this.x, this.z) ?? 0.06;
    if (water.signed < 2.2) {
      const t = clamp((2.2 - water.signed) / 8, 0, 1);
      floor = -0.12 - t * 0.8;
    }
    if (inAnyPool(this.x, this.z, world.pools)) floor = Math.min(floor, world.poolFloor ?? -0.4);

    let jumped = false;
    let landed = false;
    if (input.jump && !this.airborne) {
      this.vy = wet ? 7.2 : 8.6;
      this.airborne = true;
      jumped = true;
    }
    if (this.airborne) {
      this.vy -= 26 * step;
      this.y += this.vy * step;
      if (this.y <= floor) {
        this.y = floor;
        this.vy = 0;
        this.airborne = false;
        this.squash = 0.82;
        landed = true;
      }
    } else {
      this.y += (floor - this.y) * Math.min(1, step * 8);
    }

    const horizontal = moving ? maxSpeed : 0;
    if (moving && !this.airborne) this.phase += step * horizontal * 1.35;
    const swing = Math.sin(this.phase) * (moving && !this.airborne ? Math.min(0.75, horizontal / 6) : 0);
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.85;
    this.armR.rotation.x = swing * 0.85;
    if (this.airborne) {
      this.armL.rotation.x = -0.8;
      this.armR.rotation.x = -0.8;
      this.legL.rotation.x = -0.25;
      this.legR.rotation.x = 0.15;
    }
    this.squash += (1 - this.squash) * Math.min(1, step * 8);
    const breathe = 1 + Math.sin(performance.now() / 1000 * 2) * 0.012;
    this.torso.scale.set(1, this.squash * breathe, 1);
    this.group.position.set(this.x, this.y - 0.1, this.z);
    this.group.rotation.set(moving ? 0.08 : 0, rotationYFromYaw(this.yaw), 0);
    return { jumped, landed };
  }
}
