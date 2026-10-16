// The photo map page (photos.html). Data: public/photo-map.json from scripts/build_photo_map.py.
(async () => {

const DATA = await (await fetch("./photo-map.json")).json();
for (const p of DATA.photos) p.img = "./photos-ref/thumbs/" + p.f;
const NAMES = { dali: "Pintor Dalí", cervantes: "Cervantes", "elena-north": "Elena north", "elena-south": "Elena south", eva: "Eva", picasso: "Pintor Picasso", "picasso-access": "Picasso access", loira: "Loira", bolivia: "Bolivia", isabel: "Isabel", alberto: "Alberto", patricia: "Patricia", "silvia-north": "Silvia north", "silvia-south": "Silvia south", jorge: "Jorge", "teodoro-rojo": "Teodoro Rojo", guillermo: "Guillermo", "eva-west-footpath": "Eva west footpath" };
const Q = { checked: ["Checked against photo", "var(--checked)"], good: ["GPS ±5 m or better", "var(--good)"], fair: ["GPS ±5–10 m", "var(--fair)"], poor: ["GPS worse than ±10 m", "var(--poor)"], none: ["No GPS", "var(--none)"] };
const VIEW = { ground: "Ground level", "upper-floor": "Upper floor", roof: "Roof" };
const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
const path = (r, close = true) => "M" + r.map((p) => p[0] + " " + p[1]).join("L") + (close ? "Z" : "");
const areaName = Object.fromEntries(DATA.areas.map((a) => [a.id, a.name]));
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

// ---- state
let selected = null, area = store.get("vpm-area") || "all", qFilter = new Set(Object.keys(Q)), onlyOpen = false;
const reviews = new Map(); // photo id -> saved review
let placing = null; // { id, step: "stand" | "point", at, heading }
const ROT = DATA.geo.rotation * Math.PI / 180, CR = Math.cos(ROT), SR = Math.sin(ROT);
const toTurned = (x, z) => [x * CR - z * SR, x * SR + z * CR];
const fromTurned = (tx, tz) => [tx * CR + tz * SR, -tx * SR + tz * CR];
const moveOf = (id) => { const r = reviews.get(id); return r && r.verdict === "moved" && Number.isFinite(r.x) ? toTurned(r.x, r.z) : null; };
const layers = { cov: true, acc: true, look: false };

// ---- map
const svg = $("map");
const all = DATA.geo.buildings.flatMap((b) => b.r).concat(DATA.geo.paseo);
const ext = { x0: Math.min(...all.map((p) => p[0])) - 8, x1: Math.max(...all.map((p) => p[0])) + 8, z0: Math.min(...all.map((p) => p[1])) - 8, z1: Math.max(...all.map((p) => p[1])) + 8 };
let vb = { x: ext.x0, y: ext.z0, w: ext.x1 - ext.x0, h: ext.z1 - ext.z0 };
const g = el("g", {}, svg);
const gBase = el("g", {}, g), gLanes = el("g", {}, g), gCov = el("g", {}, g), gHouses = el("g", {}, g), gLabels = el("g", {}, g), gLook = el("g", {}, g), gAcc = el("g", {}, g), gGhost = el("g", {}, g), gPins = el("g", {}, g);
for (const r of DATA.geo.sea) el("path", { d: path(r), fill: "var(--sea)" }, gBase);
for (const r of DATA.geo.beach) el("path", { d: path(r), fill: "var(--sand)" }, gBase);
el("path", { d: path(DATA.geo.paseo, false), fill: "none", stroke: "var(--lane)", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: .75 }, gLanes);
for (const r of DATA.geo.roads) el("path", { d: path(r.p, false), fill: "none", stroke: "var(--lane)", "stroke-width": Math.max(1.4, r.w), "stroke-linecap": "round", "stroke-linejoin": "round" }, gLanes);
for (const b of DATA.geo.buildings) el("path", { d: path(b.r), fill: b.f > 0 ? "var(--house)" : "none", stroke: "var(--house-edge)", "stroke-width": 1, "vector-effect": "non-scaling-stroke", "stroke-dasharray": b.f > 0 ? "" : "3 2" }, gHouses);
for (const p of DATA.geo.pools) el("path", { d: path(p.r), fill: "var(--pool)", stroke: "var(--house-edge)", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, gHouses);
const covColor = (c) => c >= 3 ? "var(--cov-3)" : c >= 1 ? "var(--cov-1)" : "var(--cov-0)";
for (const r of DATA.geo.cov) for (const s of r.s) el("line", { x1: s[0], y1: s[1], x2: s[2], y2: s[3], stroke: covColor(s[4]), "stroke-width": 5, "vector-effect": "non-scaling-stroke", "stroke-linecap": "butt", "stroke-dasharray": s[4] ? "" : "5 3", opacity: .9 }, gCov);
// labels: lanes at their middle, pools beside the water
const midOf = (pts) => { const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])); let half = L.reduce((a, b) => a + b, 0) / 2; for (let i = 0; i < L.length; i++) { if (half <= L[i]) { const t = half / L[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]; } half -= L[i]; } return pts[0]; };
const label = (txt, p, size) => { const t = el("text", { x: p[0], y: p[1], "data-px": size, "text-anchor": "middle", fill: "var(--ink)", stroke: "var(--panel)", "stroke-width": size / 4, "paint-order": "stroke", "font-family": "Barlow Semi Condensed, Arial Narrow, sans-serif", "font-weight": 600 }, gLabels); t.textContent = txt; };
for (const r of DATA.geo.roads) if (NAMES[r.id]) label(NAMES[r.id], midOf(r.p), 12);
for (const p of DATA.geo.pools) { const c = p.r.reduce((a, q) => [a[0] + q[0] / p.r.length, a[1] + q[1] / p.r.length], [0, 0]); label({ toddler: "Children's pool" }[p.id] || p.id[0].toUpperCase() + p.id.slice(1) + " pool", [c[0], Math.min(...p.r.map((q) => q[1])) - 2], 13); }

const placed = DATA.photos.filter((p) => p.c);
const pinEls = new Map();
for (const p of placed) {
  const colour = Q[p.q][1], high = p.v === "roof" || p.v === "upper-floor";
  const grp = el("g", { class: "pin", tabindex: 0, role: "button", "aria-label": p.id + ": " + p.t }, gPins); grp.dataset.c = p.c.join(",");
  const acc = el("circle", { cx: p.c[0], cy: p.c[1], r: p.a || 0, fill: colour, "fill-opacity": .07, stroke: colour, "stroke-opacity": .45, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, gAcc);
  let look = null;
  if (p.l) look = el("line", { x1: p.c[0], y1: p.c[1], x2: p.l[0], y2: p.l[1], stroke: colour, "stroke-width": 1.4, "vector-effect": "non-scaling-stroke", "stroke-dasharray": high ? "4 3" : "", opacity: .8 }, gLook);
  if (p.h != null) { const H = (p.h + DATA.geo.rotation) * Math.PI / 180, dx = Math.sin(H), dz = -Math.cos(H); el("line", { x1: 0, y1: 0, x2: dx * 13, y2: dz * 13, stroke: colour, "stroke-width": 2.4, "stroke-linecap": "round" }, grp); }
  const mark = high ? el("rect", { x: -4.5, y: -4.5, width: 9, height: 9, fill: "var(--panel)", stroke: colour, "stroke-width": 2.4 }, grp) : el("circle", { cx: 0, cy: 0, r: 5, fill: colour, stroke: "var(--panel)", "stroke-width": 1.6 }, grp);
  const badge = el("circle", { cx: 0, cy: 0, r: 8.5, fill: "none", stroke: "var(--accent)", "stroke-width": 2.6, visibility: "hidden" }, grp);
  el("circle", { cx: 0, cy: 0, r: 12, fill: "transparent" }, grp); // easier to tap
  grp.addEventListener("click", (e) => { if (moved || placing) return; e.stopPropagation(); select(p.id); });
  grp.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(p.id); } });
  pinEls.set(p.id, { grp, acc, look, mark, badge, p });
}
const ringG = el("g", { visibility: "hidden" }, g); el("circle", { r: 11, fill: "none", stroke: "var(--accent)", "stroke-width": 3 }, ringG);
const draftG = el("g", { visibility: "hidden" }, g); el("circle", { r: 7, fill: "var(--accent)", stroke: "var(--panel)", "stroke-width": 2.5 }, draftG); const draftDir = el("line", { x1: 0, y1: 0, x2: 0, y2: -22, stroke: "var(--accent)", "stroke-width": 3, "stroke-linecap": "round", visibility: "hidden" }, draftG);
const ringLook = el("line", { stroke: "var(--accent)", "stroke-width": 2.5, "vector-effect": "non-scaling-stroke", visibility: "hidden" }, g);

let ringAt = null;
function applyView() {
  svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const r = svg.getBoundingClientRect(); if (!r.width) return;
  const s = Math.max(vb.w / r.width, vb.h / r.height);
  // Pins, labels and the selection ring keep their size on screen; the map scales under them.
  for (const { grp, p } of pinEls.values()) { const c = moveOf(p.id) || p.c; grp.setAttribute("transform", `translate(${c[0]} ${c[1]}) scale(${s})`); }
  if (placing?.at) draftG.setAttribute("transform", `translate(${placing.at[0]} ${placing.at[1]}) scale(${s}) rotate(${placing.heading ?? 0})`);
  if (ringAt) ringG.setAttribute("transform", `translate(${ringAt[0]} ${ringAt[1]}) scale(${s})`);
  for (const t of gLabels.children) { t.setAttribute("font-size", t.dataset.px * s); t.setAttribute("stroke-width", t.dataset.px * s / 3.5); }
  gLabels.style.display = s > 0.9 ? "none" : "";
}
function fit(box) { const r = svg.getBoundingClientRect(), aspect = r.width / Math.max(1, r.height); let { x0, x1, z0, z1 } = box; let w = x1 - x0, h = z1 - z0; if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; z0 -= (nh - h) / 2; h = nh; } vb = { x: x0, y: z0, w, h }; applyView(); }
function zoom(f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) { const w = Math.min(Math.max(vb.w * f, 12), (ext.x1 - ext.x0) * 2.5); const k = w / vb.w; vb = { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w, h: vb.h * k }; applyView(); }
const toMap = (cx, cy) => { const r = svg.getBoundingClientRect(); const s = Math.max(vb.w / r.width, vb.h / r.height); const ox = vb.x + (vb.w - r.width * s) / 2, oy = vb.y + (vb.h - r.height * s) / 2; return [ox + (cx - r.left) * s, oy + (cy - r.top) * s, s]; };
$("zin").onclick = () => zoom(.6); $("zout").onclick = () => zoom(1 / .6); $("zfit").onclick = () => fit(ext);
svg.addEventListener("wheel", (e) => { e.preventDefault(); const [x, y] = toMap(e.clientX, e.clientY); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, x, y); }, { passive: false });
const pointers = new Map(); let moved = false, start = null;
svg.addEventListener("pointerdown", (e) => { pointers.set(e.pointerId, [e.clientX, e.clientY]); moved = false; start = { vb: { ...vb }, pts: [...pointers.values()].map((p) => [...p]) }; svg.setPointerCapture?.(e.pointerId); svg.classList.add("dragging"); });
svg.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, [e.clientX, e.clientY]);
  const pts = [...pointers.values()], r = svg.getBoundingClientRect(), s = Math.max(start.vb.w / r.width, start.vb.h / r.height);
  if (pts.length === 1 && start.pts.length === 1) { const dx = pts[0][0] - start.pts[0][0], dy = pts[0][1] - start.pts[0][1]; if (Math.hypot(dx, dy) > 4) moved = true; vb = { ...start.vb, x: start.vb.x - dx * s, y: start.vb.y - dy * s }; applyView(); }
  else if (pts.length >= 2 && start.pts.length >= 2) { moved = true; const d0 = Math.hypot(start.pts[0][0] - start.pts[1][0], start.pts[0][1] - start.pts[1][1]), d1 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]); const k = d0 / Math.max(1, d1); vb = { ...start.vb }; const m = [(start.pts[0][0] + start.pts[1][0]) / 2, (start.pts[0][1] + start.pts[1][1]) / 2]; const [cx, cy] = toMap(m[0], m[1]); zoom(k, cx, cy); }
});
const up = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) svg.classList.remove("dragging"); start = { vb: { ...vb }, pts: [...pointers.values()].map((p) => [...p]) }; setTimeout(() => { if (!pointers.size) moved = false; }, 0); };
svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);

// ---- layers and filters
function setLayer(btn, key, group) { btn.onclick = () => { layers[key] = !layers[key]; btn.setAttribute("aria-pressed", layers[key]); group.style.display = layers[key] ? "" : "none"; }; group.style.display = layers[key] ? "" : "none"; }
setLayer($("lCov"), "cov", gCov); setLayer($("lAcc"), "acc", gAcc); setLayer($("lLook"), "look", gLook);
const counts = {}; for (const p of DATA.photos) counts[p.q] = (counts[p.q] || 0) + 1;
for (const k of Object.keys(Q)) {
  if (!counts[k]) continue;
  const b = document.createElement("button"); b.className = "chip"; b.setAttribute("aria-pressed", "true");
  b.innerHTML = `<span class="dot" style="background:${Q[k][1]}"></span>${Q[k][0]} <span class="n">${counts[k]}</span>`;
  b.onclick = () => { if (qFilter.has(k)) qFilter.delete(k); else qFilter.add(k); b.setAttribute("aria-pressed", qFilter.has(k)); refresh(); };
  $("tally").appendChild(b);
}
const inArea = (p) => area === "all" || p.s.includes(area);
function refresh() {
  for (const { grp, acc, look, p } of pinEls.values()) { const on = qFilter.has(p.q) && (!onlyOpen || !reviews.has(p.id)), hi = inArea(p); const op = !on ? 0 : hi ? 1 : .18; grp.style.opacity = op; acc.style.opacity = on && hi ? 1 : 0; if (look) look.style.opacity = on && hi ? .8 : 0; grp.style.pointerEvents = on ? "" : "none"; }
  renderArea();
}

// ---- areas
const areaList = [{ id: "all", name: "All photos" }, ...DATA.areas.filter((a) => DATA.photos.some((p) => p.s.includes(a.id)))];
for (const a of areaList) { const n = a.id === "all" ? DATA.photos.length : DATA.photos.filter((p) => p.s.includes(a.id)).length; const b = document.createElement("button"); b.className = "chip"; b.dataset.id = a.id; b.innerHTML = `${a.name} <span class="n">${n}</span>`; b.onclick = () => { area = a.id; store.set("vpm-area", area); refresh(); zoomToArea(); }; $("areas").appendChild(b); }
if (!areaList.some((a) => a.id === area)) area = "all";
function zoomToArea() { const ps = DATA.photos.filter((p) => inArea(p) && p.c).flatMap((p) => [p.c, ...(p.l ? [p.l] : [])]); if (area === "all" || ps.length < 2) { fit(ext); return; } const xs = ps.map((p) => p[0]), zs = ps.map((p) => p[1]); fit({ x0: Math.min(...xs) - 25, x1: Math.max(...xs) + 25, z0: Math.min(...zs) - 25, z1: Math.max(...zs) + 25 }); }
function renderArea() {
  for (const b of $("areas").children) b.setAttribute("aria-pressed", b.dataset.id === area);
  const ps = DATA.photos.filter((p) => inArea(p) && qFilter.has(p.q) && (!onlyOpen || !reviews.has(p.id)));
  const by = (k) => ps.filter((p) => p.q === k).length, ground = ps.filter((p) => p.v === "ground").length, high = ps.length - ground;
  const meta = DATA.areas.find((a) => a.id === area);
  const bar = Object.keys(Q).filter((k) => by(k)).map((k) => `<span style="width:${by(k) / Math.max(1, ps.length) * 100}%;background:${Q[k][1]}" title="${Q[k][0]}: ${by(k)}"></span>`).join("");
  $("areaSum").innerHTML = `${meta ? `<p class="note">${meta.sum}</p>` : ""}<p class="obs"><b>${ps.length}</b> photos: ${ground} at ground level, ${high} from a roof or upper floor. ${by("poor") + by("none") ? `<b>${by("poor") + by("none")}</b> without a usable pin.` : "All have usable pins."}</p><div class="bar" aria-hidden="true">${bar}</div>`;
  $("thumbs").innerHTML = "";
  for (const p of ps) { const b = document.createElement("button"); b.className = "thumb"; b.setAttribute("aria-label", p.id + ": " + p.t); if (p.id === selected) b.setAttribute("aria-current", "true"); b.innerHTML = `<img src="${p.img}" alt="" loading="lazy"><span class="tag"><span class="dot" style="background:${Q[p.q][1]};width:7px;height:7px"></span>${p.id.startsWith("IMG_") ? p.id.slice(4) : "no GPS"}</span>${reviews.has(p.id) ? `<span class="rv">${VERDICT[reviews.get(p.id).verdict]?.[1] || "Note"}</span>` : ""}`; b.onclick = () => { select(p.id); $("mapbox").scrollIntoView({ behavior: "smooth", block: "nearest" }); }; $("thumbs").appendChild(b); }
}

// ---- detail
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function pinText(p) {
  if (p.q === "none") return "No location in the file. It is listed by what it shows only.";
  if (p.q === "checked") return "Moved or confirmed by matching what the photo shows to the map; the original GPS is kept.";
  const high = p.v !== "ground" ? " Taken from a roof or upper floor, so the pin sits inside a building; the subject is along the line." : "";
  if (p.q === "poor") return `The phone reported ±${p.a} m, too vague to place it on a lane. Placed by what it shows instead.` + high;
  return `The phone reported ±${p.a} m.` + high;
}
function select(id) {
  selected = id; const p = DATA.photos.find((x) => x.id === id); if (!p) return;
  const q = Q[p.q];
  $("detail").innerHTML = `<img src="${p.img}" alt="${esc(p.t)}"><p class="title">${esc(p.t)}</p>
  <div><span class="pill" style="--q:${q[1]}"><span class="dot" style="background:${q[1]};width:8px;height:8px"></span>${q[0]}</span></div>
  <dl class="kv"><dt>Photo</dt><dd class="mono">${esc(p.id)}</dd><dt>Shows</dt><dd>${p.s.map((a) => esc(areaName[a] || a)).join(", ") || "not tagged"}</dd><dt>Taken from</dt><dd>${VIEW[p.v] || "not reviewed"}</dd>${p.sub ? `<dt>Looks at</dt><dd>${esc(p.sub)}</dd>` : ""}<dt>Use for</dt><dd>${p.u.join(", ") || "not reviewed"}</dd></dl>
  <p class="note">${esc(pinText(p))}</p><p class="obs">${esc(p.o)}</p>${p.n ? `<p class="note">${esc(p.n)}</p>` : ""}
  <div class="btns"><button class="btn" id="openPhoto">Open photo</button>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">Original in Google Drive</a>` : ""}</div>
  <div class="review" id="review"></div>`;
  $("openPhoto").onclick = () => openPhoto(p);
  $("detail").querySelector("img").onclick = () => openPhoto(p); $("detail").querySelector("img").style.cursor = "zoom-in";
  renderReview(p);
  const pe = pinEls.get(id);
  if (pe) { const pc = moveOf(p.id) || p.c; ringAt = pc; ringG.setAttribute("visibility", "visible"); applyView(); if (p.l && !moveOf(p.id)) { ringLook.setAttribute("x1", pc[0]); ringLook.setAttribute("y1", pc[1]); ringLook.setAttribute("x2", p.l[0]); ringLook.setAttribute("y2", p.l[1]); ringLook.setAttribute("visibility", "visible"); } else ringLook.setAttribute("visibility", "hidden");
    const [cx, cy] = pc; if (cx < vb.x || cx > vb.x + vb.w || cy < vb.y || cy > vb.y + vb.h) { vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2; applyView(); } }
  else { ringAt = null; ringG.setAttribute("visibility", "hidden"); ringLook.setAttribute("visibility", "hidden"); }
  for (const b of $("thumbs").children) b.setAttribute("aria-current", b.getAttribute("aria-label").startsWith(id + ":"));
}
$("detail").innerHTML = `<p class="empty">Tap a pin or a thumbnail to see the photo, where it was taken from and how sure the position is.</p>`;
const VERDICT = { correct: ["Position is right", "Right"], moved: ["Pin moved", "Moved"], unsure: ["Not sure", "Unsure"], note: ["Note only", "Note"] };

// ---- full-size photo
function openPhoto(p) { const lb = $("lightbox"); lb.classList.remove("zoomed"); $("lbZoom").textContent = "Full size"; $("lbImg").src = "./photos-ref/" + p.f; $("lbImg").alt = p.t; $("lbTitle").textContent = p.id + " · " + p.t; lb.hidden = false; $("lbClose").focus(); }
const closePhoto = () => { $("lightbox").hidden = true; };
$("lbClose").onclick = closePhoto;
const toggleZoom = () => { const z = $("lightbox").classList.toggle("zoomed"); $("lbZoom").textContent = z ? "Fit to screen" : "Full size"; };
$("lbZoom").onclick = toggleZoom; $("lbImg").onclick = toggleZoom;
$("lbScroll").addEventListener("click", (e) => { if (e.target === $("lbScroll")) closePhoto(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (!$("lightbox").hidden) closePhoto(); else if (placing) endPlacing(); } });

// ---- reviews: saved in the page's shared store so Claude can read them back
let db = null, canWrite = true, myId = null;
const writing = new Map(); // one write at a time per photo
function fmtWhen(iso) { try { return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }
function renderReview(p) {
  const box = $("review"); if (!box) return;
  const r = reviews.get(p.id);
  const status = r ? `<b>${VERDICT[r.verdict]?.[0] || "Reviewed"}</b>${r.updatedAt ? " · " + fmtWhen(r.updatedAt) : ""}${r.verdict === "moved" ? ` · new spot ${r.x.toFixed(1)}, ${r.z.toFixed(1)}${Number.isFinite(r.heading) ? `, facing ${Math.round(r.heading)}°` : ""}` : ""}` : "Not reviewed yet.";
  if (!db) { box.innerHTML = `<h3>Your check</h3><p class="status">${status}</p><p class="note">Saving checks and notes isn't available in this view. Open the page in Claude while signed in.</p>`; return; }
  const ro = !canWrite;
  box.innerHTML = `<h3>Your check</h3><p class="status" id="rvStatus">${status}</p>
  <div class="btns"><button class="btn" id="rvRight" aria-pressed="${r?.verdict === "correct"}" ${ro ? "disabled" : ""}>Position is right</button><button class="btn" id="rvMove" aria-pressed="${r?.verdict === "moved"}" ${ro ? "disabled" : ""}>Move the pin</button><button class="btn" id="rvUnsure" aria-pressed="${r?.verdict === "unsure"}" ${ro ? "disabled" : ""}>Not sure</button></div>
  <label for="rvNote" class="note">Note: what it shows, what's wrong, anything to fix</label>
  <textarea id="rvNote" ${ro ? "disabled" : ""} placeholder="e.g. Taken from the Cervantes side, looking east to the Elena junction">${esc(r?.note || "")}</textarea>
  <div class="btns"><button class="btn primary" id="rvSave" ${ro ? "disabled" : ""}>Save note</button>${r && !ro ? `<button class="btn" id="rvClear">Clear my check</button>` : ""}</div>
  <p class="saved" id="rvSaved">${ro ? "You can read checks here but not change them." : localMode ? "Checks are kept on this browser. Use Send checks to share them with Claude." : ""}</p>`;
  if (ro) return;
  $("rvRight").onclick = () => save(p, { verdict: "correct", x: null, z: null, heading: null });
  $("rvUnsure").onclick = () => save(p, { verdict: "unsure" });
  $("rvMove").onclick = () => startPlacing(p);
  $("rvSave").onclick = () => save(p, { note: $("rvNote").value.trim(), verdict: reviews.get(p.id)?.verdict || "note" });
  if ($("rvClear")) $("rvClear").onclick = () => clearReview(p);
}
async function save(p, change) {
  if (!db) return;
  const prev = reviews.get(p.id) || {};
  const note = $("rvNote") ? $("rvNote").value.trim() : prev.note || "";
  const body = { photo: p.id, verdict: prev.verdict || "note", note, x: prev.x ?? null, z: prev.z ?? null, heading: prev.heading ?? null, ...change, pinBefore: p.c ? fromTurned(...p.c).map((v) => Math.round(v * 10) / 10) : null, gpsAccuracy: p.a ?? null, by: myId, updatedAt: new Date().toISOString() };
  const msg = $("rvSaved"); if (msg) msg.textContent = "Saving…";
  const run = (writing.get(p.id) || Promise.resolve()).then(() => db.doc("reviews/" + encodeId(p.id)).set(body));
  writing.set(p.id, run.catch(() => {}));
  try { await run; reviews.set(p.id, body); afterChange(p); const m = $("rvSaved"); if (m) m.textContent = "Saved."; }
  catch (e) { const m = $("rvSaved"); if (e?.code === "invalid_argument") { canWrite = false; renderReview(p); const m2 = $("rvSaved"); if (m2) m2.textContent = "This view can't save changes."; } else if (m) m.textContent = e?.code === "quota_exceeded" ? "The store is full, so this wasn't saved." : "Couldn't save. Check your connection and try again."; }
}
async function clearReview(p) {
  try { await db.doc("reviews/" + encodeId(p.id)).delete(); reviews.delete(p.id); afterChange(p); }
  catch { const m = $("rvSaved"); if (m) m.textContent = "Couldn't clear it. Try again."; }
}
const encodeId = (id) => id.replace(/[^A-Za-z0-9_.~:@+-]/g, "_");
function afterChange(p) { drawReviews(); renderArea(); updateTally(); if (selected === p.id) { select(p.id); } }
function drawReviews() {
  gGhost.innerHTML = "";
  for (const { badge, p } of pinEls.values()) {
    badge.setAttribute("visibility", reviews.has(p.id) ? "visible" : "hidden");
    const m = moveOf(p.id);
    if (m) el("line", { x1: p.c[0], y1: p.c[1], x2: m[0], y2: m[1], stroke: "var(--accent)", "stroke-width": 1.6, "vector-effect": "non-scaling-stroke", "stroke-dasharray": "4 3" }, gGhost);
  }
  applyView();
}

// ---- moving a pin: tap where you stood, then where the photo points
function startPlacing(p) { placing = { id: p.id, step: "stand", at: null, heading: null }; gPins.style.pointerEvents = "none"; showBanner(); $("mapbox").scrollIntoView({ behavior: "smooth", block: "nearest" }); }
function endPlacing() { placing = null; gPins.style.pointerEvents = ""; draftG.setAttribute("visibility", "hidden"); draftDir.setAttribute("visibility", "hidden"); $("banner").hidden = true; }
function showBanner() {
  const b = $("banner"); b.hidden = false;
  const st = placing.step === "stand" ? `Moving ${placing.id}: tap the map where you stood to take it.` : placing.heading == null ? `Now tap where the photo is pointing, or save without a direction.` : `Tap again to adjust, or save.`;
  b.innerHTML = `<div>${st}</div><div class="btns">${placing.at ? `<button class="btn light" id="bnSave">Save new position</button>` : ""}<button class="btn ghost" id="bnCancel">Cancel</button></div>`;
  $("bnCancel").onclick = endPlacing;
  if ($("bnSave")) $("bnSave").onclick = async () => { const p = DATA.photos.find((x) => x.id === placing.id); const [x, z] = fromTurned(...placing.at); const heading = placing.heading == null ? null : ((placing.heading - DATA.geo.rotation) % 360 + 360) % 360; const keep = { ...placing }; endPlacing(); await save(p, { verdict: "moved", x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, heading: heading == null ? null : Math.round(heading) }); };
}
svg.addEventListener("click", (e) => {
  if (!placing || moved) return;
  const [tx, tz] = toMap(e.clientX, e.clientY);
  if (placing.step === "stand") { placing.at = [tx, tz]; placing.step = "point"; draftG.setAttribute("visibility", "visible"); }
  else { const dx = tx - placing.at[0], dz = tz - placing.at[1]; if (Math.hypot(dx, dz) > 0.5) { placing.heading = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360; draftDir.setAttribute("visibility", "visible"); } }
  applyView(); showBanner();
});

// ---- tally of checks
const openChip = document.createElement("button"); openChip.className = "chip"; openChip.setAttribute("aria-pressed", "false");
openChip.onclick = () => { onlyOpen = !onlyOpen; openChip.setAttribute("aria-pressed", onlyOpen); refresh(); };
function updateTally() { const n = DATA.photos.filter((p) => reviews.has(p.id)).length; openChip.innerHTML = `Only not yet checked <span class="n">${DATA.photos.length - n} of ${DATA.photos.length}</span>`; }

// On the live site there is no shared store: checks are kept in this browser and sent with "Send checks".
const LOCAL_KEY = "villacana-photo-checks-v1";
let localMode = false;
function localStore() {
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch { mem = {}; }
  const subs = [];
  const snap = () => ({ docs: Object.values(mem).map((d) => ({ id: d.photo, exists: true, data: () => d })) });
  const changed = () => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(mem)); } catch { /* kept for this visit only */ } subs.forEach((f) => f(snap())); };
  return {
    collection: () => ({ onSnapshot: (fn) => { subs.push(fn); setTimeout(() => fn(snap()), 0); return () => {}; } }),
    doc: (path) => { const id = path.split("/")[1]; return { set: async (d) => { mem[id] = d; changed(); }, delete: async () => { delete mem[id]; changed(); } }; },
  };
}
const sendChip = document.createElement("button"); sendChip.className = "chip"; sendChip.id = "sendChecks"; sendChip.hidden = true;
function updateSend() { const n = reviews.size; sendChip.hidden = !localMode || n === 0; sendChip.innerHTML = `Send ${n} check${n === 1 ? "" : "s"} to Claude`; }
sendChip.onclick = async () => {
  const text = "Villacana photo checks:\n" + JSON.stringify([...reviews.values()], null, 1);
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    sendChip.textContent = "Copied: paste it into the chat with Claude";
    setTimeout(updateSend, 4000);
  } catch (e) {
    if (e?.name === "AbortError") return;
    // No share sheet or clipboard: show the text to copy by hand.
    $("detail").innerHTML = `<p class="title">Copy your checks</p><p class="note">Select all of this, copy it and paste it into the chat with Claude.</p><textarea id="sendText" readonly style="min-height:220px">${esc(text)}</textarea>`;
    $("sendText").select();
  }
};
async function connect() {
  const c = window.claude;
  let d = null, u = null;
  if (c?.use) [d, u] = await Promise.all([c.use("db"), c.use("user")]);
  else { d = localStore(); localMode = true; $("tally").appendChild(sendChip); }
  db = d; if (!db) { renderSelected(); return; }
  if (u) { try { myId = await u.id(); } catch {} const w = u.can ? u.can("data.write") : null; canWrite = w === null || w === undefined ? true : !!(await w); }
  $("tally").appendChild(openChip); updateTally();
  renderSelected();
  db.collection("reviews").onSnapshot((snap) => {
    reviews.clear(); for (const doc of snap.docs) { const r = doc.data(); if (r?.photo) reviews.set(r.photo, r); }
    drawReviews(); renderArea(); updateTally(); updateSend();
    // Keep what someone is typing; refresh the status line only.
    const typing = document.activeElement?.id === "rvNote";
    if (selected && !typing && !placing) select(selected); else if (selected && $("rvStatus")) { const p = DATA.photos.find((x) => x.id === selected); renderStatusOnly(p); }
  }, () => { renderSelected(); });
}
function renderStatusOnly(p) { const r = reviews.get(p.id); const st = $("rvStatus"); if (st) st.innerHTML = r ? `<b>${VERDICT[r.verdict]?.[0] || "Reviewed"}</b>${r.updatedAt ? " · " + fmtWhen(r.updatedAt) : ""}` : "Not reviewed yet."; }
function renderSelected() { if (selected) select(selected); }

// ---- gaps
const gaps = DATA.geo.cov.map((r) => { const len = (s) => Math.hypot(s[2] - s[0], s[3] - s[1]); const total = r.s.reduce((a, s) => a + len(s), 0), none = r.s.filter((s) => !s[4]).reduce((a, s) => a + len(s), 0); return { id: r.id, total, none }; }).filter((r) => NAMES[r.id] && r.total > 15).sort((a, b) => b.none / b.total - a.none / a.total);
$("gaps").innerHTML = gaps.slice(0, 8).map((r) => `<li><b>${NAMES[r.id]}</b>: ${Math.round(r.none / r.total * 100)}% of ${Math.round(r.total)} m with no photo</li>`).join("");

// ---- start
new ResizeObserver(() => applyView()).observe(svg);
refresh(); connect(); requestAnimationFrame(() => { zoomToArea(); select((DATA.photos.find((p) => inArea(p) && p.q === "checked") || placed[0]).id); });
})();
