import { asset } from "./asset";
import type { ScreenPoint } from "./references";
import type { Vec2 } from "./types";

/**
 * The 'Photo coverage' layer (public/photo-coverage.json, scripts/photo_coverage.py, docs/PHOTO_COVERAGE_PRD.md):
 * every feature drawn in the colour of how well the photos pin it down (unseen, seen, located, fixed, measured),
 * each side or end in its own grade so a hidden edge shows, plus the photo requests as numbered spots with an
 * arrow to what to photograph. Tap a feature for why and which cameras see it; tap a spot for what to take.
 * An overlay only: it builds no geometry and grants no approval. Off unless switched on or ?coverage=1.
 */
type Grade = { id: string; colour: string; meaning: string; count: number };
type Part = { part: string; grade: string; line: number[][] };
type Feature = { id: string; name: string; kind: string; category: string; areas: string[]; grade: string; computed: string;
  height: string; heightFrom?: string[]; heightCritical: boolean; nearestSolvedM?: number | null; widestSolvedAngle?: number; weakParts: string[]; why: string; solvedCameras: string[]; cited: string[];
  measuredApproval?: string; openDiscrepancies?: string[]; requests?: string[]; ring?: Vec2[]; points?: Vec2[]; width?: number; parts: Part[] };
type Request = { id: string; area: string; at: Vec2; look: Vec2 | null; ask: string; why: string; status: string; priority: number };
type Area = { name: string; structural: number; grades: Record<string, number>; enough: boolean; belowFixed: number; noHeightView: number };
type Coverage = { grades: Grade[]; areas: Record<string, Area>; features: Feature[]; requests: Request[] };

const ON = "villacana-coverage-on", HIDDEN = "villacana-coverage-hidden", AREA = "villacana-coverage-area";
const NS = "http://www.w3.org/2000/svg";
const REQUEST_COLOUR: Record<string, string> = { open: "#c92a2a", answered: "#e09a00" };
const read = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } };
const store = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window */ } };

export function coverageOverlay(options: { toolbar: HTMLElement; project: (x: number, z: number) => ScreenPoint; enabled: () => boolean }) {
  const param = new URLSearchParams(location.search).get("coverage");
  let on = param === "1" || (param !== "0" && read(ON, false));
  const hidden = new Set<string>(read<string[]>(HIDDEN, []));
  let area = new URLSearchParams(location.search).get("coverageArea") ?? read<string>(AREA, "");
  let data: Coverage | null = null, lastKey = "";

  const style = document.createElement("style");
  style.textContent = `
    #coverage-toggle[aria-pressed="true"] { background:#1f5fa8; color:white; border-color:#1f5fa8; }
    body.coverage-on #photo-spots [data-request] { display:none; }
    .coverage-layer { position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:1; }
    .coverage-layer [data-feature], .coverage-layer [data-request] { pointer-events:visiblePainted; cursor:pointer; }
    .coverage-legend { position:fixed; left:12px; width:min(290px, calc(100vw - 24px)); max-height:50dvh; overflow:auto; box-sizing:border-box; background:#fffdf8f2; border:1px solid #c9bfae; border-radius:12px; padding:10px 12px; font:12px/1.35 system-ui, sans-serif; color:#222; z-index:3; }
    .coverage-legend summary { font-weight:600; font-size:13px; cursor:pointer; }
    .coverage-legend label { display:flex; gap:6px; align-items:flex-start; margin:5px 0; cursor:pointer; }
    .coverage-legend .swatch { flex:none; width:14px; height:14px; border-radius:3px; margin-top:1px; }
    .coverage-legend small, .coverage-dialog small { color:#656158; }
    .coverage-legend select { font:12px system-ui; margin:4px 0; max-width:100%; }
    .coverage-legend .area-card { margin:6px 0; padding:6px 8px; border-radius:8px; background:#f3efe6; }
    .coverage-dialog { border:1px solid #c9bfae; border-radius:16px; background:#fffdf8; color:#222; max-width:460px; width:calc(100vw - 48px); max-height:85dvh; padding:18px; font:14px/1.4 system-ui; }
    .coverage-dialog::backdrop { background:#18232f66; }
    .coverage-dialog h2 { margin:0 0 6px; font-size:17px; }
    .coverage-dialog .badge { display:inline-block; padding:2px 8px; border-radius:999px; color:white; font-weight:600; font-size:12px; margin-right:4px; }
    .coverage-dialog ul { margin:6px 0; padding-left:18px; }
    .coverage-dialog button { font:13px system-ui; padding:6px 12px; border:1px solid #c9bfae; border-radius:7px; background:white; cursor:pointer; margin-top:8px; }
    .coverage-dialog .photos { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
    .coverage-dialog .photos a { font-size:11px; color:#235f94; display:flex; flex-direction:column; gap:2px; }
    .coverage-dialog .photos img { width:92px; height:70px; object-fit:cover; border-radius:6px; }
  `;
  document.head.append(style);
  const button = document.createElement("button");
  button.type = "button"; button.id = "coverage-toggle"; button.textContent = "Photo coverage";
  options.toolbar.append(button);
  const svg = document.createElementNS(NS, "svg"); svg.classList.add("coverage-layer"); document.body.append(svg);
  const legend = document.createElement("details"); legend.className = "coverage-legend"; legend.open = innerWidth > 600; document.body.append(legend);
  const dialog = document.createElement("dialog"); dialog.className = "coverage-dialog"; document.body.append(dialog);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  // Outlines take taps, but the wheel still zooms the map under them.
  svg.addEventListener("wheel", (e) => {
    svg.style.visibility = "hidden";
    const under = document.elementFromPoint(e.clientX, e.clientY);
    svg.style.visibility = "";
    if (under && !svg.contains(under)) { e.preventDefault(); under.dispatchEvent(new WheelEvent("wheel", e)); }
  }, { passive: false });

  const gradeOf = (id: string) => data?.grades.find((g) => g.id === id);
  const label = (id: string) => id[0].toUpperCase() + id.slice(1);
  const inArea = (f: { areas?: string[]; area?: string }) => !area || (f.areas ?? [f.area]).includes(area);
  const openRequests = () => (data?.requests ?? []).filter((r) => r.status !== "superseded");
  const badge = (id: string, text = label(id)) => { const b = document.createElement("span"); b.className = "badge"; b.style.background = gradeOf(id)?.colour ?? "#666"; b.textContent = text; return b; };
  const para = (text: string, small = false) => { const p = document.createElement("p"); if (small) { const s = document.createElement("small"); s.textContent = text; p.append(s); } else p.textContent = text; return p; };
  const photos = (files: string[]) => {
    const box = document.createElement("div"); box.className = "photos";
    for (const file of files.slice(0, 12)) {
      const a = document.createElement("a"), img = document.createElement("img"), cap = document.createElement("span");
      a.href = asset(`/photos-ref/${file}`); a.target = "_blank"; a.rel = "noopener";
      img.src = asset(`/photos-ref/thumbs/${file}`); img.alt = file; img.loading = "lazy"; img.onerror = () => img.remove();
      cap.textContent = file.replace(/\.jpg$/, ""); a.append(img, cap); box.append(a);
    }
    return box;
  };
  const closeButton = () => { const b = document.createElement("button"); b.type = "button"; b.textContent = "Close"; b.addEventListener("click", () => dialog.close()); return b; };

  const openFeature = (f: Feature) => {
    dialog.replaceChildren();
    const h = document.createElement("h2"); h.textContent = f.name;
    const badges = document.createElement("p"); badges.append(badge(f.grade));
    if (f.computed !== f.grade) badges.append(badge(f.computed, `photos alone: ${f.computed}`));
    dialog.append(h, badges, para(f.why || gradeOf(f.grade)!.meaning));
    const parts = document.createElement("ul");
    for (const p of f.parts) { const li = document.createElement("li"); li.append(`${label(p.part)}: `, badge(p.grade)); parts.append(li); }
    dialog.append(para("Each side or end:"), parts);
    const from = f.heightFrom?.length ? ` (${f.heightFrom.join(", ")})` : "";
    if (f.heightCritical) dialog.append(para(f.height === "view" ? `Height: a camera sees its foot and top from close and nearly level${from}.` : f.height === "partial" ? `Height: only part of it is seen side-on${from}.` : "Height: no side-on view of foot and top; its height is not pinned by a photo."));
    if (f.solvedCameras.length) dialog.append(para(`Solved cameras that see it: ${f.solvedCameras.join(", ")}; nearest ${f.nearestSolvedM} m` + (f.solvedCameras.length > 1 ? `; widest angle between them ${f.widestSolvedAngle}°` : ""), true));
    if (f.openDiscrepancies?.length) dialog.append(para(`Open discrepancies: ${f.openDiscrepancies.join(", ")}`, true));
    if (f.requests?.length) {
      const reqs = document.createElement("p");
      reqs.append("Photo requests: ");
      f.requests.forEach((id, i) => {
        const r = data!.requests.find((q) => q.id === id); if (!r) return;
        const a = document.createElement("a"); a.href = "#"; a.textContent = id; a.addEventListener("click", (e) => { e.preventDefault(); openRequest(r); });
        reqs.append(...(i ? [", ", a] : [a]));
      });
      dialog.append(reqs);
    }
    if (f.cited.length) dialog.append(photos(f.cited));
    dialog.append(para(f.id + (f.measuredApproval ? ` · ${f.measuredApproval}` : ""), true), closeButton());
    if (!dialog.open) dialog.showModal();
  };
  const openRequest = (r: Request) => {
    dialog.replaceChildren();
    const h = document.createElement("h2"); h.textContent = `Photo spot: ${r.id}`;
    const b = document.createElement("span"); b.className = "badge"; b.style.background = REQUEST_COLOUR[r.status] ?? "#666"; b.textContent = r.status === "open" ? "Photos needed" : "Photos in, waiting for review";
    dialog.append(h, b, para(r.ask), para(`Why: ${r.why}`, true));
    const served = data!.features.filter((f) => f.requests?.includes(r.id));
    if (served.length) {
      const ul = document.createElement("ul");
      for (const f of served) { const li = document.createElement("li"), a = document.createElement("a"); a.href = "#"; a.textContent = f.name; a.addEventListener("click", (e) => { e.preventDefault(); openFeature(f); }); li.append(a, " ", badge(f.grade)); ul.append(li); }
      dialog.append(para("Settles:"), ul);
    }
    dialog.append(para(`Stand at ${r.at[0].toFixed(1)}, ${r.at[1].toFixed(1)}${r.look ? `, look towards ${r.look[0].toFixed(1)}, ${r.look[1].toFixed(1)}` : ""} (map metres) · area ${r.area} · priority ${r.priority}`, true), closeButton());
    if (!dialog.open) dialog.showModal();
  };

  const drawLegend = () => {
    if (!data) { legend.innerHTML = "<summary>Loading…</summary>"; return; }
    legend.replaceChildren();
    const h = document.createElement("summary"); h.textContent = "Photo coverage"; legend.append(h);
    const pick = document.createElement("select"); pick.id = "coverage-area";
    pick.append(new Option("All areas", ""), ...Object.entries(data.areas).filter(([id]) => id !== "whole-resort").map(([id, a]) => new Option(a.name, id)));
    pick.value = area; pick.addEventListener("change", () => { area = pick.value; store(AREA, area); lastKey = ""; drawLegend(); });
    legend.append(pick);
    const card = data.areas[area || "whole-resort"];
    if (card) {
      const box = document.createElement("div"); box.className = "area-card"; box.dataset.enough = String(card.enough);
      box.innerHTML = `<b></b><br><small></small>`;
      box.querySelector("b")!.textContent = card.enough ? "Enough photos" : `Not enough yet: ${card.belowFixed} of ${card.structural} structural features below fixed` + (card.noHeightView ? `, ${card.noHeightView} without a height view` : "");
      box.querySelector("small")!.textContent = data.grades.map((g) => `${label(g.id)} ${card.grades[g.id] ?? 0}`).join(" · ");
      legend.append(box);
    }
    for (const g of data.grades) {
      const row = document.createElement("label"), box = document.createElement("input"), swatch = document.createElement("span"), text = document.createElement("span");
      box.type = "checkbox"; box.checked = !hidden.has(g.id); box.dataset.grade = g.id;
      box.addEventListener("change", () => { box.checked ? hidden.delete(g.id) : hidden.add(g.id); store(HIDDEN, [...hidden]); lastKey = ""; });
      swatch.className = "swatch"; swatch.style.background = g.colour;
      const n = data.features.filter((f) => f.grade === g.id && inArea(f)).length;
      text.innerHTML = `<b></b> (${n})<br><small></small>`; text.querySelector("b")!.textContent = label(g.id); text.querySelector("small")!.textContent = g.meaning;
      row.append(box, swatch, text); legend.append(row);
    }
    const reqRow = document.createElement("label"), reqBox = document.createElement("input"), reqSwatch = document.createElement("span"), reqText = document.createElement("span");
    reqBox.type = "checkbox"; reqBox.checked = !hidden.has("requests"); reqBox.dataset.grade = "requests";
    reqBox.addEventListener("change", () => { reqBox.checked ? hidden.delete("requests") : hidden.add("requests"); store(HIDDEN, [...hidden]); lastKey = ""; });
    reqSwatch.className = "swatch"; reqSwatch.style.cssText = `background:${REQUEST_COLOUR.open};border-radius:50%`;
    const reqs = openRequests().filter(inArea);
    reqText.innerHTML = `<b>Photo spots</b> (${reqs.filter((r) => r.status === "open").length} open)<br><small>Where to stand, with an arrow to what to photograph. Amber: photos in, waiting for review.</small>`;
    reqRow.append(reqBox, reqSwatch, reqText); legend.append(reqRow);
    legend.append(para("Each side of a feature takes its own colour, so a hidden edge shows. Tap an outline or a spot for details. Coverage says what the photos can support; it is not a measurement.", true));
  };

  const draw = () => {
    if (!data) return;
    const shapes: SVGElement[] = [];
    const xy = (p: number[]) => options.project(p[0], p[1]);
    const add = (el: SVGElement, onTap: () => void) => { el.addEventListener("click", onTap); el.addEventListener("pointerdown", (e) => e.stopPropagation()); shapes.push(el); };
    const path = (pts: ScreenPoint[], closed: boolean) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("") + (closed ? "Z" : "");
    const scale = (() => { const a = xy([0, 0]), b = xy([1, 0]); return Math.hypot(b.x - a.x, b.y - a.y); })();
    // Registry houses first, so authored features sit on top of them.
    const ordered = [...data.features].filter(inArea).sort((a, b) => Number(b.category === "registry") - Number(a.category === "registry"));
    for (const f of ordered) {
      if (hidden.has(f.grade)) continue;
      const outline = f.ring ?? f.points ?? [];
      const screen = outline.map(xy);
      if (!screen.some((p) => p.visible)) continue;
      const colour = gradeOf(f.grade)!.colour, registry = f.category === "registry";
      // A faint fill in the feature's grade; small shapes answer a tap anywhere, large ones only on their edges.
      if (f.ring) {
        const fill = document.createElementNS(NS, "path"); fill.setAttribute("d", path(screen, true)); fill.dataset.feature = f.id;
        const size = Math.abs(f.ring.reduce((s, p, i) => { const q = f.ring![(i + 1) % f.ring!.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
        fill.setAttribute("fill", colour); fill.setAttribute("fill-opacity", registry ? ".08" : ".28"); fill.setAttribute("stroke", "none");
        fill.style.pointerEvents = registry ? "none" : size < 150 ? "visiblePainted" : "none";
        add(fill, () => openFeature(f));
      }
      // Each side or end in its own grade.
      const width = f.width ? Math.max(3, scale * f.width) : registry ? 2 : 4;
      for (const p of f.parts) {
        const segs = p.line.filter((s) => s.length === 4);
        if (!segs.length) continue;
        const el = document.createElementNS(NS, "path"); el.dataset.feature = f.id; el.dataset.part = p.part; el.dataset.grade = p.grade;
        el.setAttribute("d", segs.map((s) => { const a = xy([s[0], s[1]]), b = xy([s[2], s[3]]); return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`; }).join(""));
        el.setAttribute("fill", "none"); el.setAttribute("stroke", gradeOf(p.grade)!.colour); el.setAttribute("stroke-width", String(width)); el.setAttribute("stroke-linecap", "round");
        el.setAttribute("stroke-opacity", f.width ? ".45" : registry ? ".6" : ".95");
        el.style.pointerEvents = registry ? "none" : "visibleStroke";
        add(el, () => openFeature(f));
      }
      if (f.points?.length === 1) { const p = screen[0], c = document.createElementNS(NS, "circle"); c.setAttribute("cx", String(p.x)); c.setAttribute("cy", String(p.y)); c.setAttribute("r", "6"); c.setAttribute("fill", colour); c.setAttribute("stroke", "white"); c.dataset.feature = f.id; add(c, () => openFeature(f)); }
    }
    if (!hidden.has("requests")) openRequests().filter(inArea).forEach((r, n) => {
      const p = xy(r.at); if (!p.visible) return;
      const colour = REQUEST_COLOUR[r.status] ?? "#666", g = document.createElementNS(NS, "g"); g.dataset.request = r.id;
      let arrow = "";
      if (r.look) {
        const q = xy(r.look), dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        const tip = { x: q.x, y: q.y }, base = { x: q.x - ux * 12, y: q.y - uy * 12 };
        arrow = `<path d="M${(p.x + ux * 12).toFixed(1)} ${(p.y + uy * 12).toFixed(1)}L${base.x.toFixed(1)} ${base.y.toFixed(1)}" stroke="${colour}" stroke-width="3" stroke-dasharray="6 3" fill="none"/>`
          + `<path d="M${tip.x.toFixed(1)} ${tip.y.toFixed(1)}L${(base.x - uy * 6).toFixed(1)} ${(base.y + ux * 6).toFixed(1)}L${(base.x + uy * 6).toFixed(1)} ${(base.y - ux * 6).toFixed(1)}Z" fill="${colour}"/>`;
      }
      g.innerHTML = arrow + `<circle cx="${p.x}" cy="${p.y}" r="11" fill="${colour}" stroke="white" stroke-width="2"/><text x="${p.x}" y="${p.y + 4.5}" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700" font-size="12">${n + 1}</text>`;
      const title = document.createElementNS(NS, "title"); title.textContent = `${n + 1}. ${r.ask}`; g.append(title);
      add(g, () => openRequest(r));
    });
    svg.replaceChildren(...shapes);
  };

  const sync = () => { button.setAttribute("aria-pressed", String(on)); if (on && !data) void load(); drawLegend(); lastKey = ""; };
  const load = () => fetch(asset("/photo-coverage.json")).then((r) => r.json()).then((d: Coverage) => { data = d; if (area && !d.areas[area]) area = ""; drawLegend(); lastKey = ""; })
    .catch(() => { legend.innerHTML = "<summary>Could not load photo-coverage.json.</summary>"; });
  button.addEventListener("click", () => { on = !on; store(ON, on); sync(); });
  sync();
  return {
    update() {
      const visible = on && options.enabled();
      svg.style.display = visible ? "" : "none"; legend.hidden = !visible;
      // The scorecard's own request pins would repeat these spots with other numbers: hide them meanwhile.
      document.body.classList.toggle("coverage-on", visible);
      if (!visible || !data) return;
      const bar = options.toolbar.getBoundingClientRect();
      // Beside the toolbar like the 'Sure / unsure' legend, and to its right when that one is open too.
      const other = document.querySelector<HTMLElement>(".confidence-legend:not([hidden])")?.getBoundingClientRect();
      legend.style.left = `${other && innerWidth >= other.right + 300 ? other.right + 8 : Math.max(8, bar.left)}px`;
      if (bar.top > innerHeight / 2) { legend.style.top = "auto"; legend.style.bottom = `${innerHeight - bar.top + 8}px`; } else { legend.style.bottom = "auto"; legend.style.top = `${bar.bottom + 8}px`; }
      const key = [[0, 0], [100, 0], [0, 100]].map(([x, z]) => { const p = options.project(x, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("|") + innerWidth + "x" + innerHeight + area + [...hidden].join();
      if (key !== lastKey) { lastKey = key; draw(); }
    },
    active: () => dialog.open,
  };
}
