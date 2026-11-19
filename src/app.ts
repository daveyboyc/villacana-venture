import "./app.css";
import "./blueprint";
import { detectDeviceType, initAnalytics, trackEvent } from "./analytics";
import { asset } from "./asset";

initAnalytics();

type View = "map" | "overview" | "walk" | "fps";
const mapPage = document.querySelector<HTMLElement>("#map-page")!;
const scenePage = document.querySelector<HTMLElement>("#scene-page")!;
const frame = document.querySelector<HTMLIFrameElement>("#resort-scene")!;
let selectedPoint: number[] | null = null;
let currentView: View | null = null;
let frameRotation = 26;
void fetch(asset("/map/skeleton.json")).then(r=>r.json()).then(s=>{frameRotation=s.viewRotation;});

function setView(view: View, history = true): void {
  const url = new URL(location.href); url.searchParams.set("view", view);
  if (history) window.history.pushState(null, "", url);
  if (currentView !== null && currentView !== view) {
    trackEvent("view_switched", {
      from_view: currentView,
      to_view: view,
      area: url.searchParams.get("area"),
      photo: url.searchParams.get("photo"),
    });
  }
  currentView = view;
  frame.contentWindow?.postMessage({type:"villacana-controls-reset"},location.origin);
  document.body.dataset.appView = view;
  mapPage.hidden = view !== "map"; scenePage.hidden = view === "map";
  for (const mode of ["map", "overview", "walk", "fps"] as const) document.querySelector(`#view-${mode}`)!.setAttribute("aria-pressed", String(mode === view));
  if (view !== "map") {
    const scene = new URL(asset("/slice.html"), location.href);
    scene.searchParams.set("pool", "north,middle,south,main");
    scene.searchParams.set("embedded", "1");
    if(url.searchParams.has("photo"))scene.searchParams.set("photo",url.searchParams.get("photo")!);
    scene.searchParams.set("view", view === "overview" ? "overview" : "walk");
    const phone=navigator.maxTouchPoints>0&&matchMedia("(max-width:900px), (max-height:500px)").matches;
    if(view==="overview"&&phone&&!url.searchParams.has("details"))scene.searchParams.set("details","1");
    // Preserve old bookmarked scene focus/coordinates when opening the canonical app.
    for (const key of ["details", "at", "look", "study", "place", "camera", "area", "scorecard"]) if (url.searchParams.has(key)) scene.searchParams.set(key, url.searchParams.get(key)!);
    if (view === "fps") {
      for (const key of ["photo", "at", "look", "study", "place", "scorecard"]) scene.searchParams.delete(key);
      scene.searchParams.set("pool", "north");
      scene.searchParams.set("area", "north-pool");
      scene.searchParams.set("camera", "first");
      scene.searchParams.set("weapon", "shotgun");
      scene.searchParams.set("details", "1");
    }
    if (selectedPoint && view === "overview" && !url.searchParams.has("area")) {
      const r = frameRotation * Math.PI / 180, [x, z] = selectedPoint;
      const turned = `${(x * Math.cos(r) - z * Math.sin(r)).toFixed(2)},${(x * Math.sin(r) + z * Math.cos(r)).toFixed(2)}`;
      scene.searchParams.set("focus", turned);
    }

    if (frame.src !== scene.href) frame.src = scene.href;
    document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach(d => d.close());
  }
  window.dispatchEvent(new Event("resize"));
}
for (const view of ["map", "overview", "walk", "fps"] as const) document.querySelector(`#view-${view}`)!.addEventListener("click", () => setView(view));
// Arrow keys and WASD move the 3D view even while focus is on the page around it.
for (const type of ["keydown", "keyup"] as const) window.addEventListener(type, e => {
  if (scenePage.hidden || e.metaKey || e.ctrlKey || e.altKey || !/^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(e.code)) return;
  if ((e.target as HTMLElement).closest?.("input,textarea,select,[contenteditable]") || document.querySelector("dialog[open]")) return;
  const scene = frame.contentWindow as (Window & typeof globalThis) | null, body = frame.contentDocument?.body;
  if (!scene || !body) return;
  body.dispatchEvent(new scene.KeyboardEvent(type, { code: e.code, key: e.key, bubbles: true, cancelable: true }));
  if (e.code.startsWith("Arrow")) e.preventDefault();
});
document.querySelector('#visit-silvia')!.addEventListener('click',()=>{
  const url=new URL(location.href);url.searchParams.delete('study');url.searchParams.delete('at');url.searchParams.delete('look');url.searchParams.set('area','silvia-north');url.searchParams.set('place','silvia');url.searchParams.set('details','1');window.history.replaceState(null,'',url);
  trackEvent("area_jumped", { area_id: "silvia-north", area_name: "Silvia tunnel", source: "silvia_shortcut" });
  setView('overview');
});
document.querySelector("#app-photo-toggle")!.addEventListener("click", () => { setView("map"); document.querySelector<HTMLInputElement>("#photo-search")?.focus(); });
const requestedView=():View=>{
  const url=new URL(location.href),mode=url.searchParams.get('view');
  return mode==='map'||mode==='walk'||mode==='fps'?mode:mode==='overview'||!url.searchParams.has('photo')?'overview':'map';
};
window.addEventListener("popstate", () => setView(requestedView(),false));
window.addEventListener("reference-selected", ((event: CustomEvent<{ id: string; label: string; point: number[] | null; camera: number[] | null }>) => {
  selectedPoint = event.detail.point;
  const el = document.querySelector<HTMLElement>("#app-selected")!;
  el.textContent = event.detail.id.replace(/\.jpg$/, ""); el.title = event.detail.label;
  if(!scenePage.hidden && event.detail.id)setView(document.body.dataset.appView as View,false);
}) as EventListener);
window.addEventListener("patio-wall-inspect", ((event: CustomEvent<{point:number[]}>) => {
  selectedPoint = event.detail.point;
  const url = new URL(location.href);
  for (const key of ["photo", "area", "at", "look", "study", "place", "camera"]) url.searchParams.delete(key);
  url.searchParams.set("details", "0");
  window.history.replaceState(null, "", url);
  setView("overview");
}) as EventListener);
window.addEventListener("reference-view", ((event: CustomEvent<View>) => {
  if(event.detail==='overview'){const url=new URL(location.href);url.searchParams.delete('area');window.history.replaceState(null,'',url);}
  setView(event.detail);
}) as EventListener);
window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if(event.data?.type==='villacana-inspect-area' && typeof event.data.area==='string'){
    const url=new URL(location.href);url.searchParams.set('area',event.data.area);url.searchParams.set('view','overview');window.history.replaceState(null,'',url);
    if (currentView !== null && currentView !== "overview") {
      trackEvent("view_switched", {
        from_view: currentView,
        to_view: "overview",
        area: event.data.area,
        photo: url.searchParams.get("photo"),
      });
    }
    currentView = "overview";
    document.body.dataset.appView='overview';
    document.querySelector('#view-overview')!.setAttribute('aria-pressed','true');document.querySelector('#view-walk')!.setAttribute('aria-pressed','false');document.querySelector('#view-fps')!.setAttribute('aria-pressed','false');
  }
  if(event.data?.type==='villacana-camera'&&['first','third'].includes(event.data.mode)){
    const url=new URL(location.href);url.searchParams.set('camera',event.data.mode);window.history.replaceState(null,'',url);
  }
  if (event.data?.type === "villacana-map") {
    setView("map");
    if(typeof event.data.photo === "string") window.dispatchEvent(new CustomEvent("reference-open", {detail:event.data.photo}));
  }
});
const initialView = requestedView();
const initialParams = new URLSearchParams(location.search);
trackEvent("session_started", {
  entry: "app",
  initial_view: initialView,
  device_type: detectDeviceType(),
  viewport_width: window.innerWidth,
  viewport_height: window.innerHeight,
  initial_area: initialParams.get("area"),
  initial_photo: initialParams.get("photo"),
});
setView(initialView,false);
