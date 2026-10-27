import { asset } from "./asset";
import type { ScreenPoint } from "./references";
import type { Vec2 } from "./types";

/**
 * The 'Sure / unsure' overlay (public/confidence.json, scripts/build_confidence.py, docs/CONFIDENCE.md):
 * every modelled feature outlined in the colour of how sure the model is about it, plus known gaps.
 * Tap a feature for why, its photos and the owner's decision (good enough / needs photos, kept in
 * this browser and exportable). An overlay only: it builds no geometry. Off unless switched on or
 * the link has ?confidence=1.
 */
type Level = { id: string; colour: string; meaning: string; count: number };
type Feature = { id: string; name: string; kind: string; level: string; why: string; evidence: string[]; areas: string[];
  flags?: string[]; decision?: string; note?: string; ring?: Vec2[]; points?: Vec2[]; width?: number };
type Gap = { id: string; name: string; at: Vec2; photos: string[]; why: string };
type Confidence = { levels: Level[]; decisions: Record<string, string>; features: Feature[]; gaps: Gap[] };

const ON = "villacana-confidence-on", HIDDEN = "villacana-confidence-hidden", MINE = "villacana-confidence-decisions-v1";
const NS = "http://www.w3.org/2000/svg";
const read = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } };
const store = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };

export function confidenceOverlay(options: { toolbar: HTMLElement; project: (x: number, z: number) => ScreenPoint; enabled: () => boolean }) {
  const param = new URLSearchParams(location.search).get("confidence");
  let on = param === "1" || (param !== "0" && read(ON, false));
  let hiddenLevels = new Set<string>(read<string[]>(HIDDEN, []));
  let mine = read<Record<string, string>>(MINE, {});
  let data: Confidence | null = null, lastKey = "";

  const style = document.createElement("style");
  style.textContent = `
    #confidence-toggle[aria-pressed="true"] { background:#235f94; color:white; border-color:#235f94; }
    .confidence-layer { position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:1; }
    .confidence-layer [data-feature] { pointer-events:visiblePainted; cursor:pointer; }
    .confidence-legend { position:fixed; left:12px; width:min(270px, calc(100vw - 24px)); max-height:45dvh; overflow:auto; box-sizing:border-box; background:#fffdf8f2; border:1px solid #c9bfae; border-radius:12px; padding:10px 12px; font:12px/1.35 system-ui, sans-serif; color:#222; z-index:3; }
    .confidence-legend summary { font-weight:600; font-size:13px; cursor:pointer; }
    .confidence-legend label { display:flex; gap:6px; align-items:flex-start; margin:5px 0; cursor:pointer; }
    .confidence-legend .swatch { flex:none; width:14px; height:14px; border-radius:3px; margin-top:1px; }
    .confidence-legend small { color:#656158; }
    .confidence-legend button, .confidence-dialog button { font:12px system-ui; padding:6px 10px; border:1px solid #c9bfae; border-radius:7px; background:white; cursor:pointer; }
    .confidence-dialog { border:1px solid #c9bfae; border-radius:16px; background:#fffdf8; color:#222; max-width:440px; width:calc(100vw - 48px); max-height:85dvh; padding:18px; font:14px/1.4 system-ui; }
    .confidence-dialog::backdrop { background:#18232f66; }
    .confidence-dialog h2 { margin:0 0 6px; font-size:17px; }
    .confidence-dialog .badge { display:inline-block; padding:2px 8px; border-radius:999px; color:white; font-weight:600; font-size:12px; }
    .confidence-dialog .flags { color:#c92a2a; }
    .confidence-dialog .photos { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
    .confidence-dialog .photos a { font-size:11px; color:#235f94; display:flex; flex-direction:column; gap:2px; }
    .confidence-dialog .photos img { width:92px; height:70px; object-fit:cover; border-radius:6px; }
    .confidence-dialog .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .confidence-dialog button[aria-pressed="true"] { background:#235f94; color:white; border-color:#235f94; }
  `;
  document.head.append(style);
  const button = document.createElement("button");
  button.type = "button"; button.id = "confidence-toggle"; button.textContent = "Sure / unsure";
  options.toolbar.append(button);
  const svg = document.createElementNS(NS, "svg"); svg.classList.add("confidence-layer"); document.body.append(svg);
  const legend = document.createElement("details"); legend.className = "confidence-legend"; legend.open = innerWidth > 600; document.body.append(legend);
  const dialog = document.createElement("dialog"); dialog.className = "confidence-dialog"; document.body.append(dialog);

  const levelOf = (id: string) => data?.levels.find((l) => l.id === id);
  const decisionOf = (f: { id: string; decision?: string }) => mine[f.id] ?? f.decision;
  const drawLegend = () => {
    if (!data) { legend.innerHTML = "<summary>Loading…</summary>"; return; }
    legend.replaceChildren();
    const h = document.createElement("summary"); h.textContent = "How sure is the model?"; legend.append(h);
    for (const l of data.levels) {
      const label = document.createElement("label"), box = document.createElement("input"), swatch = document.createElement("span"), text = document.createElement("span");
      box.type = "checkbox"; box.checked = !hiddenLevels.has(l.id);
      box.addEventListener("change", () => { box.checked ? hiddenLevels.delete(l.id) : hiddenLevels.add(l.id); store(HIDDEN, [...hiddenLevels]); lastKey = ""; });
      swatch.className = "swatch"; swatch.style.background = l.colour;
      text.innerHTML = `<b>${l.id === "gap" ? "Missing" : l.id[0].toUpperCase() + l.id.slice(1)}</b> (${l.count})<br><small></small>`;
      text.querySelector("small")!.textContent = l.meaning;
      label.append(box, swatch, text); legend.append(label);
    }
    const count = Object.keys(mine).length, note = document.createElement("p"), exp = document.createElement("button");
    note.innerHTML = "<small>Tap an outline for why and its photos. Dashed: needs photos. Faded: good enough. Red ring: a check disagrees.</small>";
    exp.type = "button"; exp.textContent = `Export my decisions (${count})`; exp.disabled = !count;
    exp.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify({ format: "villacana-confidence-decisions", version: 1, decisions: mine }, null, 2)], { type: "application/json" });
      const a = document.createElement("a"), href = URL.createObjectURL(blob); a.href = href; a.download = "villacana-confidence-decisions.json"; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
    });
    legend.append(note, exp);
  };
  const photosOf = (files: string[]) => {
    const box = document.createElement("div"); box.className = "photos";
    for (const file of files) {
      const a = document.createElement("a"), img = document.createElement("img"), cap = document.createElement("span");
      a.href = asset(`/photos-ref/${file}`); a.target = "_blank"; a.rel = "noopener";
      img.src = asset(`/photos-ref/thumbs/${file}`); img.alt = file; img.loading = "lazy"; img.onerror = () => img.remove();
      cap.textContent = file.replace(/\.jpg$/, ""); a.append(img, cap); box.append(a);
    }
    return box;
  };
  const open = (item: Feature | Gap, gap: boolean) => {
    const level = levelOf(gap ? "gap" : (item as Feature).level)!;
    dialog.replaceChildren();
    const h = document.createElement("h2"); h.textContent = item.name;
    const badge = document.createElement("span"); badge.className = "badge"; badge.style.background = level.colour; badge.textContent = gap ? "Missing" : level.id;
    const why = document.createElement("p"); why.textContent = item.why;
    const meaning = document.createElement("p"); meaning.innerHTML = "<small></small>"; meaning.querySelector("small")!.textContent = level.meaning;
    dialog.append(h, badge, why, meaning);
    const f = item as Feature;
    if (!gap && f.flags?.length) { const p = document.createElement("p"); p.className = "flags"; p.textContent = "Note: " + f.flags.join("; ") + "."; dialog.append(p); }
    const files = gap ? (item as Gap).photos : f.evidence;
    dialog.append(files.length ? photosOf(files) : Object.assign(document.createElement("p"), { textContent: "No photo cited." }));
    const id = document.createElement("p"); id.innerHTML = "<small></small>"; id.querySelector("small")!.textContent = item.id + (f.note ? ` · ${f.note}` : ""); dialog.append(id);
    const actions = document.createElement("div"); actions.className = "actions";
    const current = decisionOf(item);
    for (const [key, label] of [["accepted", "Good enough"], ["needs-photos", "Needs photos"]] as const) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.title = data!.decisions[key]; b.setAttribute("aria-pressed", String(current === key));
      b.addEventListener("click", () => { if (mine[item.id] === key) delete mine[item.id]; else mine[item.id] = key; store(MINE, mine); lastKey = ""; drawLegend(); open(item, gap); });
      actions.append(b);
    }
    const close = document.createElement("button"); close.type = "button"; close.textContent = "Close"; close.addEventListener("click", () => dialog.close());
    actions.append(close); dialog.append(actions);
    if (!dialog.open) dialog.showModal();
  };
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  const draw = () => {
    if (!data) return;
    const shapes: SVGElement[] = [];
    const xy = (p: Vec2) => options.project(p[0], p[1]);
    const add = (el: SVGElement, onTap: () => void) => { el.addEventListener("click", onTap); el.addEventListener("pointerdown", (e) => e.stopPropagation()); shapes.push(el); };
    // Registry houses first, so authored features sit on top of them.
    const ordered = [...data.features].sort((a, b) => Number(b.level === "registry") - Number(a.level === "registry"));
    for (const f of ordered) {
      if (hiddenLevels.has(f.level)) continue;
      const line = f.ring ?? f.points ?? [];
      const screen = line.map(xy);
      if (!screen.some((p) => p.visible)) continue;
      const colour = levelOf(f.level)!.colour, decision = decisionOf(f), d = screen.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("") + (f.ring ? "Z" : "");
      const el = document.createElementNS(NS, "path"); el.setAttribute("d", d); el.dataset.feature = f.id;
      const filled = !!f.ring && !f.points && f.kind !== "area" && f.kind !== "parking", faded = decision === "accepted";
      // Small shapes answer a tap anywhere; large ones (sea, beach, lawns) only on their outline, so the map still pans.
      const area = f.ring ? Math.abs(f.ring.reduce((s, p, i) => { const q = f.ring![(i + 1) % f.ring!.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2) : 0;
      el.style.pointerEvents = f.level === "registry" ? "none" : filled && area < 150 ? "visiblePainted" : "visibleStroke";
      let stroke = 2.5;
      if (f.width && line.length > 1) { const a = xy(line[0]), b = xy([line[0][0] + 1, line[0][1]]); stroke = Math.max(3, Math.hypot(b.x - a.x, b.y - a.y) * f.width); }
      el.setAttribute("fill", filled ? colour : "none"); el.setAttribute("fill-opacity", f.level === "registry" ? ".06" : faded ? ".12" : ".35");
      el.setAttribute("stroke", colour); el.setAttribute("stroke-width", String(f.width ? stroke : filled ? 2 : 4)); el.setAttribute("stroke-linecap", "round");
      el.setAttribute("stroke-opacity", f.width ? ".4" : faded ? ".45" : ".95");
      if (decision === "needs-photos") el.setAttribute("stroke-dasharray", "6 4");
      add(el, () => open(f, false));
      if (f.points && f.points.length === 1) { const p = screen[0], c = document.createElementNS(NS, "circle"); c.setAttribute("cx", String(p.x)); c.setAttribute("cy", String(p.y)); c.setAttribute("r", "6"); c.setAttribute("fill", colour); c.dataset.feature = f.id; add(c, () => open(f, false)); }
      if (f.flags?.some((x) => x !== "placement verified")) {
        const ring = el.cloneNode() as SVGElement; ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "#c92a2a"); ring.setAttribute("stroke-width", String(Number(el.getAttribute("stroke-width")) + 3)); ring.setAttribute("stroke-dasharray", "2 3"); ring.setAttribute("stroke-opacity", ".9");
        add(ring, () => open(f, false));
      }
    }
    if (!hiddenLevels.has("gap")) for (const g of data.gaps) {
      const p = xy(g.at); if (!p.visible) continue;
      const pin = document.createElementNS(NS, "g"); pin.dataset.feature = g.id;
      pin.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="11" fill="#c92a2a" stroke="white" stroke-width="2"/><text x="${p.x}" y="${p.y + 5}" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700" font-size="14">?</text>`;
      const decision = decisionOf(g); if (decision === "accepted") pin.setAttribute("opacity", ".45");
      add(pin, () => open(g, true));
    }
    svg.replaceChildren(...shapes);
  };

  const sync = () => { button.setAttribute("aria-pressed", String(on)); if (on && !data) void load(); drawLegend(); lastKey = ""; };
  const load = () => fetch(asset("/confidence.json")).then((r) => r.json()).then((d: Confidence) => { data = d; drawLegend(); lastKey = ""; }).catch(() => { legend.innerHTML = "<summary>Could not load confidence.json.</summary>"; });
  button.addEventListener("click", () => { on = !on; store(ON, on); sync(); });
  sync();
  return {
    update() {
      const visible = on && options.enabled();
      svg.style.display = visible ? "" : "none"; legend.hidden = !visible;
      if (!visible || !data) return;
      // Sit beside the toolbar: above it when it is low on the screen, below it when it is at the top.
      const bar = options.toolbar.getBoundingClientRect();
      legend.style.left = `${Math.max(8, bar.left)}px`;
      if (bar.top > innerHeight / 2) { legend.style.top = "auto"; legend.style.bottom = `${innerHeight - bar.top + 8}px`; } else { legend.style.bottom = "auto"; legend.style.top = `${bar.bottom + 8}px`; }
      // Redraw only when the view moves: three projected points stand in for the camera.
      const key = [[0, 0], [100, 0], [0, 100]].map(([x, z]) => { const p = options.project(x, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("|") + innerWidth + "x" + innerHeight;
      if (key !== lastKey) { lastKey = key; draw(); }
    },
    active: () => dialog.open,
  };
}
