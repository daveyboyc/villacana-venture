import { asset } from "./asset";
import type { Skeleton, Vec2 } from "./types";

const NS = "http://www.w3.org/2000/svg";
const FLOOR_FILL = ["#d9d2c3", "#fff6d8", "#f4c98a", "#e8946a", "#d0604f"];

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

  document.querySelector("#legend")!.innerHTML =
    ["Yard / terrace", "1 floor", "2 floors", "3 floors", "4+ floors"]
      .map((label, i) => `<div><i style="background:${FLOOR_FILL[i]}"></i>${label}</div>`)
      .join("") + `<div><i style="background:#4fc3e8"></i>Pool</div>`;

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
  document.querySelector("#reset")!.addEventListener("click", () => {
    Object.assign(view, home);
    apply();
  });
}

void boot();
