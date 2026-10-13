import { closestOnSegment, pointInRing } from "./geom";
import {cervantesPatioWalls,cervantesWallOpenings,inCervantesWallReview} from "./cervantes-walls";
import {daliThresholdZones,daliThresholdKerbs,daliParkingApron,daliPrivateEdge,DALI_THRESHOLD_COLORS,daliBayStripeParts} from "./dali-threshold";
import {frontageRegions,frontageBorders,FRONTAGE_COLORS,inReviewedFrontage} from "./frontages";
import { mapLabels, referenceEditor } from "./references";
import { asset } from "./asset";
import kinds from "../data/kinds.json";
import {lowerPoolRing,poolAccess} from "./pool-levels";
import type { MapObject, Skeleton, Vec2 } from "./types";

const NS = "http://www.w3.org/2000/svg";
const FLOOR_FILL = ["#d9d2c3", "#fff6d8", "#f4c98a", "#e8946a", "#d0604f"];
const EDITS_KEY = "villacana-map-edits";

/** The fixed vocabulary of object kinds, shared with the checks and the agents. */
const ICONS: Record<string, { r: number; fill: string; edge: string; label: string }> = kinds;
const UNKNOWN = { r: 0.8, fill: "#999", edge: "#333", label: "Object" };

type PhotoPin = { file: string; title: string; trust: string; x?: number; z?: number; heading?: number; accuracy?: number; taken?: string; observation?: string };
type PhotoAssignment={file:string;status:string;reasons:string[];nearby:{id:string;name:string;kind:string;gap:number}[];citedBy:string[];geometryReview:string};
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
  const frontages=el("g",{id:"frontage-divisions"});
  for(const r of frontageRegions) {const node=el("path",{d:path(r.ring),fill:FRONTAGE_COLORS[r.kind],"fill-opacity":.85,stroke:r.kind==="lawn"?"#fffdf3":"#786657","stroke-width":.16,"data-frontage-id":r.id});const title=el("title",{});title.textContent=`${r.name} · ${r.trust} · ${r.evidence.join(", ")}`;node.append(title);frontages.append(node);}
  for(const border of frontageBorders)frontages.append(el("path",{d:"M"+border.points.map(p=>p.join(" ")).join("L"),fill:"none",stroke:"#fffdf3","stroke-width":border.width}));
  const patioWalls=el("g",{id:"cervantes-patio-walls"});
  for(const wall of cervantesPatioWalls) {
    const node=el("path",{d:"M"+wall.points.map(p=>p.join(" ")).join("L"),fill:"none",stroke:"#fffdf5","stroke-width":wall.thickness,"data-wall-id":wall.id});
    const title=el("title",{});title.textContent=`${wall.name}: ${wall.trust}`;node.append(title);patioWalls.append(node);
  }
  for(const opening of cervantesWallOpenings){const node=el("path",{d:path(opening.ring),fill:"none",stroke:"#4c816b","stroke-width":.08,"stroke-dasharray":".25 .15"});const title=el("title",{});title.textContent=`Kept open: ${opening.name}`;node.append(title);patioWalls.append(node);}
  frontages.append(patioWalls);
  world.append(frontages);
  const levels=el("g",{id:"main-pool-levels"});
  levels.append(el("path",{d:path(lowerPoolRing),fill:"#7dcbd1","fill-opacity":0.12,stroke:"#596d78","stroke-width":0.4,"stroke-dasharray":"1 1"}));
  for(const access of poolAccess) {
    levels.append(el("path",{d:"M"+access.points.map(p=>p.join(" ")).join("L"),fill:"none",stroke:access.kind==="steps"?"#fff7e7":"#c78667","stroke-width":access.width}));
    if(access.kind==="steps") {const [a,b]=access.points,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);for(let i=0;i<=access.count;i++){const x=a[0]+dx*i/access.count,z=a[1]+dz*i/access.count,nx=dz/length*access.width/2,nz=-dx/length*access.width/2;levels.append(el("path",{d:`M${x+nx} ${z+nz}L${x-nx} ${z-nz}`,stroke:"#84766c","stroke-width":0.1}));}}
  }
  world.append(levels);

  const seafront = el("g", { id: "seafront-outlines" });
  const seafrontNames = el("g", {});
  if (skeleton.seafront) {
    const sf = skeleton.seafront;
    for (const [area, fill, stroke] of [[sf.sea, "#62b6d1", "#247c9b"], [sf.beach, "#e4cc9b", "#b59868"]] as const) {
      seafront.append(el("path", { d: path(area.ring), fill, stroke, "stroke-width": 0.5 }));
    }
    const line = (points: Vec2[]) => "M" + points.map((p) => `${p[0]} ${p[1]}`).join("L");
    seafront.append(el("path", { d: line(sf.coast), fill: "none", stroke: "#f5ffff", "stroke-width": 1.1 }));
    seafront.append(el("path", { d: line(sf.paseo.points), fill: "none", stroke: "#9c644d", "stroke-width": sf.paseo.width + 0.8, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    seafront.append(el("path", { d: line(sf.paseo.points), fill: "none", stroke: "#dfaa86", "stroke-width": sf.paseo.width, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    seafront.append(el("path", { d: path(sf.restaurant.terrace), fill: "#d7bca2", stroke: "#864b40", "stroke-width": 0.5, "stroke-dasharray": "1.5 1" }));
  }
  world.append(seafront);

  // Traced open ground: the car park, its bays and planters.
  const areaFill: Record<string, string> = { car_park: "#b9b4ab", planter: "#6ea854" };
  const traced = el("g", {});
  world.append(traced);
  for (const area of skeleton.areas) {
    traced.append(el("path", { d: path(area.ring), fill: areaFill[area.kind] ?? "#ccc", stroke: "#8a8172", "stroke-width": 0.2 }));
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

  const boundary = el("g", { id: "boundary-reference" });
  if (skeleton.boundaryReference) {
    const ref = skeleton.boundaryReference;
    boundary.append(el("path", { d: path(ref.parking.ring), fill: "#969a99", stroke: "#f4f0e5", "stroke-width": 0.3 }));
    const line = (points: Vec2[]) => "M" + points.map((p) => `${p[0]} ${p[1]}`).join("L");
    for (const fence of ref.barriers) {
      const node = el("path", { d: line(fence.points), fill: "none", stroke: "#743e36", "stroke-width": 0.9, "stroke-dasharray": "1.5 0.5" });
      const title = el("title", {}); title.textContent = `${fence.name}: solid game boundary`; node.append(title); boundary.append(node);
    }
    const bays = ref.parking;
    for (let i = 0; i < bays.bayLine.length - 1; i++) {
      const a = bays.bayLine[i], b = bays.bayLine[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
      for (let at = 0; at < length; at += bays.spacing) {
        const x = a[0] + dx / length * at, z = a[1] + dz / length * at;
        if (!pointInRing(x + dz / length * bays.depth / 2, z - dx / length * bays.depth / 2, bays.ring)) continue;
        for(const [p,q] of daliBayStripeParts([x,z],[x+dz/length*bays.depth,z-dx/length*bays.depth]))
          boundary.append(el("path", { d: `M${p.join(" ")}L${q.join(" ")}`, fill: "none", stroke: "#fff", "stroke-width": 0.15 }));

      }
    }
  }
  world.append(boundary);

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
      streets.append(el("path", { d, fill: "none", stroke: skeleton.boundaryReference?.roads.find((r) => r.name === street.name)?.surface === "asphalt" ? "#7f8384" : "#fffdf8", "stroke-opacity": 0.75, "stroke-width": street.width ?? 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
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
  for (const ramp of skeleton.boundaryReference?.ramps ?? []) {
    const [a,b]=ramp.points;
    const node=el("path",{d:`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`,fill:"none",stroke:"#c48061","stroke-width":ramp.width});
    const title=el("title",{});title.textContent=`${ramp.name}: ${ramp.trust}`;node.append(title);streets.append(node);
    names.append(label("Ramp",(a[0]+b[0])/2,(a[1]+b[1])/2-4,0,"#985339"));
  }
  world.append(streets);
  const threshold=el("g",{id:"dali-cervantes-threshold"});
  threshold.append(el("path",{d:path(daliParkingApron),fill:DALI_THRESHOLD_COLORS.bays,"fill-opacity":.35}));
  for(const zone of daliThresholdZones) {
    const node=el("path",{d:path(zone.ring),fill:DALI_THRESHOLD_COLORS[zone.kind],"fill-opacity":zone.kind==="bays"?.55:.95,"data-threshold-id":zone.id});
    const title=el("title",{});title.textContent=`${zone.name} · ${zone.trust} · ${zone.evidence.join(", ")}`;node.append(title);threshold.append(node);
  }
  for(const k of daliThresholdKerbs)threshold.append(el("path",{d:"M"+k.points.map(p=>p.join(" ")).join("L"),fill:"none",stroke:"#fffdf3","stroke-width":k.width}));
  threshold.append(el("path",{d:"M"+daliPrivateEdge.map(p=>p.join(" ")).join("L"),fill:"none",stroke:"#8b5742","stroke-width":.18,"stroke-dasharray":".5 .3"}));
  world.append(threshold);
  for (const area of skeleton.areas) {
    if (!area.name || (area.kind === "car_park" && skeleton.boundaryReference?.carParks?.length)) continue;
    const cx = area.ring.reduce((sum, p) => sum + p[0], 0) / area.ring.length;
    const cz = area.ring.reduce((sum, p) => sum + p[1], 0) / area.ring.length;
    names.append(label(area.name, cx + 9, cz, 0, "#5d584f"));
  }
  for (const place of skeleton.places) {
    // A question mark means the position was placed by eye and is unconfirmed.
    const sure = place.trust !== "approximate";
    names.append(label(sure ? place.name : `${place.name} ?`, place.at[0], place.at[1], 0, sure ? "#5d584f" : "#b3261e"));
  }
  if (skeleton.boundaryReference) {
    const ref = skeleton.boundaryReference;
    const p = ref.walkAnchor;
    if (ref.carParks?.length) {
      for (const park of ref.carParks) {
        const [x, z] = park.at;
        names.append(label(park.name, park.id === "dali" ? x - 13 : x + 8, z - 7, park.id === "dali" ? 90 : 0, "#4b5351"));
        const [ex, ez] = park.entrance;
        names.append(el("circle", { cx: ex, cy: ez, r: 1.4, fill: "#1c6fd1", stroke: "#fff", "stroke-width": 0.4, "pointer-events": "none" }));
      }
    } else names.append(label("Parking", p[0] + 7, p[1] - 3, 0, "#4b5351"));
    const fence = ref.barriers[0];
    const mid = fence.points[Math.floor(fence.points.length / 2)];
    names.append(label("Fence · game limit", mid[0] - 8, mid[1], 90, "#743e36"));
  }
  for (const pool of skeleton.poolNames) names.append(label(pool.name, pool.at[0], pool.at[1] + 9, 0, "#0b5d86"));

  // Buildings: drawn as white roofs, or coloured by height.
  const roofs: { node: SVGPathElement; floors: number }[] = [];
  for (const b of skeleton.buildings) {
    const node = el("path", { d: path(b.ring, b.holes), "fill-rule": "evenodd", stroke: "#8a8172", "stroke-width": 0.25 });
    roofs.push({ node, floors: b.floors });
    world.append(node);
    // Covered walk-throughs: dashed brown if confirmed by a photo, dashed orange if only likely.
    if (b.passage) world.append(el("path", { d: path(b.ring), fill: "#c98463", "fill-opacity": 0.45, stroke: b.passage.trust === "photo" ? "#7a4a2a" : "#e8842b", "stroke-width": 0.5, "stroke-dasharray": "1 0.6" }));
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
  for (const [x, z] of skeleton.gardenWalls.filter(([x,z])=>!inReviewedFrontage(x,z) && !inCervantesWallReview(x,z))) walls.append(el("circle", { cx: x, cy: z, r: 0.34, fill: "#fff", stroke: "#8a8172", "stroke-width": 0.1 }));
  for (const [x, z] of skeleton.gardenGates.filter(([x,z])=>!inReviewedFrontage(x,z) && !inCervantesWallReview(x,z))) walls.append(el("circle", { cx: x, cy: z, r: 0.8, fill: "none", stroke: "#7a4a2a", "stroke-width": 0.3 }));
  // The south lawn's seaward wall and fence: one unbroken line, no gate.
  if (skeleton.seaWall) {
    const line = (points: Vec2[]) => "M" + points.map((p) => `${p[0]} ${p[1]}`).join("L");
    walls.append(el("path", { d: line(skeleton.seaWall.points), fill: "none", stroke: "#26352c", "stroke-width": 0.9, "stroke-linejoin": "round" }));
    walls.append(el("path", { d: line(skeleton.seaWall.points), fill: "none", stroke: "#fff", "stroke-width": 0.45, "stroke-linejoin": "round" }));
  }
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
    let persisted = false;
    try {
      localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
      persisted = true;
    } catch {
      // Edits stay for this visit only.
    }
    $("#send").textContent = `Send ${changeCount()} change${changeCount() === 1 ? "" : "s"}`;
    $("#send").hidden = changeCount() === 0;
    $<HTMLButtonElement>("#undo").disabled = changeCount() === 0;
    return persisted;
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
  const photoEvidence=el("g",{id:"photo-evidence-layer",style:"display:none;pointer-events:none"});
  const selectedEvidence=el("g",{id:"selected-photo-context"});
  photoEvidence.append(selectedEvidence);world.append(photoEvidence);
  const photos = el("g", {});
  const viewer = $<HTMLDivElement>("#viewer");
  const labelBox = $<HTMLInputElement>("#label");
  const labelStatus = $("#labelstatus");
  const observation=document.createElement("p");observation.id="photo-observation";viewer.querySelector("p")!.after(observation);
  const evidenceDescription=document.createElement("p");evidenceDescription.id="photo-association";observation.after(evidenceDescription);
  labelBox.addEventListener("input", () => {
    labelStatus.textContent = "Unsaved label. Tap Save or press Done to keep it.";
  });
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
    const assignmentData=await fetch(asset("/photos-ref/assignments.json")).then(r=>r.ok?r.json():{photos:[]}).catch(()=>({photos:[]}));
    const assignments=new Map<string,PhotoAssignment>((assignmentData.photos as PhotoAssignment[]).map(a=>[a.file,a]));
    const photoViews: { pin: PhotoPin; dot: SVGCircleElement }[] = [];
    const labelOf = (pin: PhotoPin) => edits.labels[pin.file] ?? published[pin.file] ?? "";
    const showPhoto = (photo: { pin: PhotoPin; dot: SVGCircleElement }) => {
      open = photo;
      const pin = photo.pin;
      viewer.querySelector("img")!.src = asset(`/photos-ref/${pin.file}`);
      viewer.querySelector("img")!.alt = pin.title;
      viewer.querySelector("p")!.textContent = `${pin.title} · ${pin.file}${pin.taken ? " · " + pin.taken : ""}${pin.accuracy ? " · GPS ±" + pin.accuracy + " m" : ""}`;
      observation.textContent=pin.observation??"";observation.hidden=!pin.observation;
      const association=assignments.get(pin.file);
      evidenceDescription.textContent=association?`${association.status==="suggested"?"Suggested map context":"Map association needs checking"}: ${[...new Set(association.nearby.map(q=>q.name))].join(" · ")||"No nearby mapped area"}. ${association.status==="needs-review"?association.reasons.join("; ")+". ":""}${association.citedBy.length?`Cited by ${association.citedBy.length} model features; citation does not establish visual accuracy. `:""}Camera pin stays at its recorded position. ${association.geometryReview}.`:"";
      evidenceDescription.hidden=!association;
      for(const circle of photoEvidence.querySelectorAll("[data-uncertainty-photo]"))circle.setAttribute("display",circle.getAttribute("data-uncertainty-photo")===pin.file?"":"none");
      for(const group of photos.querySelectorAll("[data-photo-file]"))group.classList.toggle("selected-photo",group.getAttribute("data-photo-file")===pin.file);
      selectedEvidence.replaceChildren();
      if(association&&pin.x!==undefined&&pin.z!==undefined)for(const context of association.nearby) {
        if(context.kind!=="street")continue;
        const road=skeleton.boundaryReference?.roads.find(r=>`street:${r.id}`===context.id);if(!road)continue;
        selectedEvidence.append(el("path",{d:"M"+road.points.map(p=>p.join(" ")).join("L"),fill:"none",stroke:"#db9c24","stroke-width":road.width+.4,"stroke-opacity":.5}));
        const hit=road.points.slice(1).map((p,i)=>closestOnSegment(pin.x!,pin.z!,...road.points[i],...p)).sort((a,b)=>a.d-b.d)[0];
        selectedEvidence.append(el("path",{d:`M${pin.x} ${pin.z}L${hit.x} ${hit.z}`,fill:"none",stroke:"#805614","stroke-width":.3,"stroke-dasharray":".7 .5"}));
      }
      labelBox.value = labelOf(pin);
      labelStatus.textContent = "Tap Save to keep this label on this browser. Use Send changes to share it.";
      const index = photoViews.indexOf(photo);
      $<HTMLButtonElement>("#previousphoto").disabled = index <= 0;
      $<HTMLButtonElement>("#nextphoto").disabled = index >= photoViews.length - 1;
      viewer.hidden = false;
    };
    for (const [id, step] of [["#previousphoto", -1], ["#nextphoto", 1]] as const) {
      $(id).addEventListener("click", () => {
        if (!open) return;
        const next = photoViews[photoViews.indexOf(open) + step];
        if (next) showPhoto(next);
      });
    }
    // Labelled photos turn green, so it is easy to see which are still to do.
    const tint = (pin: PhotoPin, dot: SVGCircleElement) => dot.setAttribute("fill", labelOf(pin) ? "#2f9e44" : "#d6336c");
    $("#labelrow").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!open) return;
      const text = labelBox.value.trim();
      if (text === (published[open.pin.file] ?? "")) delete edits.labels[open.pin.file];
      else edits.labels[open.pin.file] = text;
      tint(open.pin, open.dot);
      const persisted = save();
      labelBox.value = text;
      labelBox.blur();
      labelStatus.textContent = persisted
        ? "Saved on this browser. Close the photo and use Send changes to share your labels."
        : "This browser could not save your label. It is kept for this visit only. Close the photo and use Send changes before leaving.";
    });
    for (const pin of manifest.sort((a, b) => a.file.localeCompare(b.file))) {
      if (pin.x === undefined || pin.z === undefined) continue;
      const association=assignments.get(pin.file);
      const radius=pin.accuracy??10;
      const circle=el("circle",{cx:pin.x,cy:pin.z,r:radius,fill:association?.status==="suggested"?"#4389ae":"#d99b2b","fill-opacity":.08,stroke:association?.status==="suggested"?"#4389ae":"#b27c19","stroke-width":.18,"stroke-dasharray":pin.accuracy?"1 .4":".3 .6","data-uncertainty-photo":pin.file,display:"none"});
      const uncertaintyTitle=el("title",{});uncertaintyTitle.textContent=pin.accuracy?`${pin.file}: reported GPS ±${pin.accuracy} m`: `${pin.file}: uncertainty unknown; 10 m review search radius`;
      circle.append(uncertaintyTitle);photoEvidence.prepend(circle);
      const g = el("g", { style: "cursor:pointer", "data-photo-file":pin.file });
      const photoTitle=el("title",{});photoTitle.textContent=labelOf(pin)||pin.title;g.append(photoTitle);
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
      const photoView = { pin, dot };
      photoViews.push(photoView);
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        showPhoto(photoView);
      });
      photos.append(g);
    }
  } catch {
    // No photo index published: the map works without it.
  }
  world.append(photos);
  if (skeleton.seafront) {
    const sf = skeleton.seafront;
    const centreOf = (ring: Vec2[]) => ring.reduce(([x, z], p) => [x + p[0] / ring.length, z + p[1] / ring.length], [0, 0] as Vec2);
    const [rx, rz] = centreOf(sf.restaurant.ring);
    seafrontNames.append(el("path", { d: path(sf.restaurant.ring), fill: "#a68a60", "fill-opacity": 0.55, stroke: "#763e32", "stroke-width": 0.7 }));
    seafrontNames.append(label(sf.restaurant.name, rx, rz, 0, "#763e32"));
    const [vx, vz] = centreOf(sf.viewBounds);
    // Labels stay within the local planning window even though natural outlines
    // continue beyond it. The lower third is the sea, the middle is the beach.
    const toMap = (dx: number, dz: number): Vec2 => [vx + dx * Math.cos(turn) + dz * Math.sin(turn), vz - dx * Math.sin(turn) + dz * Math.cos(turn)];
    const [sx, sz] = toMap(0, 55);
    const [bx, bz] = toMap(-10, -2);
    seafrontNames.append(label(sf.sea.name, sx, sz, 0, "#235d72"));
    seafrontNames.append(label(sf.beach.name, bx, bz, 0, "#235d72"));
    const mid = Math.floor(sf.paseo.points.length / 2);
    const [px, pz] = sf.paseo.points[mid];
    seafrontNames.append(label(sf.paseo.name, px, pz - 5, 0, "#864b40"));
    world.append(seafrontNames);
  }


  $("#legend").innerHTML =
    `<div><i style="background:#f7f3ea"></i>House</div><div><i style="background:#d9a887"></i>Yard or patio</div>` +
    `<div><i style="background:#b9b4ab"></i>Car park</div><div><i style="background:#4fc3e8"></i>Pool</div><div><i style="background:#6ea854"></i>Lawn</div>` +
    `<div><i style="background:#3a6e3e"></i>Planting (from the aerial)</div><div><i style="background:#b2a088"></i>Stone path</div>` +
    `<div><i style="background:#3f7d45;border-radius:50%"></i>Placed tree or plant</div>` +
    `<div><i style="background:#fff;border-radius:50%"></i>Garden wall (generated)</div>` +
    `<div><i style="background:#d6336c;border-radius:50%"></i>Photo camera pin</div><div><i style="background:#4389ae;border-radius:50%"></i>Suggested context · GPS range</div><div><i style="background:#d99b2b;border-radius:50%"></i>Association needs review · unknown range is dashed</div>` +
    `<div><i style="background:#2f9e44;border-radius:50%"></i>Photo you have labelled</div>` +
    `<div><i style="background:#dfaa86"></i>Paseo</div><div><i style="background:#e4cc9b"></i>Beach</div>` +
    `<div><i style="background:#62b6d1"></i>Sea</div><div><i style="background:#a68a60"></i>Barraka Beach</div>` +
    `<div><i style="background:#d9b393"></i>Photo-backed front patio</div><div><i style="background:#bba58b"></i>Door approach</div><div><i style="background:#fffdf3"></i>White lawn edging</div><div><i style="background:#fffdf5"></i>White patio walls · Cervantes test</div>` +
    `<div><i style="background:#858a88"></i>Dalí parking bays</div><div><i style="background:#718658"></i>Dalí grass strip</div><div><i style="background:#c7977c"></i>Shared house-side footpath</div><div><i style="background:#d8ad91"></i>Tiled Cervantes crossing</div><div><i style="background:#8b5742"></i>Private frontage starts · dashed edge</div><div><i style="background:#743e36"></i>Fence · solid game limit</div>`;

  // The turned bounding box of the area is the default view.
  const a = (rot * Math.PI) / 180;
  const extent = [...skeleton.area, ...(skeleton.seafront?.viewBounds ?? []), ...(skeleton.boundaryReference?.carParks?.flatMap(p=>p.ring) ?? []), ...(skeleton.boundaryReference?.roads.flatMap(r=>r.points) ?? [])];
  const pts = extent.map(([x, z]) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)]);
  const home = {
    x: Math.min(...pts.map((p) => p[0])),
    y: Math.min(...pts.map((p) => p[1])),
    w: Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])),
    h: Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])),
  };
  // Leave room for the controls and names at the northern/southern edges.
  const padding=home.h*0.15;home.x-=padding;home.y-=padding;home.w+=padding*2;home.h+=padding*2;
  const view = { ...home };
  let rotation=rot;
  const apply = () => {
    svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
    world.setAttribute("transform",`rotate(${rotation})`);
    $("#map-bearing").textContent=`${Math.round(rotation)}°`;
  };
  apply();
  $("#map-frontages").addEventListener("click",()=>{
    rotation=rot;photos.style.display="none";photoEvidence.style.display="none";$("#photo-evidence").setAttribute("aria-pressed","false");photos.classList.remove("evidence-mode");$("#photos").setAttribute("aria-pressed","false");
    const points=[...frontageRegions,...daliThresholdZones].flatMap(r=>r.ring).map(([x,z])=>[x*Math.cos(a)-z*Math.sin(a),x*Math.sin(a)+z*Math.cos(a)]);
    const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
    const width=Math.max(maxX-minX+10,(maxY-minY+20)*innerWidth/innerHeight),height=width*innerHeight/innerWidth;
    view.x=(minX+maxX-width)/2;view.y=(minY+maxY-height)/2;view.w=width;view.h=height;apply();
  });

  const scale = () => Math.max(view.w / svg.clientWidth, view.h / svg.clientHeight);
  const zoomAt = (cx: number, cy: number, factor: number) => {
    const anchor=new DOMPoint(cx,cy).matrixTransform(svg.getScreenCTM()!.inverse());
    const fx=(anchor.x-view.x)/view.w, fy=(anchor.y-view.y)/view.h;
    const w = Math.min(Math.max(view.w * factor, 12), home.w * 2);
    const h = (w * view.h) / view.w;
    view.x += (view.w - w) * fx;
    view.y += (view.h - h) * fy;
    view.w = w;
    view.h = h;
    apply();
  };

  const rotateBy=(degrees:number)=>{
    const delta=degrees*Math.PI/180,cx=view.x+view.w/2,cy=view.y+view.h/2;
    view.x=cx*Math.cos(delta)-cy*Math.sin(delta)-view.w/2;
    view.y=cx*Math.sin(delta)+cy*Math.cos(delta)-view.h/2;
    rotation=((rotation+degrees)%360+360)%360;apply();
  };
  $("#map-zoom-in").addEventListener("click",()=>zoomAt(innerWidth/2,innerHeight/2,1/1.3));
  $("#map-zoom-out").addEventListener("click",()=>zoomAt(innerWidth/2,innerHeight/2,1.3));
  $("#map-left").addEventListener("click",()=>rotateBy(-15));
  $("#map-right").addEventListener("click",()=>rotateBy(15));
  $("#map-north").addEventListener("click",()=>rotateBy(-rotation));
  // Screen-sized labels remain readable at every zoom and rotation.
  names.querySelectorAll("text").forEach(t=>t.style.display="none");
  seafrontNames.querySelectorAll("text").forEach(t=>t.style.display="none");
  const references=referenceEditor({surface:svg,labels:mapLabels(skeleton),
    project:(x,z)=>{const p=new DOMPoint(x,z).matrixTransform(world.getScreenCTM()!);return {x:p.x,y:p.y,visible:p.x>0&&p.x<innerWidth&&p.y>90&&p.y<innerHeight-175};},
    unproject:(x,y)=>{const p=new DOMPoint(x,y).matrixTransform(world.getScreenCTM()!.inverse());return [p.x,p.y];},
    onArm:()=>{editing=false;$("#editbar").hidden=true;$("#edit").setAttribute("aria-pressed","false");}
  });
  const updateReferences=()=>{references.update();requestAnimationFrame(updateReferences);};updateReferences();
  window.addEventListener("keydown",e=>{
    if((e.target as HTMLElement).matches("input,textarea,select")||references.active())return;
    if(e.key==="+"||e.key==="=")zoomAt(innerWidth/2,innerHeight/2,1/1.3);
    if(e.key==="-")zoomAt(innerWidth/2,innerHeight/2,1.3);
    if(e.key.toLowerCase()==="q")rotateBy(-15);if(e.key.toLowerCase()==="e")rotateBy(15);
  });

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
      if (before > 0 && after > 0) {
        zoomAt((e.clientX + other.x) / 2, (e.clientY + other.y) / 2, before / after);
        const delta=Math.atan2(e.clientY-other.y,e.clientX-other.x)-Math.atan2(prev.y-other.y,prev.x-other.x);
        rotateBy(Math.atan2(Math.sin(delta),Math.cos(delta))*180/Math.PI);
      }
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
    frontages.setAttribute("opacity",on?"0.35":"1");
    threshold.setAttribute("opacity",on?"0.35":"1");
    seafront.setAttribute("opacity", on ? "0.4" : "1");
  });
  toggle("#streets", (on) => {
    show(streets)(on);
    show(names)(on);
  });
  toggle("#objects", (on) => {
    show(objects)(on);
    show(walls)(on);
  });
  toggle("#photos", (on)=>{show(photos)(on);show(photoEvidence)(on&&$("#photo-evidence").getAttribute("aria-pressed")==="true");});
  toggle("#photo-evidence", (on)=>{show(photoEvidence)(on);photos.classList.toggle("evidence-mode",on);if(on){show(photos)(true);$("#photos").setAttribute("aria-pressed","true");}});
  toggle("#boundary", show(boundary));
  toggle("#seafront", (on) => { show(seafront)(on); show(seafrontNames)(on); });
  toggle("#heights", paintRoofs);
  toggle("#key", (on) => ($("#legend").hidden = !on));
  toggle("#edit", (on) => {
    editing = on;
    $("#editbar").hidden = !on;
    select(null);
  });
  $("#reset").addEventListener("click", () => {
    rotation=rot;Object.assign(view, home);
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
