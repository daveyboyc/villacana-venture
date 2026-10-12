import { asset } from "./asset";
import type { Skeleton, Vec2 } from "./types";

const NS = "http://www.w3.org/2000/svg";
const FLOOR_FILL = ["#d9d2c3", "#fff6d8", "#f4c98a", "#e8946a", "#d0604f"];
/** Outline colour says how far to trust a thing's position. */
const TRUST = { surveyed: "#3b352c", photo: "#1c6fd1", traced: "#7b3fb5", guessed: "#e07b1a", unplaced: "#b3261e" };

type PhotoPin = { file: string; title: string; trust: string; x?: number; z?: number; heading?: number; taken?: string };

const svg = document.querySelector<SVGSVGElement>("#map")!;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function path(ring: Vec2[], holes: Vec2[][] = []): string {
  return [ring, ...holes].map((r) => "M" + r.map((p) => `${p[0]} ${p[1]}`).join("L") + "Z").join("");
}

async function boot(): Promise<void> {
  const skeleton = (await (await fetch(asset("/map/skeleton.json"))).json()) as Skeleton;
  const ground = (await (await fetch(asset("/map/ground.json"))).json()) as Skeleton["cover"];

  const world = el("g", { transform: `rotate(${skeleton.viewRotation})` });
  svg.append(world);

  const image = (src: string, b: { minX: number; maxX: number; minZ: number; maxZ: number }) =>
    el("image", { href: asset(src), x: b.minX, y: b.minZ, width: b.maxX - b.minX, height: b.maxZ - b.minZ, preserveAspectRatio: "none" });
  const cover = image(skeleton.cover.image, skeleton.cover);
  cover.style.imageRendering = "pixelated";
  const photo = image(ground.image, ground);
  photo.style.display = "none";
  world.append(cover, photo);

  for (const b of skeleton.buildings) {
    world.append(
      el("path", {
        d: path(b.ring, b.holes),
        "fill-rule": "evenodd",
        fill: FLOOR_FILL[Math.min(b.floors, FLOOR_FILL.length - 1)],
        "fill-opacity": 0.92,
        stroke: "#3b352c",
        "stroke-width": 0.25,
      }),
    );
  }
  for (const p of skeleton.pools) {
    world.append(el("path", { d: path(p.ring), fill: "#4fc3e8", stroke: "#0b5d86", "stroke-width": 0.4 }));
  }

  // Streets: a pale band with its name along it.
  const streets = el("g", {});
  const rot = skeleton.viewRotation;
  const label = (text: string, x: number, z: number, angle: number, fill: string) => {
    const t = el("text", {
      x,
      y: z,
      transform: `rotate(${angle - rot} ${x} ${z})`,
      "font-size": 4.2,
      "font-weight": 700,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill,
      stroke: "#fffdf8",
      "stroke-width": 1.1,
      "paint-order": "stroke",
    });
    t.textContent = text;
    return t;
  };
  for (const street of skeleton.streets) {
    if (street.points) {
      const d = "M" + street.points.map((p) => `${p[0]} ${p[1]}`).join("L");
      streets.append(el("path", { d, fill: "none", stroke: "#fffdf8", "stroke-opacity": 0.75, "stroke-width": street.width ?? 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      streets.append(el("path", { d, fill: "none", stroke: TRUST.traced, "stroke-width": 0.35, "stroke-dasharray": "1.5 1.2" }));
      const mid = Math.floor((street.points.length - 1) / 2);
      const [a, b] = [street.points[mid], street.points[mid + 1]];
      // Read along the lane, never upside down.
      let angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + rot;
      if (angle > 90 || angle < -90) angle += 180;
      streets.append(label(street.name.replace("Calle ", "C. "), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, angle, "#3b352c"));
    } else if (street.registryPlots?.length) {
      const [x, z] = street.registryPlots[0];
      streets.append(label(street.name.replace("Calle ", "C. ") + " ?", x, z, 0, TRUST.unplaced));
    }
  }

  // Objects: garden walls and gates are generated, props are placed from photos.
  const objects = el("g", {});
  for (const [x, z] of skeleton.gardenWalls) objects.append(el("circle", { cx: x, cy: z, r: 0.34, fill: "#fff", stroke: TRUST.guessed, "stroke-width": 0.12 }));
  for (const [x, z] of skeleton.gardenGates) objects.append(el("circle", { cx: x, cy: z, r: 0.8, fill: "none", stroke: TRUST.guessed, "stroke-width": 0.25 }));
  for (const prop of skeleton.props) {
    const plant = !/pool_|life_|pump_/.test(prop.kind);
    const dot = el("circle", { cx: prop.x, cy: prop.z, r: plant ? 1.1 : 0.5, fill: plant ? "#2f7340" : "#c9d1d6", stroke: TRUST.photo, "stroke-width": 0.25 });
    const title = el("title", {});
    title.textContent = `${prop.kind.replace(/_/g, " ")} · placed from a photo`;
    dot.append(title);
    objects.append(dot);
  }

  // Photos: a pin where each was taken and a wedge showing where it looks.
  const photos = el("g", {});
  const viewer = document.querySelector<HTMLDivElement>("#viewer")!;
  viewer.addEventListener("click", () => (viewer.hidden = true));
  try {
    const response = await fetch(asset("/photos-ref/manifest.json"));
    const manifest = response.ok ? ((await response.json()) as PhotoPin[]) : [];
    for (const pin of manifest) {
      if (pin.x === undefined || pin.z === undefined) continue;
      const g = el("g", { style: "cursor:pointer" });
      if (pin.heading !== undefined) {
        const wedge = (deg: number, r: number) => {
          const a = ((deg - 90) * Math.PI) / 180;
          return `${pin.x! + Math.cos(a) * r} ${pin.z! + Math.sin(a) * r}`;
        };
        g.append(el("path", { d: `M${pin.x} ${pin.z}L${wedge(pin.heading - 28, 14)}L${wedge(pin.heading + 28, 14)}Z`, fill: "#d6336c", "fill-opacity": 0.18 }));
      }
      g.append(el("circle", { cx: pin.x, cy: pin.z, r: 1.4, fill: "#d6336c", stroke: "#fff", "stroke-width": 0.35 }));
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        viewer.querySelector("img")!.src = asset(`/photos-ref/${pin.file}`);
        viewer.querySelector("p")!.textContent = `${pin.title} · position: ${pin.trust}${pin.taken ? " · " + pin.taken : ""}`;
        viewer.hidden = false;
      });
      photos.append(g);
    }
  } catch {
    // No photo index published: the map works without it.
  }
  world.append(streets, objects, photos);

  document.querySelector("#legend")!.innerHTML =
    ["Yard / terrace", "1 floor", "2 floors", "3 floors", "4+ floors"]
      .map((label, i) => `<div><i style="background:${FLOOR_FILL[i]}"></i>${label}</div>`)
      .join("") +
    `<div><i style="background:#4fc3e8"></i>Pool</div>` +
    `<div style="margin-top:6px"><b>How sure</b></div>` +
    `<div><i style="background:#fff;border-color:${TRUST.surveyed}"></i>Surveyed (registry)</div>` +
    `<div><i style="background:#fff;border-color:${TRUST.photo}"></i>Placed from a photo</div>` +
    `<div><i style="background:#fff;border-color:${TRUST.traced}"></i>Traced by hand</div>` +
    `<div><i style="background:#fff;border-color:${TRUST.guessed}"></i>Generated by rule</div>` +
    `<div><i style="background:#d6336c"></i>Photo</div>`;

  // The turned bounding box of the area is the default view.
  const a = (skeleton.viewRotation * Math.PI) / 180;
  const pts = skeleton.area.map(([x, z]) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)]);
  const home = {
    x: Math.min(...pts.map((p) => p[0])),
    y: Math.min(...pts.map((p) => p[1])),
    w: Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])),
    h: Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])),
  };
  const view = { ...home };
  const apply = () => svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
  apply();

  const scale = () => Math.max(view.w / svg.clientWidth, view.h / svg.clientHeight);
  const zoomAt = (cx: number, cy: number, factor: number) => {
    const box = svg.getBoundingClientRect();
    const fx = (cx - box.left) / box.width;
    const fy = (cy - box.top) / box.height;
    const w = Math.min(Math.max(view.w * factor, 20), home.w * 2);
    const h = (w * view.h) / view.w;
    view.x += (view.w - w) * fx;
    view.y += (view.h - h) * fy;
    view.w = w;
    view.h = h;
    apply();
  };

  const touches = new Map<number, { x: number; y: number }>();
  svg.addEventListener("pointerdown", (e) => {
    svg.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  svg.addEventListener("pointermove", (e) => {
    const prev = touches.get(e.pointerId);
    if (!prev) return;
    if (touches.size === 1) {
      const s = scale();
      view.x -= (e.clientX - prev.x) * s;
      view.y -= (e.clientY - prev.y) * s;
      apply();
    } else if (touches.size === 2) {
      const other = [...touches.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (before > 0 && after > 0) zoomAt((e.clientX + other.x) / 2, (e.clientY + other.y) / 2, before / after);
    }
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const release = (e: PointerEvent) => touches.delete(e.pointerId);
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.15 : 1 / 1.15);
  }, { passive: false });

  const toggle = (id: string, node: SVGElement) => {
    const button = document.querySelector<HTMLButtonElement>(id)!;
    button.addEventListener("click", () => {
      const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      node.style.display = on ? "" : "none";
    });
  };
  toggle("#photo", photo);
  toggle("#cover", cover);
  toggle("#streets", streets);
  toggle("#objects", objects);
  toggle("#photos", photos);
  document.querySelector("#reset")!.addEventListener("click", () => {
    Object.assign(view, home);
    apply();
  });
}

void boot();
