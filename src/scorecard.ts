import * as THREE from "three";
import { asset } from "./asset";

/**
 * The area scorecard (public/scorecard.json, scripts/build_scorecard.py) for the area the player
 * stands in, or the overview's centre: red while photos are wanted there, amber while photos or build
 * work wait, green when nothing is open. It lists the photo spots (data/photo_requests.json) with
 * their distance and direction, and while it is open marks each spot in the world with a beacon and
 * an arrow to what to photograph (no collision, not part of the model). Collapsed on small screens;
 * off in automated renders (?photocam=, a webdriver) unless the link has ?scorecard=1.
 * See docs/SCORECARD.md.
 */
type Card = {
  id: string; name: string; brief: string; status: string[];
  levels: { ground: { within25cm: number; cells: number } | null; streets: { worstMiss: number; worstStreet: string } | null; poolDecks: { pool: string; miss: number }[]; roofs: { measured: number; medianMiss: number } | null };
  plan: { houses: number; onRoof?: number; east?: number; south?: number; fit?: number } | null;
  photos: { count: number; placed: number; camerasSolved: number; stationsHolding: string[]; heldOutMisfitM: number[] };
  facades: { traced: number; generated: number } | null;
  placement: { features: number; verified: number; disputed: number };
  discrepancies: { id: string; feature: string }[];
  tasks: { open: number; inProgress: number; titles: string[] };
  light: { colour: "red" | "amber" | "green"; headline: string; requests: Request[] };
};
type Request = { id: string; at: [number, number]; look: [number, number] | null; ask: string; why: string; priority: number; state: "open" | "received"; photos: string[] };
const COLOURS = { red: "#c8352b", amber: "#d98a00", green: "#2f8a3e" };
const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
type Scorecard = { measuredAt: string | null; grid: { x0: number; z0: number; step: number; nx: number; nz: number; areas: string[]; rows: string[] }; areas: Card[] };

const TABLE = "https://github.com/daveyboyc/villacana-venture/blob/main/refs/SCORECARD.md";
const WHOLE = "whole-resort";

export function areaScorecard(scene?: THREE.Scene, groundY?: (x: number, z: number) => number): { update(x: number, z: number): void } {
  const params = new URLSearchParams(location.search);
  const wanted = params.get("scorecard");
  if (wanted === "0" || (wanted !== "1" && (params.has("photocam") || navigator.webdriver))) return { update() {} };

  const style = document.createElement("style");
  style.textContent = `
    #scorecard { position:fixed; top:146px; left:max(12px, env(safe-area-inset-left)); width:min(300px, calc(100vw - 24px)); max-height:min(60dvh, 520px); overflow:auto; box-sizing:border-box; background:#fffdf8f2; border:1px solid #c9bfae; border-radius:12px; font:13px/1.4 system-ui, sans-serif; color:#222; z-index:3; }
    #scorecard:not([open]) { width:auto; max-width:calc(100vw - 24px); border-radius:999px; }
    #scorecard > summary { cursor:pointer; padding:8px 14px; font-weight:600; min-height:28px; box-sizing:border-box; list-style:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #scorecard > summary::-webkit-details-marker { display:none; }
    #scorecard > summary::before { content:"▸ "; color:#235f94; }
    #scorecard[open] > summary::before { content:"▾ "; }
    #scorecard .body { padding:0 14px 12px; }
    #scorecard ul { margin:0 0 8px; padding-left:18px; }
    #scorecard li { margin:3px 0; }
    #scorecard table { border-collapse:collapse; width:100%; margin:4px 0 8px; font-size:12px; }
    #scorecard th { text-align:left; font-weight:600; padding:2px 8px 2px 0; vertical-align:top; color:#555; white-space:nowrap; }
    #scorecard td { padding:2px 0; font-variant-numeric:tabular-nums; }
    #scorecard .links a { color:#235f94; margin-right:12px; }
    #scorecard .note { color:#666; font-size:11px; }
    #scorecard { border-left:6px solid var(--light, #888); }
    #scorecard > summary .dot { display:inline-block; width:11px; height:11px; border-radius:50%; background:var(--light, #888); margin-right:6px; vertical-align:-1px; }
    #scorecard .headline { font-weight:600; color:var(--light); margin:2px 0 6px; }
    #scorecard ol { margin:0 0 8px; padding-left:20px; }
    #scorecard ol li { margin:5px 0; }
    #scorecard .where { font-weight:600; }
    #scorecard .why { color:#666; font-size:11px; }
    #scorecard details.more > summary { cursor:pointer; color:#235f94; margin:4px 0; }
    body.embedded #scorecard { top:100px; }
    @media (pointer:coarse) { #scorecard { max-height:max(120px, calc(100dvh - 370px)); } }
    @media (pointer:coarse) and (max-height:450px) { #scorecard { top:64px; left:auto; right:max(12px, env(safe-area-inset-right)); max-height:60dvh; } }
  `;
  document.head.append(style);
  const panel = document.createElement("details");
  panel.id = "scorecard";
  panel.setAttribute("aria-label", "Area scorecard");
  const summary = document.createElement("summary"), body = document.createElement("div");
  body.className = "body";
  summary.textContent = "Area scorecard";
  panel.append(summary, body);
  document.body.append(panel);
  let remembered: string | null = null;
  try { remembered = localStorage.getItem("villacana-scorecard-open"); } catch { /* storage blocked */ }
  panel.open = remembered !== null ? remembered === "1" : !matchMedia("(max-width:700px), (max-height:500px)").matches;
  panel.addEventListener("toggle", () => { try { localStorage.setItem("villacana-scorecard-open", panel.open ? "1" : "0"); } catch { /* storage blocked */ } });

  let data: Scorecard | null = null, shown = "";
  void fetch(asset("/scorecard.json")).then((r) => r.json()).then((d: Scorecard) => { data = d; });
  const metres = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)} m`;
  const cell = (label: string, value: string) => { const row = document.createElement("tr"), th = document.createElement("th"), td = document.createElement("td"); th.textContent = label; td.textContent = value; row.append(th, td); return row; };

  // Beacons at the photo spots: red where photos are wanted, amber where they have arrived.
  const beacons = new THREE.Group(); beacons.name = "photo-request-beacons"; beacons.visible = false;
  if (scene && groundY) scene.add(beacons);
  const spots: { request: Request; number: number }[] = [];
  let here: [number, number] = [0, 0], card: Card | null = null;
  const label = (text: string, colour: string) => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const c = canvas.getContext("2d")!; c.fillStyle = colour; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff"; c.font = "bold 64px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 64, 68);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false })); sprite.scale.set(1.4, 1.4, 1); return sprite;
  };
  function placeBeacons(all: Card) {
    if (!scene || !groundY) return;
    all.light.requests.forEach((request, i) => {
      const colour = request.state === "open" ? COLOURS.red : COLOURS.amber, [x, z] = request.at, y = groundY(x, z);
      const material = new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: .45, depthWrite: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 5, 12, 1, true), material); beam.position.set(x, y + 2.5, z);
      const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 32), new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + .06, z);
      const tag = label(String(i + 1), colour); tag.position.set(x, y + 5.6, z);
      beacons.add(beam, ring, tag);
      if (request.look) {
        const arrow = new THREE.ArrowHelper(new THREE.Vector3(request.look[0] - x, 0, request.look[1] - z).normalize(), new THREE.Vector3(x, y + 1.4, z), 2.4, colour, .7, .45);
        beacons.add(arrow);
      }
      spots.push({ request, number: i + 1 });
    });
  }
  const whereFrom = (at: [number, number]) => {
    const dx = at[0] - here[0], dz = at[1] - here[1], d = Math.hypot(dx, dz);
    if (d < 3) return "you are here";
    const bearing = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
    return `${Math.round(d)} m ${COMPASS[Math.round(bearing / 45) % 8]}`;
  };
  const spotNumber = (id: string) => spots.find((s) => s.request.id === id)?.number;

  function render(c: Card, between: boolean) {
    card = c;
    const colour = COLOURS[c.light.colour];
    panel.style.setProperty("--light", colour);
    panel.dataset.area = c.id; panel.dataset.light = c.light.colour;
    const dot = document.createElement("span"); dot.className = "dot";
    summary.replaceChildren(dot, `${c.name}${between ? " (between areas)" : ""} · ${c.light.colour === "red" ? "photos needed" : c.light.colour === "amber" ? "checking" : "up to date"}`);
    const headline = document.createElement("div"); headline.className = "headline"; headline.textContent = c.light.headline;
    const asks = document.createElement("ol");
    for (const r of c.light.requests) {
      const li = document.createElement("li"), where = document.createElement("span"), why = document.createElement("div");
      li.value = spotNumber(r.id) ?? asks.children.length + 1;
      where.className = "where"; where.dataset.at = r.at.join(","); where.textContent = whereFrom(r.at);
      why.className = "why"; why.textContent = r.state === "received" ? `Photos in (${r.photos.join(", ")}), waiting for review. For: ${r.why}` : `For: ${r.why}`;
      li.append(where, ": ", r.ask, why); asks.append(li);
    }
    const more = document.createElement("details"); more.className = "more";
    const moreSummary = document.createElement("summary"); moreSummary.textContent = "Measurements";
    const list = document.createElement("ul");
    for (const line of c.status) { const li = document.createElement("li"); li.textContent = line; list.append(li); }
    const table = document.createElement("table"), l = c.levels;
    if (l.ground) table.append(cell("Open ground", `${Math.round(l.ground.within25cm * 100)}% within 0.25 m (${l.ground.cells} cells)`));
    if (l.streets) table.append(cell("Worst street", `${l.streets.worstMiss.toFixed(2)} m, ${l.streets.worstStreet}`));
    for (const p of l.poolDecks) table.append(cell(`${p.pool} pool deck`, metres(p.miss)));
    if (l.roofs) table.append(cell("Roofs", `${l.roofs.measured} measured, median ${metres(l.roofs.medianMiss)}`));
    if (c.plan?.fit !== undefined) table.append(cell("Footprint fit", `${c.plan.fit.toFixed(2)}, best shift ${c.plan.east} m E ${c.plan.south} m S`));
    const ph = c.photos;
    if (ph.heldOutMisfitM.length) table.append(cell("Held-out misfit", ph.heldOutMisfitM.map((m) => `${m.toFixed(2)} m`).join(", ")));
    if (ph.stationsHolding.length) table.append(cell("Stations holding", ph.stationsHolding.join(", ")));
    if (c.discrepancies.length) table.append(cell("Discrepancies", c.discrepancies.map((d) => d.id).join(", ")));
    table.append(cell("Tasks", `${c.tasks.open} open, ${c.tasks.inProgress} in progress`));
    more.append(moreSummary, list, table);
    const links = document.createElement("div");
    links.className = "links";
    for (const [text, href] of [["Photo spots on the map", asset("/") + "?view=map"], ["Area brief", c.brief], ["All areas", TABLE]]) {
      const a = document.createElement("a");
      a.textContent = text; a.href = href; if (!href.startsWith(asset("/"))) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      links.append(a);
    }
    const note = document.createElement("div");
    note.className = "note";
    note.textContent = `Numbered beacons mark the photo spots; the arrow shows what to photograph. Survey measured ${data?.measuredAt ?? "never"}; see docs/SCORECARD.md.`;
    body.replaceChildren(headline, ...(c.light.requests.length ? [asks] : []), more, links, note);
  }
  const showBeacons = () => { beacons.visible = panel.open; };
  panel.addEventListener("toggle", showBeacons);
  let last: [number, number] = [Infinity, Infinity];

  return {
    update(x: number, z: number) {
      if (!data) return;
      here = [x, z];
      if (!spots.length) { const all = data.areas.find((a) => a.id === WHOLE); if (all) placeBeacons(all); showBeacons(); }
      // Distances to the spots follow the player, a metre at a time.
      if (Math.hypot(x - last[0], z - last[1]) > 1) {
        last = [x, z];
        for (const el of body.querySelectorAll<HTMLElement>(".where")) { const [ax, az] = el.dataset.at!.split(",").map(Number); el.textContent = whereFrom([ax, az]); }
      }
      const g = data.grid, i = Math.floor((x - g.x0) / g.step), k = Math.floor((z - g.z0) / g.step);
      const code = i >= 0 && i < g.nx && k >= 0 && k < g.nz ? g.rows[k][i] : ".";
      const id = code === "." ? WHOLE : g.areas[code.charCodeAt(0) - 97];
      if (id === shown && card) return;
      shown = id;
      const found = data.areas.find((a) => a.id === id);
      if (found) render(found, id === WHOLE);
    },
  };
}
