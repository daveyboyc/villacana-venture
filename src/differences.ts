import { asset } from "./asset";
import type { ScreenPoint } from "./references";
import type { Vec2 } from "./types";

/**
 * The 'Differences' map layer: every difference between the model and the photos recorded in
 * data/discrepancies.json (docs/DISCREPANCIES.md), read from public/scorecard.json. A numbered pin at
 * the map position cast through the photo's solved camera, a dashed ring of its uncertainty, coloured
 * by kind and faded once fixed, closed or won't fix. Tap a pin for what differs and the photos that
 * show it. An overlay only: it builds no geometry. Off unless switched on or the link has ?differences=1.
 */
type Item = { id: string; label: string; area: string; kind: string; status: string; description: string; at: Vec2 | null; uncertaintyM: number | null; photos: string[] };
type Card = { id: string; name: string; brief: string; photoDiscrepancies?: { open: number; items: Item[] } };

export const KIND_COLOURS: Record<string, string> = { missing: "#d6336c", extra: "#e8590c", shape: "#1c7ed6", position: "#9c36b5", look: "#2b8a3e" };
const ON = "villacana-differences-on";
const NS = "http://www.w3.org/2000/svg";
const read = (): boolean => { try { return localStorage.getItem(ON) === "true"; } catch { return false; } };
const store = (on: boolean) => { try { localStorage.setItem(ON, String(on)); } catch { /* per-viewer convenience only */ } };

export function differencesOverlay(options: { toolbar: HTMLElement; project: (x: number, z: number) => ScreenPoint; enabled: () => boolean }) {
  const param = new URLSearchParams(location.search).get("differences");
  let on = param === "1" || (param !== "0" && read());
  let items: Item[] = [], briefs = new Map<string, Card>(), loaded = false, lastKey = "";

  const style = document.createElement("style");
  style.textContent = `
    #differences-toggle[aria-pressed="true"] { background:#9c36b5; color:white; border-color:#9c36b5; }
    .differences-layer { position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:1; }
    .differences-layer [data-discrepancy] { pointer-events:visiblePainted; cursor:pointer; }
    .differences-dialog { border:1px solid #c9bfae; border-radius:16px; background:#fffdf8; color:#222; max-width:460px; width:calc(100vw - 48px); max-height:85dvh; padding:18px; font:14px/1.4 system-ui; }
    .differences-dialog::backdrop { background:#18232f66; }
    .differences-dialog h2 { margin:0 0 6px; font-size:17px; }
    .differences-dialog .badge { display:inline-block; padding:2px 8px; border-radius:999px; color:white; font-weight:600; font-size:12px; margin-right:6px; }
    .differences-dialog .photos { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
    .differences-dialog .photos a { font-size:11px; color:#235f94; display:flex; flex-direction:column; gap:2px; }
    .differences-dialog .photos img { width:92px; height:70px; object-fit:cover; border-radius:6px; }
    .differences-dialog button { font:12px system-ui; padding:6px 10px; border:1px solid #c9bfae; border-radius:7px; background:white; cursor:pointer; }
  `;
  document.head.append(style);
  const button = document.createElement("button");
  button.type = "button"; button.id = "differences-toggle"; button.textContent = "Differences";
  button.title = "Differences between the model and the photos (data/discrepancies.json), numbered as in the comparison images";
  options.toolbar.append(button);
  const svg = document.createElementNS(NS, "svg"); svg.classList.add("differences-layer"); document.body.append(svg);
  const dialog = document.createElement("dialog"); dialog.className = "differences-dialog"; document.body.append(dialog);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  const open = (d: Item) => {
    dialog.replaceChildren();
    const h = document.createElement("h2"); h.textContent = `${d.label} · ${d.id}`;
    const kind = document.createElement("span"); kind.className = "badge"; kind.style.background = KIND_COLOURS[d.kind] ?? "#555"; kind.textContent = d.kind;
    const status = document.createElement("span"); status.className = "badge"; status.style.background = d.status === "open" ? "#c92a2a" : "#868e96"; status.textContent = d.status === "wont-fix" ? "won't fix" : d.status;
    const what = document.createElement("p"); what.textContent = d.description;
    const where = document.createElement("p"); where.innerHTML = "<small></small>";
    where.querySelector("small")!.textContent = d.at ? `Map position ${d.at[0].toFixed(1)}, ${d.at[1].toFixed(1)} ± ${d.uncertaintyM?.toFixed(1)} m, from the camera ray through the photo.` : "No map position: nothing in the photo shows where it meets the ground.";
    const photos = document.createElement("div"); photos.className = "photos";
    for (const file of d.photos) {
      const a = document.createElement("a"), img = document.createElement("img"), cap = document.createElement("span");
      a.href = asset(`/photos-ref/${file}`); a.target = "_blank"; a.rel = "noopener";
      img.src = asset(`/photos-ref/thumbs/${file}`); img.alt = file; img.loading = "lazy"; img.onerror = () => img.remove();
      cap.textContent = file.replace(/\.jpg$/, ""); a.append(img, cap); photos.append(a);
    }
    const brief = briefs.get(d.area), link = document.createElement("a");
    if (brief) { link.href = brief.brief; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = `${brief.name}: all differences in the area brief`; }
    const close = document.createElement("button"); close.type = "button"; close.textContent = "Close"; close.addEventListener("click", () => dialog.close());
    dialog.append(h, kind, status, what, where, photos, ...(brief ? [link, document.createElement("br")] : []), close);
    if (!dialog.open) dialog.showModal();
  };

  const draw = () => {
    const shapes: SVGElement[] = [];
    for (const d of items) {
      if (!d.at) continue;
      const p = options.project(d.at[0], d.at[1]);
      if (!p.visible) continue;
      const colour = KIND_COLOURS[d.kind] ?? "#555", done = d.status !== "open";
      const g = document.createElementNS(NS, "g"); g.dataset.discrepancy = d.id; g.dataset.status = d.status;
      if (done) g.setAttribute("opacity", ".45");
      if (d.uncertaintyM) {
        const edge = options.project(d.at[0] + d.uncertaintyM, d.at[1]);
        const ring = document.createElementNS(NS, "circle");
        ring.setAttribute("cx", String(p.x)); ring.setAttribute("cy", String(p.y)); ring.setAttribute("r", String(Math.max(6, Math.hypot(edge.x - p.x, edge.y - p.y))));
        ring.setAttribute("fill", "none"); ring.setAttribute("stroke", colour); ring.setAttribute("stroke-width", "1.5"); ring.setAttribute("stroke-dasharray", "4 3");
        ring.style.pointerEvents = "none"; g.append(ring);
      }
      const dot = document.createElementNS(NS, "rect");
      dot.setAttribute("x", String(p.x - 14)); dot.setAttribute("y", String(p.y - 9)); dot.setAttribute("width", "28"); dot.setAttribute("height", "18"); dot.setAttribute("rx", "5");
      dot.setAttribute("fill", colour); dot.setAttribute("stroke", "white"); dot.setAttribute("stroke-width", "1.5");
      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", String(p.x)); text.setAttribute("y", String(p.y + 4)); text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "white"); text.setAttribute("font-family", "system-ui"); text.setAttribute("font-weight", "700"); text.setAttribute("font-size", "11");
      text.textContent = d.label;
      const title = document.createElementNS(NS, "title"); title.textContent = `${d.label} ${d.kind} (${d.status}): ${d.description}`;
      g.append(dot, text, title);
      g.addEventListener("click", () => open(d)); g.addEventListener("pointerdown", (e) => e.stopPropagation());
      shapes.push(g);
    }
    svg.replaceChildren(...shapes);
  };

  const load = () => fetch(asset("/scorecard.json")).then((r) => r.json()).then((card: { areas: Card[] }) => {
    const whole = card.areas.find((a) => a.id === "whole-resort");
    items = whole?.photoDiscrepancies?.items ?? [];
    briefs = new Map(card.areas.map((a) => [a.id, a]));
    loaded = true; lastKey = "";
    button.textContent = `Differences (${whole?.photoDiscrepancies?.open ?? 0})`;
  }).catch(() => { button.textContent = "Differences (unavailable)"; });
  const sync = () => { button.setAttribute("aria-pressed", String(on)); if (on && !loaded) void load(); lastKey = ""; };
  button.addEventListener("click", () => { on = !on; store(on); sync(); });
  sync();
  return {
    update() {
      const visible = on && options.enabled();
      svg.style.display = visible ? "" : "none";
      if (!visible || !loaded) return;
      const key = [[0, 0], [100, 0], [0, 100]].map(([x, z]) => { const p = options.project(x, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("|") + innerWidth + "x" + innerHeight;
      if (key !== lastKey) { lastKey = key; draw(); }
    },
    active: () => dialog.open,
  };
}
