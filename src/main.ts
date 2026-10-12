import * as THREE from "three";
import { asset } from "./asset";
import { createFrames, type Frame } from "./frames";
import { clamp, dampAngle, nearestStreet, streetLabel } from "./geom";
import { Minimap } from "./minimap";
import { Player } from "./player";
import type { InputState, MapData, Skeleton } from "./types";
import { buildWorld } from "./world";

const view = document.querySelector<HTMLCanvasElement>("#view")!;
const loading = document.querySelector<HTMLElement>("#loading")!;
const loadingText = document.querySelector<HTMLElement>("#loadingText")!;
const streetEl = document.querySelector<HTMLElement>("#street")!;
const stopsEl = document.querySelector<HTMLElement>("#stops")!;
const nearbyEl = document.querySelector<HTMLElement>("#nearby")!;
const promptEl = document.querySelector<HTMLElement>("#prompt")!;
const card = document.querySelector<HTMLElement>("#card")!;
const about = document.querySelector<HTMLElement>("#about")!;
const cardImg = document.querySelector<HTMLImageElement>("#cardImg")!;
const cardEmpty = document.querySelector<HTMLElement>("#cardEmpty")!;
const cardTitle = document.querySelector<HTMLElement>("#cardTitle")!;
const cardCaption = document.querySelector<HTMLElement>("#cardCaption")!;
const cardCredit = document.querySelector<HTMLElement>("#cardCredit")!;
const cardSource = document.querySelector<HTMLAnchorElement>("#cardSource")!;
const aboutStats = document.querySelector<HTMLElement>("#aboutStats")!;
const minimapCanvas = document.querySelector<HTMLCanvasElement>("#minimap")!;
const runBtn = document.querySelector<HTMLButtonElement>("#runBtn")!;
const knob = document.querySelector<HTMLElement>("#knob")!;

const input: InputState = {
  moveX: 0,
  moveZ: 0,
  run: false,
  jump: false,
  lookDx: 0,
  lookDy: 0,
  zoom: 0,
  interact: false,
};

const keys = new Set<string>();
let runLatched = false;
let stickId: number | null = null;
let stickOrigin = { x: 0, y: 0 };
let lookId: number | null = null;
let lookLast = { x: 0, y: 0 };
let seaGain: GainNode | null = null;

void boot();

async function boot(): Promise<void> {
  try {
    const response = await fetch(asset("/map/villacana.json"));
    if (!response.ok) throw new Error("The map file did not load.");
    const map = (await response.json()) as MapData;
    const skeletonResponse = await fetch(asset("/map/skeleton.json"));
    if (!skeletonResponse.ok) throw new Error("The reference map did not load.");
    const skeleton = (await skeletonResponse.json()) as Skeleton;
    start(map, skeleton);
  } catch (error) {
    loadingText.textContent =
      error instanceof Error ? error.message : "The neighbourhood could not be opened.";
  }
}

function start(map: MapData, skeleton: Skeleton): void {
  const renderer = new THREE.WebGLRenderer({ canvas: view, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#f3ddb8", 0.00155);
  scene.background = new THREE.Color("#9fd0ea");
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.15, 2400);

  const referenceStreets = (skeleton.boundaryReference?.roads ?? []).map((road) => ({ ...road, kind: road.surface === "asphalt" ? "residential" : "footway" }));
  const world = buildWorld(scene, map, skeleton.boundaryReference);
  const player = new Player();
  scene.add(player.group);
  player.place(map.spawn.x, map.spawn.z, map.spawn.yaw);

  const minimap = new Minimap(minimapCanvas, map);
  const raycaster = new THREE.Raycaster();
  let frames: Frame[] = [];
  let camYaw = map.spawn.yaw;
  let pitch = 0.52;
  let distance = 9.4;
  let lookHold = 0;
  let snapped = false;
  const found = loadFound();

  aboutStats.textContent = `${map.meta.osmBuildings} houses traced on the map · ${map.meta.typicalHomes} typical terraces on lanes that were still empty · ${map.meta.pools} Villacana pools · ${map.meta.roads} paths. You start on ${map.spawn.street}.`;

  void createFrames(scene, map, world.coast)
    .then((loaded) => {
      frames = loaded;
      for (const frame of frames) {
        if (found.has(frame.entry.id)) {
          frame.found = true;
          frame.badge.visible = true;
        }
      }
      stopsEl.textContent = `Stops ${frames.filter((frame) => frame.found).length}/${frames.length}`;
    })
    .catch(() => {
      nearbyEl.textContent = "The photo frames did not load.";
    });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.querySelector("#aboutBtn")!.addEventListener("click", () => openAbout());
  document.querySelector("#aboutClose")!.addEventListener("click", () => closeAbout());
  document.querySelector("#cardClose")!.addEventListener("click", () => closeCard());
  document.querySelector("#respawn")!.addEventListener("click", () => {
    player.place(map.spawn.x, map.spawn.z, map.spawn.yaw);
    camYaw = map.spawn.yaw;
    closeAbout();
  });
  card.addEventListener("click", (event) => {
    if (event.target === card) closeCard();
  });
  about.addEventListener("click", (event) => {
    if (event.target === about) closeAbout();
  });

  bindInput();

  const clock = new THREE.Clock();
  function frame(): void {
    const dt = Math.min(clock.getDelta(), 0.05);
    pollKeys();
    const paused = !card.hidden || !about.hidden;
    if (paused) {
      input.moveX = 0;
      input.moveZ = 0;
      input.jump = false;
      input.interact = false;
    }

    const motion = player.update(dt, input, world, camYaw);
    if (motion.jumped) blip(520, 0.12, "square", 0.04);
    if (motion.landed) blip(180, 0.08, "sine", 0.03);
    if (input.interact && !paused) openNearestFrame(player.x, player.z);

    const moving = input.moveX * input.moveX + input.moveZ * input.moveZ > 0.04;
    let keyTurn = 0;
    if (keys.has("KeyQ")) keyTurn -= 1;
    if (keys.has("KeyR")) keyTurn += 1;
    if (input.lookDx || input.lookDy || keyTurn !== 0) lookHold = 0.9;
    else lookHold = Math.max(0, lookHold - dt);
    camYaw += keyTurn * 2.1 * dt;
    camYaw += input.lookDx * 0.0045;
    pitch = clamp(pitch + input.lookDy * 0.0035, 0.2, 1.05);
    distance = clamp(distance * (1 + input.zoom * 0.08), 4.2, 16);
    if (lookHold === 0 && moving) camYaw = dampAngle(camYaw, player.yaw, dt * 2.6);

    const target = new THREE.Vector3(player.x, player.y + 1.35, player.z);
    const hd = Math.cos(pitch) * distance;
    const desired = new THREE.Vector3(
      target.x - Math.sin(camYaw) * hd,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(camYaw) * hd,
    );
    const delta = desired.clone().sub(target);
    const len = delta.length();
    if (len > 0.01) {
      raycaster.set(target, delta.clone().normalize());
      raycaster.far = len;
      const hits = raycaster.intersectObject(world.occluders, true);
      if (hits[0] && hits[0].distance < len - 0.2) {
        const keep = Math.max(1.2, hits[0].distance - 0.4);
        desired.copy(target).add(delta.normalize().multiplyScalar(keep));
      }
    }
    desired.y = Math.max(0.55, desired.y);
    if (!snapped) {
      camera.position.copy(desired);
      snapped = true;
      loading.classList.add("done");
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-dt * 9));
    }
    camera.lookAt(target);

    world.update(clock.elapsedTime, camera.position);
    if (seaGain) {
      const closeness = clamp(1 - world.coast.query(player.x, player.z).signed / 160, 0, 1);
      seaGain.gain.value = closeness * 0.045;
    }

    const checkedStreet = nearestStreet(player.x, player.z, referenceStreets);
    const street = checkedStreet && checkedStreet.distance <= checkedStreet.width / 2 + 2
      ? checkedStreet : nearestStreet(player.x, player.z, map.roads);
    streetEl.textContent = streetLabel(street);
    updatePrompt(player.x, player.z);
    minimap.draw(
      player.x,
      player.z,
      player.yaw,
      frames.map((frame) => ({ x: frame.x, z: frame.z, found: frame.found })),
    );
    for (const frame of frames) frame.badge.rotation.y += dt * 1.4;

    input.jump = false;
    input.interact = false;
    input.lookDx = 0;
    input.lookDy = 0;
    input.zoom = 0;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function openNearestFrame(x: number, z: number): void {
    const frame = nearestFrame(x, z, 3.1);
    if (!frame) return;
    showFrame(frame);
  }

  function nearestFrame(x: number, z: number, max: number): Frame | null {
    let best: Frame | null = null;
    let bestD = max;
    for (const frame of frames) {
      const d = Math.hypot(frame.x - x, frame.z - z);
      if (d < bestD) {
        best = frame;
        bestD = d;
      }
    }
    return best;
  }

  function updatePrompt(x: number, z: number): void {
    const close = nearestFrame(x, z, 3.1);
    promptEl.hidden = !close || !card.hidden;
    let note = "";
    if (!close) {
      let best: Frame | null = null;
      let bestD = 42;
      for (const frame of frames) {
        const d = Math.hypot(frame.x - x, frame.z - z);
        if (d < bestD) {
          best = frame;
          bestD = d;
        }
      }
      if (best) note = `${best.entry.title} · ${Math.round(bestD)} m`;
    }
    nearbyEl.textContent = note;
  }

  function showFrame(frame: Frame): void {
    frame.found = true;
    frame.badge.visible = true;
    found.add(frame.entry.id);
    saveFound(found);
    stopsEl.textContent = `Stops ${frames.filter((item) => item.found).length}/${frames.length}`;
    cardTitle.textContent = frame.entry.title;
    cardCaption.textContent = frame.entry.caption;
    cardCredit.textContent = frame.entry.credit ?? "";
    if (frame.entry.source) {
      cardSource.href = frame.entry.source;
      cardSource.textContent = "Source photograph";
      cardSource.hidden = false;
    } else {
      cardSource.hidden = true;
    }
    if (frame.entry.image) {
      cardImg.src = asset(frame.entry.image);
      cardImg.alt = frame.entry.title;
      cardImg.hidden = false;
      cardEmpty.hidden = true;
    } else {
      cardImg.hidden = true;
      cardEmpty.hidden = false;
      const file = frame.entry.suggest ?? `${frame.entry.id}.jpg`;
      cardEmpty.querySelector("p")!.textContent =
        `Add your picture as public/photos/${file}, then set "image" to "/photos/${file}" in public/photos/album.json.`;
    }
    card.hidden = false;
    blip(660, 0.16, "sine", 0.05);
    window.setTimeout(() => blip(880, 0.18, "sine", 0.04), 90);
  }
}

function openAbout(): void {
  about.hidden = false;
}

function closeAbout(): void {
  about.hidden = true;
}

function closeCard(): void {
  card.hidden = true;
}

function bindInput(): void {
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code.startsWith("Arrow")) event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    ensureAudio();
    if (event.code === "Space") input.jump = true;
    if (event.code === "KeyE") input.interact = true;
    if (event.code === "Escape") {
      closeCard();
      closeAbout();
    }
    if (event.code === "KeyH") {
      if (about.hidden) openAbout();
      else closeAbout();
    }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => keys.clear());

  view.addEventListener("pointerdown", (event) => {
    ensureAudio();
    if (event.pointerType === "touch") {
      if (event.clientX < window.innerWidth * 0.42) beginStick(event);
      else beginLook(event);
      return;
    }
    view.setPointerCapture(event.pointerId);
    lookId = event.pointerId;
    lookLast = { x: event.clientX, y: event.clientY };
  });
  view.addEventListener("pointermove", (event) => {
    if (event.pointerId === stickId) moveStick(event);
    else if (event.pointerId === lookId) {
      const dx = event.movementX || event.clientX - lookLast.x;
      const dy = event.movementY || event.clientY - lookLast.y;
      input.lookDx += dx;
      input.lookDy += dy;
      lookLast = { x: event.clientX, y: event.clientY };
    }
  });
  const endPointer = (event: PointerEvent) => {
    if (event.pointerId === stickId) endStick();
    if (event.pointerId === lookId) lookId = null;
  };
  view.addEventListener("pointerup", endPointer);
  view.addEventListener("pointercancel", endPointer);
  view.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      input.zoom += Math.sign(event.deltaY);
    },
    { passive: false },
  );

  const stick = document.querySelector<HTMLElement>("#stick")!;
  stick.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    beginStick(event);
  });
  stick.addEventListener("pointermove", (event) => {
    if (event.pointerId === stickId) moveStick(event);
  });
  stick.addEventListener("pointerup", endStick);
  stick.addEventListener("pointercancel", endStick);

  document.querySelector("#jumpBtn")!.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureAudio();
    input.jump = true;
  });
  runBtn.addEventListener("click", () => {
    runLatched = !runLatched;
    runBtn.classList.toggle("on", runLatched);
  });
  promptEl.addEventListener("click", () => {
    input.interact = true;
  });
}

function beginLook(event: PointerEvent): void {
  lookId = event.pointerId;
  lookLast = { x: event.clientX, y: event.clientY };
  view.setPointerCapture(event.pointerId);
}

function beginStick(event: PointerEvent): void {
  stickId = event.pointerId;
  stickOrigin = { x: event.clientX, y: event.clientY };
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function moveStick(event: PointerEvent): void {
  const dx = event.clientX - stickOrigin.x;
  const dy = event.clientY - stickOrigin.y;
  const max = 46;
  const len = Math.hypot(dx, dy) || 1;
  const scale = Math.min(max, len) / len;
  const sx = dx * scale;
  const sy = dy * scale;
  knob.style.left = `${32 + sx * 0.55}px`;
  knob.style.top = `${32 + sy * 0.55}px`;
  input.moveX = clamp(sx / max, -1, 1);
  input.moveZ = clamp(-sy / max, -1, 1);
}

function endStick(): void {
  stickId = null;
  input.moveX = 0;
  input.moveZ = 0;
  knob.style.left = "32px";
  knob.style.top = "32px";
}

function pollKeys(): void {
  if (stickId !== null) {
    input.run = runLatched;
    return;
  }
  const forward = keys.has("KeyW") || keys.has("ArrowUp");
  const back = keys.has("KeyS") || keys.has("ArrowDown");
  const left = keys.has("KeyA") || keys.has("ArrowLeft");
  const right = keys.has("KeyD") || keys.has("ArrowRight");
  input.moveX = (right ? 1 : 0) - (left ? 1 : 0);
  input.moveZ = (forward ? 1 : 0) - (back ? 1 : 0);
  input.run = runLatched || keys.has("ShiftLeft") || keys.has("ShiftRight");
}

function loadFound(): Set<string> {
  try {
    const raw = localStorage.getItem("villacana-roam-stops");
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveFound(found: Set<string>): void {
  try {
    localStorage.setItem("villacana-roam-stops", JSON.stringify([...found]));
  } catch {
    // Private mode can refuse storage. The stroll still works.
  }
}

function ensureAudio(): void {
  if (seaGain) return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  void ctx.resume();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.96 + white * 0.04;
    data[i] = last * 2.4;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 640;
  seaGain = ctx.createGain();
  seaGain.gain.value = 0;
  source.connect(filter).connect(seaGain).connect(ctx.destination);
  source.start();
  (window as unknown as { __villacanaAudio?: AudioContext }).__villacanaAudio = ctx;
}

function blip(freq: number, dur: number, type: OscillatorType, gainValue: number): void {
  const ctx = (window as unknown as { __villacanaAudio?: AudioContext }).__villacanaAudio;
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}
