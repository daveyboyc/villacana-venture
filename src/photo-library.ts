import { asset } from "./asset";
import type { Vec2 } from "./types";

type Reference = {
  id: string; label: string; private: boolean; kind: string; sourcePath: string; sourceUrl: string | null;
  image: string | null; thumbnail: string | null; areas: string[]; viewpoint: string | null;
  observation: string; note: string; subject: string | null; looksAt?: Vec2; looksAtBasis?: string;
  locationBasis?: string; camera?: { x: number; z: number; accuracy?: number; heading?: number; trust?: string };
  association?: {status:string;reasons:string[];geometryReview:string};
  features: { id: string; name: string; verification: string; photoVerification: string; placement: {status:string;blockers:string[];toleranceM?:number} }[]; checks: { result: string; notes?: string }[];
};
type Review = { photo: string; verdict: string; note: string; updatedAt: string; x?: number; z?: number; heading?: number; pinBefore?: unknown; gpsAccuracy?: number };
const NS = "http://www.w3.org/2000/svg", STORE = "villacana-photo-checks-v1";
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text = "", parent?: Element): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag); node.textContent = text; parent?.append(node); return node;
};
const svgNode = (tag: string, attrs: Record<string, string | number>) => {
  const node = document.createElementNS(NS, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node;
};
function stored<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; } }
function persist(key: string, value: unknown): boolean { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }

/** All catalogue entries remain discoverable, including private and unplaced sources. */
export async function photoLibrary(options: { svg: SVGSVGElement; world: SVGGElement; focus: (points: Vec2[]) => void; rotation: () => number; scale: () => number; setLabel: (id:string,label:string) => boolean }) {
  const data = await fetch(asset("/reference-index.json")).then(r => { if (!r.ok) throw Error("Reference index unavailable"); return r.json(); }) as { references: Reference[]; areas: { id: string; name: string }[] };
  const refs = data.references, reviews = stored<Record<string, Review>>(STORE, {});
  const draftLabels=stored<{labels?:Record<string,string>}>("villacana-map-edits",{}).labels??{};
  const panel = make("aside", "", document.querySelector("#map-page")!); panel.id = "photo-library"; panel.setAttribute("aria-label", "Photo references");
  const head = make("div", "", panel); head.className = "photo-library-head";
  make("h1", "Photo references", head);
  const search = make("input", "", head); search.id = "photo-search"; search.type = "search"; search.placeholder = "Find photo ID, place or subject…"; search.setAttribute("aria-label", "Search photo references");
  const filters = make("div", "", head); filters.className = "photo-filters";
  const area = make("select", "", filters); area.id = "photo-area"; area.setAttribute("aria-label", "Reference area"); area.add(new Option("All areas", ""));
  for (const a of data.areas) area.add(new Option(a.name, a.id));
  const labelsLabel = make("label", "Labels", filters), labels = make("input", "", labelsLabel); labels.type = "checkbox"; labels.checked = true; labels.id = "photo-labels";
  const count = make("div", "", head); count.id = "photo-count"; count.setAttribute("aria-live", "polite");
  const results = make("div", "", panel); results.id = "photo-results";
  const detail = make("article", "", panel); detail.id = "photo-detail";
  const full = make("dialog", "", document.body); full.id = "photo-full";
  const close = make("button", "Close photo", full); close.addEventListener("click", () => full.close());
  const fullImage = make("img", "", full);
  full.addEventListener("click", e => { if (e.target === full) full.close(); });
  const layer = svgNode("g", { id: "photo-reference-pins" }); options.world.append(layer);
  const context = svgNode("g", { id: "photo-reference-context", "pointer-events": "none" }); layer.append(context);
  let selected: Reference | undefined, visible = true, evidence = true, filtered = refs, moving = false, movePoints: Vec2[] = [];
  const pins = new Map<string, SVGElement>();
  let previousProjection = "";
  const localLabel = (r: Reference) => draftLabels[r.id];
  const caption = (r: Reference) => localLabel(r) || r.label;
  const points = (r: Reference): Vec2[] => [...(r.camera ? [[r.camera.x, r.camera.z] as Vec2] : []), ...(r.looksAtBasis === "reviewed" && r.looksAt ? [r.looksAt] : [])];
  const agentText = (r: Reference) => [
    `Photo: ${r.id}`, `Published label: ${r.label}`, ...(localLabel(r) ? [`Local draft label (not published): ${localLabel(r)}`] : []),
    `Map: ${new URL(`?view=map&photo=${encodeURIComponent(r.id)}`, location.href).href}`, `Source: ${r.sourcePath}`,
    ...(r.sourceUrl ? [`Private source link: ${r.sourceUrl}`] : []), `Areas: ${r.areas.join(", ")}`, `Viewpoint: ${r.viewpoint ?? "unknown"}`,
    r.camera ? `Camera: [${r.camera.x}, ${r.camera.z}] m; GPS uncertainty ${r.camera.accuracy === undefined ? "unknown" : `±${r.camera.accuracy} m`}; ${r.camera.trust ?? "recorded position"}. Camera is not subject.` : "No camera coordinates. Find using area and visible landmarks; do not infer a pin.",
    `Subject: ${r.subject ?? "not separately located"}`, ...(r.looksAt ? [`Subject/look-at: ${JSON.stringify(r.looksAt)}; basis: ${r.looksAtBasis}. Not a surveyed boundary.`] : []),
    ...(r.locationBasis ? [`Location basis: ${r.locationBasis}`] : []), `Observed: ${r.observation || "See source image."}`, `Notes: ${r.note || "none recorded"}`,
    ...(r.association?[`Camera/map association: ${r.association.status}; ${r.association.reasons.join("; ")}. ${r.association.geometryReview}`]:[]),
    `Model citations: ${r.features.map(f => `${f.id} [placement: ${f.placement.status}${f.placement.toleranceM===undefined?"":` (tolerance ${f.placement.toleranceM} m)`}; photo diagnostics: ${f.photoVerification}]`).join(", ") || "No model citation recorded (not proof of absence)."}`,
    ...r.features.flatMap(f=>f.placement.blockers.map(b=>`Placement blocker for ${f.id}: ${b}`)),
    `Recorded photo checks: ${r.checks.map(c => `${c.result}${c.notes ? `: ${c.notes}` : ""}`).join("; ") || "none in current check records; earlier manual reviews may exist"}`,
    "Inspect the full image before editing. A citation or software test does not establish photographic agreement."
  ].join("\n");
  const button = (text: string, parent: Element, action: () => void) => { const b = make("button", text, parent); b.type = "button"; b.addEventListener("click", action); return b; };
  const copy = async (text: string, status: HTMLElement) => { try { await navigator.clipboard.writeText(text); status.textContent = "Copied."; } catch { status.textContent = "Clipboard unavailable. Select and copy the text below.";const fallback=document.querySelector<HTMLTextAreaElement>("#photo-copy-fallback");if(fallback){fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();} } };
  function showContext() {
    previousProjection="";context.replaceChildren(); if (!selected || !evidence) return;
    const r = selected, cam = r.camera;
    if (cam) {
      const radius = cam.accuracy ?? 10;
      context.append(svgNode("circle", { cx: cam.x, cy: cam.z, r: radius, fill: "#c39a27", "fill-opacity": .1, stroke: "#a16b16", "stroke-width": .25, "stroke-dasharray": "1 .7" }));
      if (cam.heading !== undefined) {
        const p = (deg: number) => [cam.x + Math.sin(deg * Math.PI / 180) * 14, cam.z - Math.cos(deg * Math.PI / 180) * 14].join(" ");
        context.append(svgNode("path", { d: `M${cam.x} ${cam.z}L${p(cam.heading - 25)}L${p(cam.heading + 25)}Z`, fill: "#c77924", "fill-opacity": .2 }));
      }
    }
    if (r.looksAt && r.looksAtBasis === "reviewed") {
      const [x, z] = r.looksAt;
      const target=svgNode("g",{"data-subject-label":"true"});
      target.append(svgNode("path",{d:"M-8 0H8M0 -8V8",stroke:"#bd356a","stroke-width":2}));
      const label=svgNode("text",{x:10,y:4,"font-size":12,fill:"#912049",stroke:"#fffdf8","stroke-width":3,"paint-order":"stroke","font-family":"system-ui"});label.textContent=r.subject??"Reviewed look-at (estimated)";target.append(label);context.append(target);

      if (cam) context.append(svgNode("path", { d: `M${cam.x} ${cam.z}L${x} ${z}`, stroke: "#bd356a", "stroke-width": .25, "stroke-dasharray": ".7 .7" }));
    }
  }
  function showDetail(r: Reference) {
    detail.replaceChildren(); panel.classList.add("has-selection");
    const back = button("Close selection", detail, () => { selected = undefined; panel.classList.remove("has-selection"); detail.replaceChildren(); context.replaceChildren(); const u = new URL(location.href); u.searchParams.delete("photo"); history.pushState(null, "", u); renderResults(); window.dispatchEvent(new CustomEvent("reference-selected", { detail: { id: "", label: "", point: null, camera: null } })); }); back.id = "photo-deselect";
    make("small", r.id, detail); make("h2", caption(r), detail);
    if (r.image) {
      const img = make("img", "", detail); img.src = asset("/" + r.image); img.alt = caption(r); img.tabIndex = 0;
      const open = () => { fullImage.src = img.src; fullImage.alt = caption(r); full.showModal(); };
      img.addEventListener("click", open); img.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
      button("Open full photo", detail, open).id = "openPhoto";
    } else {
      make("p", "Private reference — open the source in the private repository.", detail).className = "photo-state";
      if (r.sourceUrl) { const link = make("a", "Open private image", detail); link.href = r.sourceUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; }
    }
    make("p", r.observation || r.subject || r.label, detail);
    const cameraText = r.camera ? `Camera [${r.camera.x}, ${r.camera.z}] m · ${r.camera.accuracy === undefined ? "uncertainty unknown; dashed 10 m search radius" : `GPS ±${r.camera.accuracy} m`}.` : "No camera position recorded; this reference stays in the list.";
    make("p", cameraText + " Dots show cameras, not subjects. Pink crosses show reviewed look-at points, not surveyed dimensions.", detail).className = "photo-hint";
    if(r.association?.status === "needs-review")make("p",`Camera/map context needs review: ${r.association.reasons.join("; ")}.`,detail).className="photo-state";
    for(const f of r.features.filter(f=>f.placement.status==="disputed"))make("p",`Placement disputed: ${f.name}. ${f.placement.blockers.join("; ")}`,detail).className="photo-state";
    if (r.note) make("p", r.note, detail);
    if (r.locationBasis) make("p", r.locationBasis, detail);
    const actions = make("div", "", detail); actions.className = "photo-actions";
    if (points(r).length) button("Locate on map", actions, () => options.focus(points(r)));
    if (r.looksAtBasis === "reviewed" || r.camera) button("See in overview", actions, () => window.dispatchEvent(new CustomEvent("reference-view", { detail: "overview" })));
    const status = make("p", "", detail); status.id = "photo-copy-status"; status.setAttribute("role", "status");
    const fallback=make("textarea","",detail);fallback.id="photo-copy-fallback";fallback.hidden=true;fallback.readOnly=true;fallback.setAttribute("aria-label","Text to copy");
    button("Copy photo link", actions, () => void copy(new URL(`?view=map&photo=${encodeURIComponent(r.id)}`, location.href).href, status));
    button("Copy agent reference", actions, () => void copy(agentText(r), status)).id = "copy-agent-reference";
    const agent = make("details", "", detail); make("summary", "Source, evidence and agent reference", agent);
    const text = make("textarea", "", agent); text.id = "agent-reference-text"; text.readOnly = true; text.value = agentText(r); text.setAttribute("aria-label", "Agent reference text");
    if (!r.private) {
      const edit = make("details", "", detail); make("summary", "Label and camera review", edit);
      const label = make("input", "", edit); label.value = caption(r); label.setAttribute("aria-label", "Photo label");
      button("Save draft label", edit, () => {
        draftLabels[r.id]=label.value.trim();
        status.textContent = options.setLabel(r.id,label.value.trim()) ? "Draft label saved on this browser. Send changes to publish it." : "Could not save draft label.";
        text.value = agentText(r); renderResults();
      });
      const key = r.id.replace(/\.jpg$/, ""), note = make("textarea", "", edit); note.id = "rvNote"; note.setAttribute("aria-label", "Photo review note"); note.value = reviews[key]?.note ?? "";
      const reviewActions = make("div", "", edit); reviewActions.className = "photo-actions";
      const saveReview = (verdict: string, extra: Partial<Review> = {}) => {
        reviews[key] = { ...reviews[key], photo: key, verdict, note: note.value, updatedAt: new Date().toISOString(), pinBefore: r.camera, gpsAccuracy: r.camera?.accuracy, ...extra };
        status.textContent = persist(STORE, reviews) ? "Review saved on this browser. Use Send checks to share it." : "Review kept for this visit; export before leaving.";
      };
      if (r.camera) button("Camera pin is right", reviewActions, () => saveReview("correct")).id = "rvRight";
      button("Unsure", reviewActions, () => saveReview("unsure"));
      button("Save note", reviewActions, () => saveReview(reviews[key]?.verdict ?? "note")).id = "rvSave";
      button("Move camera pin", reviewActions, () => { moving = true; movePoints = []; status.textContent = "Tap where the camera stood, then where it faced. This saves a proposed camera review, not a model correction."; }).id = "rvMove";
      button("Cancel move", reviewActions, () => { moving = false; movePoints = []; status.textContent = "Move cancelled."; });
      button("Save moved camera", reviewActions, () => {
        if (movePoints.length < 2) { status.textContent = "Choose camera and facing points first."; return; }
        const [[x, z], [tx, tz]] = movePoints; saveReview("moved", { x, z, heading: (Math.atan2(tx - x, -(tz - z)) * 180 / Math.PI + 360) % 360 }); moving = false; movePoints = [];
      }).id = "bnSave";
      button("Send checks", reviewActions, () => void copy("Villacana photo checks:\n" + JSON.stringify(Object.values(reviews), null, 2), status)).id = "sendChecks";
    }
    detail.scrollTop = 0;
    update();
  }
  function select(r: Reference, push = true, locate = true) {
    selected = r; moving = false; movePoints = []; showDetail(r); showContext();
    { const u = new URL(location.href); u.searchParams.set("photo", r.id); if(push)history.pushState(null,"",u);else history.replaceState(null,"",u); }
    if (locate && points(r).length) options.focus(points(r));
    renderResults();
    window.dispatchEvent(new CustomEvent("reference-selected", { detail: { id: r.id, label: caption(r), camera:r.camera?[r.camera.x,r.camera.z]:null, point: r.looksAtBasis === "reviewed" && r.looksAt ? r.looksAt : r.camera ? [r.camera.x, r.camera.z] : null } }));
  }
  function renderResults() {
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    filtered = refs.filter(r => (!area.value || r.areas.includes(area.value)) && words.every(word=>[r.id, caption(r), r.label, r.subject, r.observation, r.note, ...r.areas].join(" ").toLowerCase().includes(word)));
    count.textContent = `${filtered.length} of ${refs.length} references · ${filtered.filter(r => !r.camera).length} without camera pins`;
    results.replaceChildren();
    for (const r of filtered) {
      const row = make("button", "", results); row.className = "photo-result"; row.setAttribute("data-reference-id", r.id); row.setAttribute("aria-current", String(selected?.id === r.id));
      if (r.thumbnail) { const img = make("img", "", row); img.src = asset("/" + r.thumbnail); img.alt = ""; img.loading = "lazy"; }
      const span = make("span", "", row); make("small", r.id.replace(/\.jpg$/, ""), span); make("strong", caption(r), span);
      if (r.private || !r.camera) make("small", r.private ? "Private source · area reference" : "No camera position", span);
      row.addEventListener("click", () => select(r));
    }
    update();
  }
  for (const r of refs) {
    if (!r.camera) continue;
    const g = svgNode("g", { class: "photo-map-pin", "data-photo-file": r.id, tabindex: "0", role: "button", "aria-label": `${r.id}: ${r.label}` });
    const title = svgNode("title", {}); title.textContent = `${r.id} · ${r.label}`; g.append(title);
    g.append(svgNode("circle", { r: 4, fill: "#28614d", stroke: "white", "stroke-width": 1.5 }));
    const text = svgNode("text", { x: 7, y: -5, "font-size": 11 }); text.textContent = r.id.replace(/\.jpg$/, ""); g.append(text);
    g.addEventListener("pointerdown", e => e.stopPropagation()); g.addEventListener("click", e => { e.stopPropagation(); select(r); });
    g.addEventListener("keydown", e => { if ((e as KeyboardEvent).key === "Enter") select(r); }); pins.set(r.id, g); layer.append(g);
  }
  function update() {
    if (!options.svg.clientWidth || !options.svg.clientHeight) return;
    const scale = options.scale(), matrix=options.world.getScreenCTM(); if (!Number.isFinite(scale)||!matrix) return;
    const projection=[scale,options.rotation(),matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f,innerWidth,innerHeight,search.value,area.value,labels.checked,selected?.id,visible,evidence].join("|");
    if(projection===previousProjection)return;previousProjection=projection;
    if(selected?.looksAt){context.querySelector("[data-subject-label]")?.setAttribute("transform",`translate(${selected.looksAt.join(" ")}) rotate(${-options.rotation()}) scale(${scale})`);}
    const allowed = new Set(filtered.map(r => r.id)), boxes: number[][] = [], rect = panel.getBoundingClientRect();
    const ordered = [...refs].sort((a, b) => Number(b.id === selected?.id) - Number(a.id === selected?.id));
    for (const r of ordered) {
      const g = pins.get(r.id); if (!g || !r.camera) continue;
      g.setAttribute("display", visible && (allowed.has(r.id) || r.id === selected?.id) ? "" : "none");
      g.setAttribute("transform", `translate(${r.camera.x} ${r.camera.z}) rotate(${-options.rotation()}) scale(${scale})`);
      const circle = g.querySelector("circle")!; circle.setAttribute("fill", r.id === selected?.id ? "#c33268" : "#28614d"); circle.setAttribute("r", r.id === selected?.id ? "6" : "4");
      const p = new DOMPoint(r.camera.x, r.camera.z).matrixTransform(matrix);
      const width = r.id.length * 6 + 12, box = [p.x + 5, p.y - 18, p.x + width, p.y + 1];
      const blocked = p.x > rect.left - width && p.y > rect.top && p.y < rect.bottom;
      const fits = allowed.has(r.id) && p.y > 110 && p.x > 0 && p.x < innerWidth - 20 && !blocked && !boxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      g.querySelector("text")!.setAttribute("display", labels.checked && (fits || r.id === selected?.id) ? "" : "none");
      if (allowed.has(r.id) && fits) boxes.push(box);
    }
  }
  search.addEventListener("input", renderResults); area.addEventListener("change", renderResults); labels.addEventListener("change", update);
  options.svg.addEventListener("click", e => {
    if (!moving) return; e.stopImmediatePropagation();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(options.world.getScreenCTM()!.inverse()); movePoints.push([p.x, p.y]);
    if (movePoints.length > 2) movePoints = [[p.x, p.y]];
    document.querySelector("#photo-copy-status")!.textContent = movePoints.length === 1 ? "Camera chosen. Tap a point in the direction it faced." : "Camera and facing chosen. Press Save moved camera.";
  }, true);
  const fromUrl = (locate = true) => {
    const id = new URL(location.href).searchParams.get("photo"); if (!id) return;
    const r = refs.find(r => r.id === id || r.id.replace(/\.jpg$/, "") === id); if (r) select(r, false, locate);else {search.value=id;area.value="";renderResults();count.textContent=`Reference ${id} was not found. Search another ID or subject.`;}
  };
  window.addEventListener("popstate", () => { if(new URL(location.href).searchParams.has("photo"))fromUrl();else {selected=undefined;detail.replaceChildren();panel.classList.remove("has-selection");showContext();renderResults();window.dispatchEvent(new CustomEvent("reference-selected",{detail:{id:"",label:"",point:null,camera:null}}));} });
  window.addEventListener("reference-open", ((event:CustomEvent<string>)=>{const r=refs.find(r=>r.id===event.detail);if(r)select(r);}) as EventListener);
  renderResults(); fromUrl();
  return { update, active: () => moving, setVisible(on: boolean) { visible = on; layer.setAttribute("display", on ? "" : "none"); }, setEvidence(on: boolean) { evidence = on; showContext(); } };
}
