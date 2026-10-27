import { asset } from "./asset";

/**
 * The area scorecard (public/scorecard.json, scripts/build_scorecard.py) for the area the player
 * stands in, or the overview's centre. A panel only: it builds no geometry. Collapsed on small
 * screens; off in automated renders (?photocam=, a webdriver) unless the link has ?scorecard=1.
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
};
type Scorecard = { measuredAt: string | null; grid: { x0: number; z0: number; step: number; nx: number; nz: number; areas: string[]; rows: string[] }; areas: Card[] };

const TABLE = "https://github.com/daveyboyc/villacana-venture/blob/main/refs/SCORECARD.md";
const WHOLE = "whole-resort";

export function areaScorecard(): { update(x: number, z: number): void } {
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

  function render(card: Card, between: boolean) {
    summary.textContent = `Scorecard · ${card.name}${between ? " (between areas)" : ""}`;
    panel.dataset.area = card.id;
    const list = document.createElement("ul");
    for (const line of card.status) { const li = document.createElement("li"); li.textContent = line; list.append(li); }
    const table = document.createElement("table"), l = card.levels;
    if (l.ground) table.append(cell("Open ground", `${Math.round(l.ground.within25cm * 100)}% within 0.25 m (${l.ground.cells} cells)`));
    if (l.streets) table.append(cell("Worst street", `${l.streets.worstMiss.toFixed(2)} m, ${l.streets.worstStreet}`));
    for (const p of l.poolDecks) table.append(cell(`${p.pool} pool deck`, metres(p.miss)));
    if (l.roofs) table.append(cell("Roofs", `${l.roofs.measured} measured, median ${metres(l.roofs.medianMiss)}`));
    if (card.plan?.fit !== undefined) table.append(cell("Footprint fit", `${card.plan.fit.toFixed(2)}, best shift ${card.plan.east} m E ${card.plan.south} m S`));
    const ph = card.photos;
    if (ph.heldOutMisfitM.length) table.append(cell("Held-out misfit", ph.heldOutMisfitM.map((m) => `${m.toFixed(2)} m`).join(", ")));
    if (ph.stationsHolding.length) table.append(cell("Stations holding", ph.stationsHolding.join(", ")));
    if (card.discrepancies.length) table.append(cell("Discrepancies", card.discrepancies.map((d) => d.id).join(", ")));
    table.append(cell("Tasks", `${card.tasks.open} open, ${card.tasks.inProgress} in progress`));
    const links = document.createElement("div");
    links.className = "links";
    for (const [text, href] of [["Area brief", card.brief], ["All areas", TABLE]]) {
      const a = document.createElement("a");
      a.textContent = text; a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
      links.append(a);
    }
    const note = document.createElement("div");
    note.className = "note";
    note.textContent = `Survey measured ${data?.measuredAt ?? "never"}. Counts and measurements only; see docs/SCORECARD.md.`;
    body.replaceChildren(list, table, links, note);
  }

  return {
    update(x: number, z: number) {
      if (!data) return;
      const g = data.grid, i = Math.floor((x - g.x0) / g.step), k = Math.floor((z - g.z0) / g.step);
      const code = i >= 0 && i < g.nx && k >= 0 && k < g.nz ? g.rows[k][i] : ".";
      const id = code === "." ? WHOLE : g.areas[code.charCodeAt(0) - 97];
      if (id === shown) return;
      shown = id;
      const card = data.areas.find((a) => a.id === id);
      if (card) render(card, id === WHOLE);
    },
  };
}
