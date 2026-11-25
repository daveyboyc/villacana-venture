import { asset } from "./asset";
import type { ScreenPoint } from "./references";
import type { Vec2 } from "./types";

/**
 * The 'Photo coverage' layer (public/photo-coverage.json, scripts/photo_coverage.py, docs/PHOTO_COVERAGE_PRD.md):
 * every feature drawn in the colour of how well the photos pin it down (unseen, seen, located, fixed, measured),
 * each side or end in its own grade so a hidden edge shows, plus the photo requests as numbered spots with an
 * arrow to what to photograph. Tap a feature for why and which cameras see it; tap a spot for what to take.
 * An overlay only: it builds no geometry and grants no approval. Off unless switched on or ?coverage=1 / ?requests=1.
 */
type Grade = { id: string; colour: string; meaning: string; count: number };
type Part = { part: string; grade: string; line: number[][] };
type Feature = { id: string; name: string; kind: string; category: string; areas: string[]; grade: string; computed: string;
  height: string; heightFrom?: string[]; heightCritical: boolean; nearestSolvedM?: number | null; widestSolvedAngle?: number; weakParts: string[]; why: string; solvedCameras: string[]; cited: string[];
  measuredApproval?: string; openDiscrepancies?: string[]; requests?: string[]; ring?: Vec2[]; points?: Vec2[]; width?: number; parts: Part[] };
export type CoverageRequest = { id: string; area: string; at: Vec2; look: Vec2 | null; ask: string; why: string; status: string; priority: number };
type Area = { name: string; structural: number; grades: Record<string, number>; enough: boolean; belowFixed: number; noHeightView: number };
type Coverage = { grades: Grade[]; areas: Record<string, Area>; features: Feature[]; requests: CoverageRequest[] };

const ON = "villacana-coverage-on", REQ_ON = "villacana-requests-on", HIDDEN = "villacana-coverage-hidden", AREA = "villacana-coverage-area";
const NS = "http://www.w3.org/2000/svg";
const REQUEST_COLOUR: Record<string, string> = { open: "#c92a2a", answered: "#e09a00", superseded: "#6b7280" };
const SHORT_AREA: Record<string, string> = {
  "north-pool": "North pool",
  "middle-pool": "Middle pool",
  "south-pool": "South pool",
  "main-pool": "Main pool",
  elena: "Elena",
  cervantes: "Cervantes",
  dali: "Pintor Dalí",
  picasso: "Picasso",
  "north-lanes": "North lanes",
  eva: "Eva",
  "seaward-lanes": "Seaward lanes",
  "barraka-beach": "Barraka",
  paseo: "Paseo",
};

const read = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } };
const store = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window */ } };

export function shortAreaName(areaId: string, fullName?: string): string {
  return SHORT_AREA[areaId] ?? fullName ?? areaId;
}

export function shortRequestAsk(ask: string): string {
  let s = ask.trim().split(/(?<=[.!?])\s+|;\s+/)[0] || ask.trim();
  s = s.replace(/\s*\(\d+\)\s*/g, " ").replace(/\s+/g, " ").trim().replace(/[.:;,-]+$/, "");
  const colon = s.indexOf(": ");
  if (colon > 0) {
    const head = s.slice(0, colon).trim();
    const tail = s.slice(colon + 2).trim();
    if (/^(two|three|four|one|from|at|stand|standing|near|through|where|between)\b/i.test(head) && tail.length >= 14 && !/^(what|where|which|how|its)\b/i.test(tail)) {
      s = tail;
    } else if (head.length <= 30 && tail.length >= 12) {
      s = `${head} — ${tail.replace(/^(?:one|two)\s+(?:ground\s+)?photos?\s+/i, "")}`;
    } else if (head.length >= 16) {
      s = head;
    }
  }
  s = s.replace(/^(?:from|at|near)\s+[^,]{4,42},\s+(?=(?:the|a|an|photograph|look|face|hold|square-on|side-on|both|each|one|two)\b)/i, "");
  s = s.replace(/^stand(?:ing)?\s+(?:in|on|at)\s+[^,]{4,42},\s+(?=(?:the|a|an|photograph|look|face|one|two)\b)/i, "");
  s = s.replace(/^(?:one|two|three|four)\s+(?:ground\s+)?photos?\s+(?:of\s+|at\s+)?/i, "");
  s = s.replace(/^photograph\s+/i, "");
  s = s.trim().replace(/[.:;,-]+$/, "");
  if (s) s = s[0].toUpperCase() + s.slice(1);
  return s;
}

export function coverageOverlay(options: {
  toolbar: HTMLElement;
  project: (x: number, z: number) => ScreenPoint;
  enabled: () => boolean;
  mode?: "map" | "inspect";
  currentArea?: () => string;
  onFocusSpot?: (at: Vec2, look: Vec2 | null) => void;
  onSpotsChange?: (spots: { request: CoverageRequest; number: number }[], visible: boolean) => void;
}) {
  const isInspect = options.mode === "inspect";
  const params = new URLSearchParams(location.search);
  const param = params.get("coverage");
  const reqParam = params.get("requests");
  let on = param === "1" || (param !== "0" && read(ON, false));
  let requestsOn = isInspect && (reqParam === "1" || (reqParam !== "0" && read(REQ_ON, false)));
  const hidden = new Set<string>(read<string[]>(HIDDEN, []));
  let area = params.get("coverageArea") ?? read<string>(AREA, "");
  let showDone = false;
  let liveArea = options.currentArea?.() ?? "";
  let data: Coverage | null = null, lastKey = "", lastSpotsSig = "", lastInspectDraw = 0;
  let pendingDrawTimer: number | null = null;

  const style = document.createElement("style");
  style.textContent = `
    #coverage-toggle[aria-pressed="true"], #requests-toggle[aria-pressed="true"] { background:#1f5fa8; color:white; border-color:#1f5fa8; }
    body.coverage-on #photo-spots [data-request], body.coverage-on #photo-spots-key { display:none!important; }
    .coverage-layer { position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:1; }
    .coverage-layer [data-feature], .coverage-layer [data-request] { pointer-events:visiblePainted; cursor:pointer; }
    .coverage-legend { position:fixed; left:12px; width:min(340px, calc(100vw - 24px)); max-height:54dvh; overflow:auto; box-sizing:border-box; background:#fffdf8f5; border:1px solid #c9bfae; border-radius:12px; padding:10px 12px; font:13px/1.35 system-ui, sans-serif; color:#222; z-index:9; box-shadow:0 3px 14px #0002; }
    .coverage-legend summary { font-weight:600; font-size:13px; cursor:pointer; list-style:none; }
    .coverage-legend > summary::-webkit-details-marker { display:none; }
    .coverage-legend > summary::before { content:"▸ "; color:#1f5fa8; }
    .coverage-legend[open] > summary::before { content:"▾ "; }
    .coverage-legend label { display:flex; gap:6px; align-items:flex-start; margin:5px 0; cursor:pointer; font-size:12px; }
    .coverage-legend .swatch { flex:none; width:13px; height:13px; border-radius:3px; margin-top:2px; }
    .coverage-legend small, .coverage-dialog small { color:#656158; }
    .coverage-legend select { font:13px system-ui; margin:6px 0 4px; width:100%; min-height:36px; padding:4px 8px; border:1px solid #c9bfae; border-radius:8px; background:white; box-sizing:border-box; }
    .coverage-legend .area-card { margin:4px 0 8px; padding:6px 8px; border-radius:8px; background:#f3efe6; font-size:12px; }
    .coverage-req-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:6px; margin:6px 0 4px; }
    .coverage-req-head b { font-size:12px; }
    .coverage-req-toggles { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
    .coverage-req-toggles label { margin:0; font-size:11px; align-items:center; color:#4f4b43; }
    .coverage-requests-list { display:flex; flex-direction:column; gap:2px; margin:4px 0 8px; }
    .coverage-area-head { display:flex; align-items:center; justify-content:space-between; gap:6px; margin:6px 0 2px; font-size:11px; font-weight:700; color:#5b554b; text-transform:uppercase; letter-spacing:.03em; }
    .coverage-area-head .here-pill { background:#dcebe4; color:#1c4b3c; border-radius:999px; padding:1px 6px; font-size:10px; font-weight:600; text-transform:none; letter-spacing:0; }
    .coverage-req-row { display:flex; align-items:center; gap:7px; width:100%; min-height:40px; padding:6px 7px; border:1px solid #ebe4d7; border-radius:8px; background:white; color:#222; font:inherit; text-align:left; cursor:pointer; box-sizing:border-box; }
    .coverage-req-row:hover, .coverage-req-row:focus-visible { border-color:#1f5fa8; background:#f7faff; outline:none; }
    .coverage-req-row .req-num { flex:none; min-width:22px; height:22px; padding:0 5px; box-sizing:border-box; border-radius:999px; color:white; font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; }
    .coverage-req-row .req-pri { flex:none; font-size:10px; font-weight:700; padding:1px 5px; border-radius:5px; background:#efe9dd; color:#524d43; }
    .coverage-req-row .req-pri.p1 { background:#fde3e3; color:#a11d1d; }
    .coverage-req-row .req-ask { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:13px; }
    .coverage-req-row .req-area { flex:none; font-size:11px; color:#656158; white-space:nowrap; }
    .coverage-req-row.is-done { opacity:.72; }
    .coverage-grades { margin-top:6px; border-top:1px solid #e5dfd3; padding-top:6px; }
    .coverage-grades summary { font-size:12px; font-weight:600; color:#4f4b43; }
    .coverage-dialog { border:1px solid #c9bfae; border-radius:16px; background:#fffdf8; color:#222; max-width:460px; width:calc(100vw - 32px); max-height:85dvh; padding:18px; font:14px/1.4 system-ui; z-index:20; }
    .coverage-dialog::backdrop { background:#18232f66; }
    .coverage-dialog h2 { margin:0 0 6px; font-size:17px; }
    .coverage-dialog .badge { display:inline-block; padding:2px 8px; border-radius:999px; color:white; font-weight:600; font-size:12px; margin-right:4px; }
    .coverage-dialog ul { margin:6px 0; padding-left:18px; }
    .coverage-dialog .dialog-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .coverage-dialog button { font:13px system-ui; min-height:40px; padding:6px 14px; border:1px solid #c9bfae; border-radius:8px; background:white; cursor:pointer; color:#222; }
    .coverage-dialog button.primary { background:#1f5fa8; color:white; border-color:#1f5fa8; }
    .coverage-dialog .photos { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
    .coverage-dialog .photos a { font-size:11px; color:#235f94; display:flex; flex-direction:column; gap:2px; }
    .coverage-dialog .photos img { width:92px; height:70px; object-fit:cover; border-radius:6px; }
    @media(max-width:760px) {
      .coverage-legend { left:8px !important; width:calc(100vw - 16px); max-height:46dvh; }
      body.mobile-inspect .coverage-legend { top:auto !important; bottom:calc(12px + env(safe-area-inset-bottom)) !important; left:8px !important; right:8px; width:auto; max-height:42dvh; }
    }
  `;
  document.head.append(style);

  let reqButton: HTMLButtonElement | null = null;
  if (isInspect) {
    reqButton = document.createElement("button");
    reqButton.type = "button";
    reqButton.id = "requests-toggle";
    reqButton.textContent = "Photo requests";
    options.toolbar.append(reqButton);
  }
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

  const activeCurrentArea = () => {
    const cur = area || options.currentArea?.() || liveArea;
    return cur === "whole-resort" ? "" : cur;
  };

  const orderedRequests = (): { request: CoverageRequest; number: number }[] => {
    if (!data) return [];
    const curArea = activeCurrentArea();
    const filtered = data.requests.filter((r) => inArea(r) && (showDone ? true : r.status === "open"));
    const byArea = new Map<string, CoverageRequest[]>();
    for (const r of filtered) {
      const list = byArea.get(r.area) ?? [];
      list.push(r);
      byArea.set(r.area, list);
    }
    for (const list of byArea.values()) {
      list.sort((a, b) => {
        const doneA = a.status === "open" ? 0 : a.status === "answered" ? 1 : 2;
        const doneB = b.status === "open" ? 0 : b.status === "answered" ? 1 : 2;
        if (doneA !== doneB) return doneA - doneB;
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.id.localeCompare(b.id);
      });
    }
    const groups = [...byArea.entries()].sort(([areaA, listA], [areaB, listB]) => {
      if (curArea) {
        if (areaA === curArea && areaB !== curArea) return -1;
        if (areaB === curArea && areaA !== curArea) return 1;
      }
      const priA = Math.min(...listA.map((r) => r.priority));
      const priB = Math.min(...listB.map((r) => r.priority));
      if (priA !== priB) return priA - priB;
      const openA = listA.filter((r) => r.status === "open").length;
      const openB = listB.filter((r) => r.status === "open").length;
      if (openA !== openB) return openB - openA;
      const nameA = data?.areas[areaA]?.name ?? areaA;
      const nameB = data?.areas[areaB]?.name ?? areaB;
      return nameA.localeCompare(nameB);
    });
    const out: { request: CoverageRequest; number: number }[] = [];
    let num = 1;
    for (const [, list] of groups) {
      for (const request of list) out.push({ request, number: num++ });
    }
    return out;
  };

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
    const actions = document.createElement("div"); actions.className = "dialog-actions";
    actions.append(closeButton());
    dialog.append(para(f.id + (f.measuredApproval ? ` · ${f.measuredApproval}` : ""), true), actions);
    if (!dialog.open) dialog.showModal();
  };

  const openRequest = (r: CoverageRequest, number?: number) => {
    const n = number ?? orderedRequests().find((s) => s.request.id === r.id)?.number;
    dialog.replaceChildren();
    const h = document.createElement("h2"); h.textContent = n ? `Photo spot #${n}: ${shortRequestAsk(r.ask)}` : `Photo spot: ${r.id}`;
    const b = document.createElement("span"); b.className = "badge"; b.style.background = REQUEST_COLOUR[r.status] ?? "#666";
    b.textContent = r.status === "open" ? "Photos needed" : r.status === "answered" ? "Answered · in review" : "Done · replaced";
    const areaName = data?.areas[r.area]?.name ?? r.area;
    const pri = document.createElement("span"); pri.className = "badge"; pri.style.background = r.priority === 1 ? "#8b1e1e" : "#656158"; pri.textContent = `Priority ${r.priority}`;
    const badges = document.createElement("p"); badges.append(b, pri);
    dialog.append(h, badges, para(r.ask), para(`Why: ${r.why}`, true));
    const served = data?.features.filter((f) => f.requests?.includes(r.id)) ?? [];
    if (served.length) {
      const ul = document.createElement("ul");
      for (const f of served) { const li = document.createElement("li"), a = document.createElement("a"); a.href = "#"; a.textContent = f.name; a.addEventListener("click", (e) => { e.preventDefault(); openFeature(f); }); li.append(a, " ", badge(f.grade)); ul.append(li); }
      dialog.append(para("Settles:"), ul);
    }
    dialog.append(para(`${areaName} · stand at ${r.at[0].toFixed(1)}, ${r.at[1].toFixed(1)}${r.look ? `, look towards ${r.look[0].toFixed(1)}, ${r.look[1].toFixed(1)}` : ""} (map metres)`, true));
    const actions = document.createElement("div"); actions.className = "dialog-actions";
    if (options.onFocusSpot) {
      const go = document.createElement("button"); go.type = "button"; go.className = "primary";
      go.textContent = isInspect ? "Look here in 3D" : "Show on map";
      go.addEventListener("click", () => { dialog.close(); if (innerWidth <= 760) legend.open = false; options.onFocusSpot!(r.at, r.look); });
      actions.append(go);
    }
    actions.append(closeButton());
    dialog.append(actions);
    if (!dialog.open) dialog.showModal();
  };

  const drawLegend = () => {
    if (!data) { legend.innerHTML = "<summary>Loading…</summary>"; return; }
    legend.replaceChildren();
    const ordered = orderedRequests();
    const openCount = ordered.filter((s) => s.request.status === "open").length;
    const doneInAreaCount = data.requests.filter((r) => inArea(r) && r.status !== "open").length;
    const h = document.createElement("summary");
    h.textContent = on ? `Photo coverage · ${openCount} open` : `Photo requests · ${openCount} open`;
    legend.append(h);

    const pick = document.createElement("select"); pick.id = "coverage-area"; pick.setAttribute("aria-label", "Filter photo requests by area");
    pick.append(new Option("All areas (current first)", ""), ...Object.entries(data.areas).filter(([id]) => id !== "whole-resort").map(([id, a]) => new Option(a.name, id)));
    pick.value = area; pick.addEventListener("change", () => { area = pick.value; store(AREA, area); lastKey = ""; drawLegend(); notifySpots(); });
    legend.append(pick);

    const card = data.areas[area || "whole-resort"];
    if (card && on) {
      const box = document.createElement("div"); box.className = "area-card"; box.dataset.enough = String(card.enough);
      box.innerHTML = `<b></b><br><small></small>`;
      box.querySelector("b")!.textContent = card.enough ? "Enough photos" : `Not enough yet: ${card.belowFixed} of ${card.structural} structural features below fixed` + (card.noHeightView ? `, ${card.noHeightView} without a height view` : "");
      box.querySelector("small")!.textContent = data.grades.map((g) => `${label(g.id)} ${card.grades[g.id] ?? 0}`).join(" · ");
      legend.append(box);
    }

    const reqHead = document.createElement("div"); reqHead.className = "coverage-req-head";
    const reqTitle = document.createElement("b");
    reqTitle.textContent = `Requests (${ordered.length})`;
    const reqToggles = document.createElement("div"); reqToggles.className = "coverage-req-toggles";

    const spotLbl = document.createElement("label"), spotBox = document.createElement("input");
    spotBox.type = "checkbox"; spotBox.checked = !hidden.has("requests"); spotBox.dataset.grade = "requests";
    spotBox.addEventListener("change", () => { spotBox.checked ? hidden.delete("requests") : hidden.add("requests"); store(HIDDEN, [...hidden]); lastKey = ""; notifySpots(); });
    spotLbl.append(spotBox, isInspect ? "3D spots" : "Map spots");

    const doneLbl = document.createElement("label"), doneBox = document.createElement("input");
    doneBox.type = "checkbox"; doneBox.id = "coverage-show-done"; doneBox.checked = showDone;
    doneBox.addEventListener("change", () => { showDone = doneBox.checked; lastKey = ""; drawLegend(); notifySpots(); });
    doneLbl.append(doneBox, `Answered (${doneInAreaCount})`);

    reqToggles.append(spotLbl, doneLbl);
    reqHead.append(reqTitle, reqToggles);
    legend.append(reqHead);

    const listEl = document.createElement("div"); listEl.className = "coverage-requests-list";
    const curArea = activeCurrentArea();
    let prevArea = "";
    if (!ordered.length) {
      listEl.append(para(doneInAreaCount ? "No open photo requests in this area." : "No photo requests in this area.", true));
    } else {
      for (const { request: r, number } of ordered) {
        if (r.area !== prevArea) {
          prevArea = r.area;
          const gh = document.createElement("div"); gh.className = "coverage-area-head";
          const gName = document.createElement("span"); gName.textContent = data.areas[r.area]?.name ?? r.area;
          gh.append(gName);
          if (curArea && r.area === curArea) {
            const pill = document.createElement("span"); pill.className = "here-pill"; pill.textContent = "Current area";
            gh.append(pill);
          }
          listEl.append(gh);
        }
        const row = document.createElement("button");
        row.type = "button";
        row.className = "coverage-req-row" + (r.status !== "open" ? " is-done" : "");
        row.dataset.requestRow = r.id;
        const numEl = document.createElement("span"); numEl.className = "req-num"; numEl.style.background = REQUEST_COLOUR[r.status] ?? "#666"; numEl.textContent = String(number);
        const priEl = document.createElement("span"); priEl.className = "req-pri" + (r.priority === 1 ? " p1" : ""); priEl.textContent = `P${r.priority}`;
        const askEl = document.createElement("span"); askEl.className = "req-ask"; askEl.textContent = shortRequestAsk(r.ask);
        const areaEl = document.createElement("span"); areaEl.className = "req-area"; areaEl.textContent = r.status !== "open" ? `${shortAreaName(r.area)} · ${r.status === "answered" ? "in" : "done"}` : shortAreaName(r.area, data.areas[r.area]?.name);
        row.append(numEl, priEl, askEl, areaEl);
        row.addEventListener("click", () => openRequest(r, number));
        listEl.append(row);
      }
    }
    legend.append(listEl);

    if (on) {
      const gradesBox = document.createElement("details"); gradesBox.className = "coverage-grades"; gradesBox.open = innerWidth > 600;
      const gSum = document.createElement("summary"); gSum.textContent = "Coverage grades"; gradesBox.append(gSum);
      for (const g of data.grades) {
        const row = document.createElement("label"), box = document.createElement("input"), swatch = document.createElement("span"), text = document.createElement("span");
        box.type = "checkbox"; box.checked = !hidden.has(g.id); box.dataset.grade = g.id;
        box.addEventListener("change", () => { box.checked ? hidden.delete(g.id) : hidden.add(g.id); store(HIDDEN, [...hidden]); lastKey = ""; });
        swatch.className = "swatch"; swatch.style.background = g.colour;
        const n = data.features.filter((f) => f.grade === g.id && inArea(f)).length;
        text.innerHTML = `<b></b> (${n})<br><small></small>`; text.querySelector("b")!.textContent = label(g.id); text.querySelector("small")!.textContent = g.meaning;
        row.append(box, swatch, text); gradesBox.append(row);
      }
      gradesBox.append(para("Each side of a feature takes its own colour, so a hidden edge shows. Tap an outline or a spot for details. Coverage says what the photos can support; it is not a measurement.", true));
      legend.append(gradesBox);
    }
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
    // In 3D Inspect mode, world-space 3D markers draw the spots; on the 2D Map, SVG draws them.
    if (!isInspect && !hidden.has("requests")) {
      for (const { request: r, number } of orderedRequests()) {
        if (r.status === "superseded") continue;
        const p = xy(r.at); if (!p.visible) continue;
        const colour = REQUEST_COLOUR[r.status] ?? "#666", g = document.createElementNS(NS, "g"); g.dataset.request = r.id;
        let arrow = "";
        if (r.look) {
          const q = xy(r.look), dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
          const tip = { x: q.x, y: q.y }, base = { x: q.x - ux * 12, y: q.y - uy * 12 };
          arrow = `<path d="M${(p.x + ux * 12).toFixed(1)} ${(p.y + uy * 12).toFixed(1)}L${base.x.toFixed(1)} ${base.y.toFixed(1)}" stroke="${colour}" stroke-width="3" stroke-dasharray="6 3" fill="none"/>`
            + `<path d="M${tip.x.toFixed(1)} ${tip.y.toFixed(1)}L${(base.x - uy * 6).toFixed(1)} ${(base.y + ux * 6).toFixed(1)}L${(base.x + uy * 6).toFixed(1)} ${(base.y - ux * 6).toFixed(1)}Z" fill="${colour}"/>`;
        }
        g.innerHTML = arrow + `<circle cx="${p.x}" cy="${p.y}" r="11" fill="${colour}" stroke="white" stroke-width="2"/><text x="${p.x}" y="${p.y + 4.5}" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700" font-size="12">${number}</text>`;
        const title = document.createElementNS(NS, "title"); title.textContent = `${number}. ${shortRequestAsk(r.ask)}`; g.append(title);
        add(g, () => openRequest(r, number));
      }
    }
    svg.replaceChildren(...shapes);
  };

  const notifySpots = () => {
    const active = (on || requestsOn) && options.enabled();
    const spotsVisible = active && !hidden.has("requests");
    document.body.classList.toggle("coverage-requests-on", spotsVisible);
    if (!options.onSpotsChange) return;
    if (!data || !spotsVisible) {
      if (lastSpotsSig !== "off") { lastSpotsSig = "off"; options.onSpotsChange([], false); }
      return;
    }
    const list = orderedRequests().filter((s) => s.request.status !== "superseded");
    const sig = list.map((s) => `${s.number}:${s.request.id}:${s.request.status}`).join("|");
    if (sig !== lastSpotsSig) {
      lastSpotsSig = sig;
      options.onSpotsChange(list, true);
    }
  };

  let loading = false;
  const load = () => {
    if (loading || data) return;
    loading = true;
    void fetch(asset("/photo-coverage.json")).then((r) => r.json()).then((d: Coverage) => {
      data = d;
      if (area && !d.areas[area]) area = "";
      drawLegend();
      lastKey = "";
      notifySpots();
    }).catch(() => { legend.innerHTML = "<summary>Could not load photo-coverage.json.</summary>"; });
  };

  const sync = () => {
    button.setAttribute("aria-pressed", String(on));
    reqButton?.setAttribute("aria-pressed", String(requestsOn));
    if ((on || requestsOn) && !data) load();
    drawLegend();
    lastKey = "";
    notifySpots();
  };

  button.addEventListener("click", () => {
    on = !on;
    store(ON, on);
    if (on && innerWidth <= 760) legend.open = true;
    sync();
  });
  reqButton?.addEventListener("click", () => {
    requestsOn = !requestsOn;
    store(REQ_ON, requestsOn);
    if (requestsOn) legend.open = true;
    sync();
  });

  sync();

  return {
    update() {
      const enabled = options.enabled();
      const coverageVisible = on && enabled;
      const panelVisible = (on || requestsOn) && enabled;
      svg.style.display = coverageVisible ? "" : "none";
      legend.hidden = !panelVisible;
      // The scorecard's own request pins would repeat these spots with other numbers: hide them meanwhile.
      document.body.classList.toggle("coverage-on", coverageVisible);
      notifySpots();
      if (!panelVisible || !data) return;
      const bar = options.toolbar.getBoundingClientRect();
      if (bar.height > 0) {
        // Beside the toolbar like the 'Sure / unsure' legend, and to its right when that one is open too.
        const other = document.querySelector<HTMLElement>(".confidence-legend:not([hidden])")?.getBoundingClientRect();
        legend.style.left = `${other && innerWidth >= other.right + 300 ? other.right + 8 : Math.max(8, bar.left)}px`;
        if (bar.top > innerHeight / 2) { legend.style.top = "auto"; legend.style.bottom = `${innerHeight - bar.top + 8}px`; }
        else { legend.style.bottom = "auto"; legend.style.top = `${bar.bottom + 8}px`; }
      }
      if (!coverageVisible) return;
      const key = [[0, 0], [100, 0], [0, 100]].map(([x, z]) => { const p = options.project(x, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("|") + innerWidth + "x" + innerHeight + area + String(showDone) + [...hidden].join();
      if (key !== lastKey) {
        lastKey = key;
        if (!isInspect) {
          draw();
        } else {
          const now = performance.now();
          if (now - lastInspectDraw > 140) {
            lastInspectDraw = now;
            draw();
          } else {
            if (pendingDrawTimer !== null) clearTimeout(pendingDrawTimer);
            pendingDrawTimer = window.setTimeout(() => { pendingDrawTimer = null; lastInspectDraw = performance.now(); draw(); }, 150);
          }
        }
      }
    },
    active: () => dialog.open,
    openRequest(id: string) {
      const match = orderedRequests().find((s) => s.request.id === id);
      if (match) { openRequest(match.request, match.number); return; }
      const raw = data?.requests.find((r) => r.id === id);
      if (raw) openRequest(raw);
    },
    toggleRequests(force?: boolean) {
      requestsOn = force ?? !requestsOn;
      store(REQ_ON, requestsOn);
      if (requestsOn) legend.open = true;
      sync();
    },
    requestsVisible: () => (on || requestsOn) && !hidden.has("requests"),
    setCurrentArea(nextArea: string) {
      const clean = nextArea === "whole-resort" ? "" : nextArea;
      if (clean === liveArea) return;
      liveArea = clean;
      if (!area && data && (on || requestsOn)) {
        drawLegend();
        lastKey = "";
        notifySpots();
      }
    },
  };
}
