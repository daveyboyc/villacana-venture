import { asset } from "./asset";
import kinds from "../data/kinds.json";
import type { MapObject, Skeleton, Vec2 } from "./types";

const NS = "http://www.w3.org/2000/svg";
const FLOOR_FILL = ["#d9d2c3", "#fff6d8", "#f4c98a", "#e8946a", "#d0604f"];
const EDITS_KEY = "villacana-map-edits";

/** The fixed vocabulary of object kinds, shared with the checks and the agents. */
const ICONS: Record<string, { r: number; fill: string; edge: string; label: string }> = kinds;
const UNKNOWN = { r: 0.8, fill: "#999", edge: "#333", label: "Object" };

type PhotoPin = { file: string; title: string; trust: string; x?: number; z?: number; heading?: number; taken?: string };
type Edits = { added: MapObject[]; moved: Record<string, Vec2>; removed: string[]; labels: Record<string, string> };

const svg = document.querySelector<SVGSVGElement>("#map")!;
const $ = <T extends HTMLElement>(id: string) => document.querySelector<T>(id)!;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function path(ring: Vec2[], holes: Vec2[][] = []): string {
  return [ring, ...holes].map((r) => "M" + r.map((p) => `${p[0]} ${p[1]}`).join("L") + "Z").join("");
}

function loadEdits(): Edits {
  try {
    const saved = JSON.parse(localStorage.getItem(EDITS_KEY) ?? "null") as Edits | null;
    if (saved) return { ...saved, labels: saved.labels ?? {} };
  } catch {
    // Unreadable or unavailable storage: start with no edits.
  }
  return { added: [], moved: {}, removed: [], labels: {} };
}

async function boot(): Promise<void> {
  const skeleton = (await (await fetch(asset("/map/skeleton.json"))).json()) as Skeleton;
  const ground = (await (await fetch(asset("/map/ground.json"))).json()) as Skeleton["cover"];
  const rot = skeleton.viewRotation;

  const world = el("g", { transform: `rotate(${rot})` });
  svg.append(world);

  // Ground: the classified cover, or the aerial photo it was read from.
  const image = (src: string, b: { minX: number; maxX: number; minZ: number; maxZ: number }) =>
    el("image", { href: asset(src), x: b.minX, y: b.minZ, width: b.maxX - b.minX, height: b.maxZ - b.minZ, preserveAspectRatio: "none" });
  const cover = image(skeleton.cover.image, skeleton.cover);
  const photo = image(ground.image, ground);
  photo.style.display = "none";
  world.append(cover, photo);

  // Traced open ground: the car park, its bays and planters.
  const areaFill: Record<string, string> = { car_park: "#b9b4ab", planter: "#6ea854", sea: "#3b8fc4", beach: "#e6d3a8", beach_club: "#dcc592" };
  const traced = el("g", {});
  world.append(traced);
  for (const area of skeleton.areas) {
    traced.append(el("path", { d: path(area.ring), fill: areaFill[area.kind] ?? "#ccc", stroke: "#8a8172", "stroke-width": 0.2 }));
  }
  // Surf along the waterline, the pink paseo, and Barraka's thatched parasols.
  const sea = skeleton.areas.find((area) => area.kind === "sea");
  if (sea) {
    const shore = sea.ring.slice(0, -2);
    traced.append(el("path", { d: "M" + shore.map((p) => `${p[0]} ${p[1]}`).join("L"), fill: "none", stroke: "#f4fbff", "stroke-width": 2.2, "stroke-linejoin": "round" }));
  }
  traced.append(el("path", { d: "M" + skeleton.paseo.points.map((p) => `${p[0]} ${p[1]}`).join("L"), fill: "none", stroke: "#e3a08c", "stroke-width": skeleton.paseo.width, "stroke-linejoin": "round" }));
  for (const club of skeleton.areas.filter((area) => area.kind === "beach_club")) {
    const [a, b, , d] = club.ring;
    for (let u = 0.06; u < 1; u += 0.11) {
      for (let v = 0.12; v < 1; v += 0.25) {
        const x = a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v;
        const z = a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v;
        traced.append(el("circle", { cx: x, cy: z, r: 1.5, fill: "#a8845a", stroke: "#7b6248", "stroke-width": 0.15 }));
      }
    }
  }
  for (const kerb of skeleton.kerbs) {
    traced.append(el("path", { d: "M" + kerb.map((p) => `${p[0]} ${p[1]}`).join("L"), fill: "none", stroke: "#e9e4da", "stroke-width": 0.6 }));
  }
  // Bays are 2.5 m wide and 5 m deep, marked with white lines.
  const turn = (rot * Math.PI) / 180;
  const noseTurned: Record<string, Vec2> = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
  for (const row of skeleton.parkingRows) {
    const [a, b] = row.points;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [tx, tz] = noseTurned[row.nose];
    // The nose direction is given in the turned view; turn it back into map metres.
    const nx = tx * Math.cos(-turn) - tz * Math.sin(-turn);
    const nz = tx * Math.sin(-turn) + tz * Math.cos(-turn);
    let d = "";
    for (let s = 0; s <= length + 0.01; s += 2.5) {
      const x = a[0] + ((b[0] - a[0]) * s) / length;
      const z = a[1] + ((b[1] - a[1]) * s) / length;
      d += `M${x} ${z}L${x + nx * 5} ${z + nz * 5}`;
    }
    traced.append(el("path", { d, fill: "none", stroke: "#f4f1ea", "stroke-width": 0.18 }));
  }

  // Streets: a pale band with its name along it.
  const streets = el("g", {});
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
      "pointer-events": "none",
    });
    t.textContent = text;
    return t;
  };
  const names = el("g", {});
  for (const street of skeleton.streets) {
    if (street.points) {
      const d = "M" + street.points.map((p) => `${p[0]} ${p[1]}`).join("L");
      streets.append(el("path", { d, fill: "none", stroke: "#fffdf8", "stroke-opacity": 0.55, "stroke-width": street.width ?? 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      const mid = Math.floor((street.points.length - 1) / 2);
      const [a, b] = [street.points[mid], street.points[mid + 1]];
      // Read along the lane, never upside down.
      let angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + rot;
      if (angle > 90 || angle < -90) angle += 180;
      names.append(label(street.name.replace("Calle ", "C. "), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, angle, "#3b352c"));
    } else if (street.registryPlots?.length) {
      const [x, z] = street.registryPlots[0];
      names.append(label(street.name.replace("Calle ", "C. ") + " ?", x, z, 0, "#b3261e"));
    }
  }
  world.append(streets);
  for (const place of skeleton.places) {
    // A question mark means the position was placed by eye and is unconfirmed.
    const sure = place.trust !== "approximate";
    names.append(label(sure ? place.name : `${place.name} ?`, place.at[0], place.at[1], 0, sure ? "#5d584f" : "#b3261e"));
  }
  for (const pool of skeleton.poolNames) names.append(label(pool.name, pool.at[0], pool.at[1] + 9, 0, "#0b5d86"));

  // Buildings: drawn as white roofs, or coloured by height.
  const roofs: { node: SVGPathElement; floors: number }[] = [];
  for (const b of skeleton.buildings) {
    const node = el("path", { d: path(b.ring, b.holes), "fill-rule": "evenodd", stroke: "#8a8172", "stroke-width": 0.25 });
    roofs.push({ node, floors: b.floors });
    world.append(node);
  }
  const paintRoofs = (byHeight: boolean) => {
    for (const { node, floors } of roofs) {
      const yard = floors === 0;
      node.setAttribute("fill", byHeight ? FLOOR_FILL[Math.min(floors, FLOOR_FILL.length - 1)] : yard ? "#d9a887" : "#f7f3ea");
      node.setAttribute("fill-opacity", String(!byHeight && yard ? 0.55 : 0.95));
    }
  };
  paintRoofs(false);

  for (const p of skeleton.pools) {
    world.append(el("path", { d: path(p.ring), fill: "#4fc3e8", stroke: "#f4eede", "stroke-width": 1, "stroke-linejoin": "round" }));
  }

  // Garden walls and gates are generated by rule, not surveyed.
  const walls = el("g", {});
  for (const [x, z] of skeleton.gardenWalls) walls.append(el("circle", { cx: x, cy: z, r: 0.34, fill: "#fff", stroke: "#8a8172", "stroke-width": 0.1 }));
  for (const [x, z] of skeleton.gardenGates) walls.append(el("circle", { cx: x, cy: z, r: 0.8, fill: "none", stroke: "#7a4a2a", "stroke-width": 0.3 }));
  world.append(walls);

  // Hand-placed objects, with any edits made on this device applied on top.
  const edits = loadEdits();
  const published = new Set(skeleton.props.map((o) => o.id));
  edits.added = edits.added.filter((o) => !published.has(o.id));
  const live = new Map<string, MapObject>();
  for (const o of skeleton.props) if (!edits.removed.includes(o.id)) live.set(o.id, { ...o });
  for (const o of edits.added) live.set(o.id, { ...o });
  for (const [id, [x, z]] of Object.entries(edits.moved)) {
    const o = live.get(id);
    if (o) Object.assign(o, { x, z });
  }

  const objects = el("g", {});
  world.append(objects);
  const nodes = new Map<string, SVGGElement>();
  let editing = false;
  let selected: string | null = null;

  const changeCount = () => edits.added.length + Object.keys(edits.moved).length + edits.removed.length + Object.keys(edits.labels).length;
  const save = () => {
    try {
      localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
    } catch {
      // Edits stay for this visit only.
    }
    $("#send").textContent = `Send ${changeCount()} change${changeCount() === 1 ? "" : "s"}`;
    $("#send").hidden = changeCount() === 0;
    $<HTMLButtonElement>("#undo").disabled = changeCount() === 0;
  };
  const select = (id: string | null) => {
    selected = id;
    for (const [key, node] of nodes) node.querySelector(".ring")!.setAttribute("stroke-opacity", key === id ? "1" : "0");
    $<HTMLButtonElement>("#delete").disabled = !id;
    const o = id ? live.get(id) : null;
    $("#picked").textContent = o ? `${(ICONS[o.kind] ?? UNKNOWN).label} · ${o.note ? o.note + " · " : ""}${o.evidence ?? "no evidence recorded"}` : "Tap the map to add, or drag an object to move it";
  };
  const toWorld = (e: PointerEvent): Vec2 => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(world.getScreenCTM()!.inverse());
    return [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100];
  };

  const draw = (o: MapObject) => {
    const icon = ICONS[o.kind] ?? UNKNOWN;
    const g = el("g", { transform: `translate(${o.x} ${o.z})` });
    if (o.kind === "palm" || o.kind === "yucca" || o.kind === "bird_of_paradise") {
      // Fronds: a star of leaves.
      for (let i = 0; i < 8; i++) g.append(el("ellipse", { rx: icon.r * 0.22, ry: icon.r * 0.55, cy: -icon.r * 0.5, transform: `rotate(${i * 45})`, fill: icon.fill, stroke: icon.edge, "stroke-width": 0.08 }));
    } else if (o.kind === "sun_lounger") {
      g.append(el("rect", { x: -0.3, y: -0.95, width: 0.6, height: 1.9, rx: 0.1, fill: icon.fill, stroke: icon.edge, "stroke-width": 0.08, transform: `rotate(${-rot})` }));
    } else {
      g.append(el("circle", { r: icon.r, fill: icon.fill, stroke: icon.edge, "stroke-width": Math.max(0.12, icon.r * 0.12) }));
      if (icon.r > 2) g.append(el("circle", { r: icon.r * 0.45, cx: -icon.r * 0.2, cy: -icon.r * 0.2, fill: "#ffffff", "fill-opacity": 0.18 }));
    }
    g.append(el("circle", { class: "ring", r: icon.r + 0.6, fill: "none", stroke: "#1c6fd1", "stroke-width": 0.35, "stroke-opacity": 0 }));
    const title = el("title", {});
    title.textContent = icon.label;
    g.append(title);

    let dragging = false;
    g.addEventListener("pointerdown", (e) => {
      if (!editing) return;
      e.stopPropagation();
      g.setPointerCapture(e.pointerId);
      dragging = true;
      select(o.id);
    });
    g.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      [o.x, o.z] = toWorld(e);
      g.setAttribute("transform", `translate(${o.x} ${o.z})`);
    });
    g.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      e.stopPropagation();
      dragging = false;
      const added = edits.added.find((a) => a.id === o.id);
      if (added) Object.assign(added, { x: o.x, z: o.z });
      else edits.moved[o.id] = [o.x, o.z];
      save();
    });
    nodes.set(o.id, g);
    objects.append(g);
  };
  // Big canopies underneath, small things on top.
  [...live.values()].sort((a, b) => (ICONS[b.kind] ?? UNKNOWN).r - (ICONS[a.kind] ?? UNKNOWN).r).forEach(draw);
  world.append(names);

  // Photos: a pin where each was taken and a wedge showing where it looks.
  const photos = el("g", {});
  const viewer = $<HTMLDivElement>("#viewer");
  const labelBox = $<HTMLInputElement>("#label");
  let open: { pin: PhotoPin; dot: SVGCircleElement } | null = null;
  viewer.addEventListener("click", (e) => {
    if (e.target === viewer || e.target instanceof HTMLImageElement) viewer.hidden = true;
  });
  $("#closeviewer").addEventListener("click", () => (viewer.hidden = true));
  try {
    const response = await fetch(asset("/photos-ref/manifest.json"));
    const manifest = response.ok ? ((await response.json()) as PhotoPin[]) : [];
    const labelsFile = await fetch(asset("/photos-ref/labels.json"));
    const published = labelsFile.ok ? ((await labelsFile.json()) as Record<string, string>) : {};
    const labelOf = (pin: PhotoPin) => edits.labels[pin.file] ?? published[pin.file] ?? "";
    // Labelled photos turn green, so it is easy to see which are still to do.
    const tint = (pin: PhotoPin, dot: SVGCircleElement) => dot.setAttribute("fill", labelOf(pin) ? "#2f9e44" : "#d6336c");
    $("#savelabel").addEventListener("click", () => {
      if (!open) return;
      const text = labelBox.value.trim();
      if (text === (published[open.pin.file] ?? "")) delete edits.labels[open.pin.file];
      else edits.labels[open.pin.file] = text;
      tint(open.pin, open.dot);
      save();
      viewer.hidden = true;
    });
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
      const dot = el("circle", { cx: pin.x, cy: pin.z, r: 1.4, fill: "#d6336c", stroke: "#fff", "stroke-width": 0.35 });
      tint(pin, dot);
      g.append(dot);
      // Keep the tap from panning the map or, in edit mode, adding an object.
      g.addEventListener("pointerdown", (e) => e.stopPropagation());
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        open = { pin, dot };
        viewer.querySelector("img")!.src = asset(`/photos-ref/${pin.file}`);
        viewer.querySelector("p")!.textContent = `${pin.title}${pin.taken ? " · " + pin.taken : ""}`;
        labelBox.value = labelOf(pin);
        viewer.hidden = false;
      });
      photos.append(g);
    }
  } catch {
    // No photo index published: the map works without it.
  }
  world.append(photos);

  $("#legend").innerHTML =
    `<div><i style="background:#f7f3ea"></i>House</div><div><i style="background:#d9a887"></i>Yard or patio</div>` +
    `<div><i style="background:#e3a08c"></i>Paseo</div><div><i style="background:#e6d3a8"></i>Beach</div><div><i style="background:#3b8fc4"></i>Sea</div><div><i style="background:#b9b4ab"></i>Car park</div><div><i style="background:#4fc3e8"></i>Pool</div><div><i style="background:#6ea854"></i>Lawn</div>` +
    `<div><i style="background:#3a6e3e"></i>Planting (from the aerial)</div><div><i style="background:#b2a088"></i>Stone path</div>` +
    `<div><i style="background:#3f7d45;border-radius:50%"></i>Placed tree or plant</div>` +
    `<div><i style="background:#fff;border-radius:50%"></i>Garden wall (generated)</div>` +
    `<div><i style="background:#d6336c;border-radius:50%"></i>Photo</div>` +
    `<div><i style="background:#2f9e44;border-radius:50%"></i>Photo you have labelled</div>`;

  // The turned bounding box of the area is the default view.
  const a = (rot * Math.PI) / 180;
  const pts = [...skeleton.area, ...skeleton.areas.flatMap((area) => area.ring)].map(([x, z]) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)]);
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
    const w = Math.min(Math.max(view.w * factor, 12), home.w * 2);
    const h = (w * view.h) / view.w;
    view.x += (view.w - w) * fx;
    view.y += (view.h - h) * fy;
    view.w = w;
    view.h = h;
    apply();
  };

  // One finger pans, two pinch. A touch that barely moves is a tap.
  const touches = new Map<number, { x: number; y: number }>();
  let travelled = 0;
  svg.addEventListener("pointerdown", (e) => {
    svg.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    travelled = touches.size === 1 ? 0 : Infinity;
  });
  svg.addEventListener("pointermove", (e) => {
    const prev = touches.get(e.pointerId);
    if (!prev) return;
    travelled += Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
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
  svg.addEventListener("pointerup", (e) => {
    if (!touches.delete(e.pointerId) || !editing || travelled > 8) return;
    // A tap on open map adds the chosen kind of object there.
    const [x, z] = toWorld(e);
    const o: MapObject = { id: `u${Date.now().toString(36)}`, kind: $<HTMLSelectElement>("#kind").value, x, z, evidence: "dave:map" };
    live.set(o.id, o);
    edits.added.push(o);
    draw(o);
    select(o.id);
    save();
  });
  svg.addEventListener("pointercancel", (e) => touches.delete(e.pointerId));
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.15 : 1 / 1.15);
  }, { passive: false });

  const toggle = (id: string, onChange: (on: boolean) => void) => {
    const button = $<HTMLButtonElement>(id);
    button.addEventListener("click", () => {
      const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      onChange(on);
    });
  };
  const show = (node: SVGElement | HTMLElement) => (on: boolean) => (node.style.display = on ? "" : "none");
  // Over the aerial photo, traced ground goes see-through so the two can be compared.
  toggle("#photo", (on) => {
    show(photo)(on);
    traced.setAttribute("opacity", on ? "0.35" : "1");
  });
  toggle("#streets", (on) => {
    show(streets)(on);
    show(names)(on);
  });
  toggle("#objects", (on) => {
    show(objects)(on);
    show(walls)(on);
  });
  toggle("#photos", show(photos));
  toggle("#heights", paintRoofs);
  toggle("#key", (on) => ($("#legend").hidden = !on));
  toggle("#edit", (on) => {
    editing = on;
    $("#editbar").hidden = !on;
    select(null);
  });
  $("#reset").addEventListener("click", () => {
    Object.assign(view, home);
    apply();
  });

  // Editing.
  const kind = $<HTMLSelectElement>("#kind");
  for (const [value, icon] of Object.entries(ICONS)) kind.add(new Option(icon.label, value));
  $("#delete").addEventListener("click", () => {
    if (!selected) return;
    const id = selected;
    nodes.get(id)?.remove();
    nodes.delete(id);
    live.delete(id);
    const wasAdded = edits.added.some((o) => o.id === id);
    edits.added = edits.added.filter((o) => o.id !== id);
    delete edits.moved[id];
    if (!wasAdded) edits.removed.push(id);
    select(null);
    save();
  });
  $("#undo").addEventListener("click", () => {
    if (!confirm("Discard every change you have made on this device?")) return;
    try {
      localStorage.removeItem(EDITS_KEY);
    } catch {
      // Nothing stored.
    }
    location.reload();
  });
  $("#send").addEventListener("click", async () => {
    const text = "Villacana map changes:\n" + JSON.stringify(edits);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        $("#picked").textContent = "Copied. Paste it into the chat with Claude.";
      }
    } catch {
      prompt("Copy this and paste it into the chat with Claude:", text);
    }
  });
  save();
  select(null);
}

void boot();
