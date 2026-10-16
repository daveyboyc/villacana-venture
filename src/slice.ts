import {addEvaLawn,evaWallRings,inEvaLawn,suppressInEvaLawn} from "./eva-walled-lawn";
import {addElenaGatedEntry,elenaEntryRings} from "./elena-gated-entry";
import {addCervantesNorthPatios,cervantesNorthPartitionRings,inCervantesNorthPatios} from "./cervantes-north-patios";
import {addCervantesEastHedge} from "./cervantes-east-hedge";
import {addBarrakaBoardwalk,barrakaAccess} from "./barraka-boardwalk";
import {addMiddleSouthGate,middleSouthRings} from "./middle-pool-south-gate";
import {addCervantesGardenDoor,gardenDoorRings,gardenGroundOffset} from "./cervantes-garden-door";
import {addCoastalGate,coastalAccess,coastalWallRings,GatedSolids} from "./coastal-gate";
import {addLayoutRoutes} from "./layout-routes";
import {protectedRoutes,routeClearance,propRadius} from "./route-clearance";
import {addCervantesPatioWalls,cervantesPatioWallRings,inCervantesWallReview} from "./cervantes-walls";
import {addDaliThreshold,inDaliThreshold} from "./dali-threshold";
import {addFrontageDivisions,inReviewedFrontage} from "./frontages";
import {addElenaNorth,elenaNorthRings,inElenaNorthReview} from "./elena-north";
import {addRampSteps,stepsGroundOffset} from "./ramp-steps";
import {addMiddlePool,inMiddlePoolReview,middlePoolRings,suppressInMiddlePoolReview} from "./middle-pool";
import {pavingCanvas,plasterMaterial} from "./materials";
import { mapLabels, referenceEditor } from "./references";
import * as THREE from "three";
import { asset } from "./asset";
import { centroid, clamp, closestOnSegment, CoastField, dampAngle, pointInRing, Solids } from "./geom";
import { Player, type MoveWorld } from "./player";
import { addSprites, SPRITE_SIZE, type SpriteKind, type SpritePlacement } from "./sprites";
import type { BoundaryReference, InputState, Skeleton, SkeletonBuilding, Vec2 } from "./types";
import { addPools, POOL_STAND } from "./water";
import { addMainPoolTerraces, addRoofFins, addSeafront } from "./main-pool";
import { addSeafrontOutlines } from "./seafront";
import { addSeaside, makeSeaside, type Seaside } from "./seaside";
import { addRaisedGround, drapeScene, siteY } from "./terrain";
import mainPoolLayout from "../data/main_pool.json";
import { accessWallRings, addPoolAccess, poolGroundY, lowerPoolRing, lowerPoolHoles, poolTerraceRing, lowerPoolSurface, LOWER_POOL_Y, POOL_TERRACE_ID } from "./pool-levels";
import { addSeaWall, seaWallRings } from "./south-pool";
import { addPaseoWall, paseoWallCovers, paseoWallRings } from "./paseo-wall";
import { addBoundaryReference, barrierRings, referenceGroundHeight, roadHeight } from "./boundaries";

/** The pools whose courtyards this page shows, joined by the lanes between them. */
const layoutOnly=new URLSearchParams(location.search).get("details")!=="1";
const POOL_IDS = (new URLSearchParams(location.search).get("pool") ?? "north").split(",");
/** How far the walkable area reaches from its centre. Grows to take in every pool asked for. */
let RADIUS = 60;
/** Centres of the pool courtyards on show. */
let COURTS: { x: number; z: number }[] = [];
/** How far out from the pool the hand-placed planting reaches. */
const COURTYARD = 30;

const WALL = "#ffffff";
const ROOF_GREY = "#d9d5cc";
const ROOF_TERRACE = "#c98f6e";
const SHUTTER = "#7a4a2a";
/** Clear height under a covered walk-through. */
const PASSAGE_HEADROOM = 2.6;

/** Heights seaward of the paseo, when this view shows the sea. */
let seaside: Seaside | undefined;
/** Ground height for anything standing on the ground. */
const groundY = (x: number, z: number): number => seaside?.inZone(x, z) ? seaside.y(x, z) : poolGroundY(x, z);
/** The same, with the lie of the land added: for things placed after the scene is built. */
const liveGroundY = (x: number, z: number): number => groundY(x, z) + (seaside?.inZone(x, z) ? 0 : siteY(x, z));

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const input: InputState = { moveX: 0, moveZ: 0, run: false, jump: false, lookDx: 0, lookDy: 0, zoom: 0, interact: false };

void boot();

async function boot(): Promise<void> {
  const detailLink=document.querySelector<HTMLAnchorElement>("#layout-details")!;
  const detailUrl=new URL(location.href);if(layoutOnly)detailUrl.searchParams.set("details","1");else detailUrl.searchParams.delete("details");detailLink.href=detailUrl.pathname+detailUrl.search;detailLink.textContent=layoutOnly?"Layout · show details":"Details · show layout";
  const skeleton = (await (await fetch(asset("/map/skeleton.json"))).json()) as Skeleton;
  suppressInEvaLawn(skeleton);
  suppressInMiddlePoolReview(skeleton); // the traced middle pool gateway and planter replace generated walls there
  const chosen = skeleton.pools.filter((p) => POOL_IDS.includes(p.id) || (POOL_IDS.includes("main") && p.id === "toddler"));
  const shown = chosen.length ? chosen : [skeleton.pools.find((p) => p.id === "north")!];
  // Start at the first pool named.
  const pool = shown.find((p) => p.id === POOL_IDS[0]) ?? shown[0];
  const mainPool = shown.some((p) => p.id === "main");
  const daliFocus = new URLSearchParams(location.search).get("view") === "dali";
  const rampFocus = new URLSearchParams(location.search).get("view") === "ramp";
  const connectionFocus = new URLSearchParams(location.search).get("view") === "cervantes";
  const seafrontFocus = mainPool && new URLSearchParams(location.search).get("view") === "seafront";
  const names = shown.filter((p) => !mainPool || p.id !== "toddler").map((p) => p.id[0].toUpperCase() + p.id.slice(1));
  document.querySelector("#title")!.textContent = names.length > 3 ? "Whole resort" : names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} pools` : `${names[0]} pool`;
  const here = `?pool=${shown.filter((p) => !mainPool || p.id !== "toddler").map((p) => p.id).join(",")}${seafrontFocus ? "&view=seafront" : daliFocus ? "&view=dali" : connectionFocus ? "&view=cervantes" : ""}`;
  for (const link of document.querySelectorAll<HTMLAnchorElement>("#areas a")) link.hidden = link.search === here || (names.length > 3 && new URLSearchParams(link.search).get("pool")?.split(",").length === 4 && !link.search.includes("view="));
  COURTS = shown.map((p) => centroid(p.ring));
  const centre = {
    x: COURTS.reduce((sum, c) => sum + c.x, 0) / COURTS.length,
    z: COURTS.reduce((sum, c) => sum + c.z, 0) / COURTS.length,
  };
  RADIUS = (mainPool ? 95 : 60) + Math.max(...COURTS.map((c) => Math.hypot(c.x - centre.x, c.z - centre.z)));
  const near = (ring: Vec2[]) => {
    const c = centroid(ring);
    return Math.hypot(c.x - centre.x, c.z - centre.z) < RADIUS + 25;
  };
  const buildings = skeleton.buildings.filter((b) => near(b.ring));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const routes=skeleton.boundaryReference?protectedRoutes(skeleton.boundaryReference,skeleton.seafront?{id:"paseo",...skeleton.seafront.paseo}:undefined,[coastalAccess,barrakaAccess]):[];
  const canPlaceDecoration=(x:number,z:number,radius:number)=>routeClearance(routes,x,z,radius);
  scene.userData.decorationClearance=canPlaceDecoration;scene.userData.protectedRoutes=routes;scene.userData.layoutOnly=layoutOnly;
  scene.background = new THREE.Color("#bfe3f2");
  scene.fog = new THREE.Fog("#cfe9f3", 90, 260);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1500);
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.far=Math.max(1500,RADIUS*4*innerHeight/innerWidth);
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  scene.add(new THREE.HemisphereLight("#f4fbff", "#e6d6bd", 2.1));
  const sun = new THREE.DirectionalLight("#fff1d6", 1.9);
  sun.position.set(centre.x - 60, 90, centre.z + 40);
  sun.target.position.set(centre.x, 0, centre.z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const reach = RADIUS + 30;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 420 });
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  const poolRings = skeleton.pools.filter((p) => near(p.ring)).map((p) => p.ring);
  // Where the sea is on show, the ground seaward of the paseo follows the seaside heights.
  if ((mainPool || shown.some((p) => p.id === "south")) && skeleton.seafront) seaside = makeSeaside(skeleton.seafront, skeleton.viewRotation);
  await addGround(scene, skeleton, centre, poolRings);
  addFrontageDivisions(scene);
  if (seaside && skeleton.seafront) addSeaside(scene, skeleton.seafront, seaside, centre, RADIUS + 25, poolGroundY);
  const backdrop=new THREE.Scene();backdrop.visible=!layoutOnly;backdrop.userData.noDrape=true;addBackdrop(backdrop,centre);scene.add(backdrop);
  addBuildings(scene, buildings, skeleton.floorHeight);
  if(mainPool) addPoolAccess(scene, (x,z) => !!seaside?.inZone(x,z));
  const terraceIds = new Set(mainPool ? mainPoolLayout.terraceBuildingIds : []);
  const houses = buildings.filter((b) => !b.passage && !terraceIds.has(b.id) && (!mainPool || b.id !== skeleton.seafront?.restaurant.buildingId));
  if(!layoutOnly){addShutters(scene, houses, skeleton.floorHeight);addPorches(scene, houses, skeleton.floorHeight);}
  let coast = new CoastField([[-5000, 9000], [5000, 9000]], [0, 0]);
  if (mainPool) {
    addMainPoolTerraces(scene, buildings.filter((b) => terraceIds.has(b.id)), centroid(pool.ring));
    addRoofFins(scene);
    const map = await (await fetch(asset("/map/villacana.json"))).json();
    if (skeleton.seafront) addSeafrontOutlines(scene, skeleton.seafront, true, seaside);
    else addSeafront(scene, map.coast);
    coast = new CoastField(map.coast, map.landRef);
  } else if (shown.some((p) => p.id === "south") && skeleton.seafront) {
    // The south lawn looks out over its wall to the paseo, the beach and the sea.
    const map = await (await fetch(asset("/map/villacana.json"))).json();
    addSeafrontOutlines(scene, skeleton.seafront, false, seaside);
    coast = new CoastField(map.coast, map.landRef);
  }
  // The paseo's sandstone retaining wall; along the south lawn it is the sea wall, drawn once.
  if (seaside) addBarrakaBoardwalk(scene, (x,z) => seaside!.y(x,z));
  if (seaside && skeleton.seafront) addPaseoWall(scene, skeleton.seafront, seaside, liveGroundY);
  if (skeleton.seaWall) addSeaWall(scene, skeleton.seaWall.points, seaside ? paseoWallCovers : undefined);
  const nearbyPools = skeleton.pools.filter((p) => near(p.ring));
  const pools = addPools(scene, poolRings, nearbyPools.map((p) => p.kind === "toddler" ? { color: "#2346ab", tileColor: "#4563bf", deckY: LOWER_POOL_Y } : p.kind === "main" ? { color: "#35d5dc", tileColor: "#b8f2ef", deckY: LOWER_POOL_Y } : {}));
  addProps(scene, skeleton.props.filter((p) => Math.hypot(p.x - centre.x, p.z - centre.z) < RADIUS && (!layoutOnly||p.kind==="pool_steps"||p.kind==="pool_ladder") && !inElenaNorthReview(p.x,p.z) && canPlaceDecoration(p.x,p.z,propRadius(p.kind))));

  const player = new Player();
  player.group.userData.noDrape = true;
  scene.add(player.group);
  const walls = (layoutOnly?[]:skeleton.gardenWalls).filter(([x, z]) => Math.hypot(x - centre.x, z - centre.z) < RADIUS && !inReviewedFrontage(x,z) && !inCervantesWallReview(x,z) && !inCervantesNorthPatios(x,z) && !inElenaNorthReview(x,z) && canPlaceDecoration(x,z,.6));
  addGardenWalls(scene, walls, skeleton.boundaryReference);
  addGardenGates(scene, (layoutOnly?[]:skeleton.gardenGates).filter(([x,z])=>!inReviewedFrontage(x,z) && !inCervantesWallReview(x,z) && !inCervantesNorthPatios(x,z) && !inElenaNorthReview(x,z) && canPlaceDecoration(x,z,1.8)), walls);
  // Generated wall details are illustrative; only source-traced walls affect collision.
  if (skeleton.boundaryReference) {addBoundaryReference(scene, skeleton.boundaryReference);addDaliThreshold(scene);addCervantesPatioWalls(scene,skeleton.boundaryReference);addCervantesEastHedge(scene,skeleton.boundaryReference);addRampSteps(scene,skeleton.boundaryReference);addCervantesGardenDoor(scene,skeleton.boundaryReference);addElenaNorth(scene);addCervantesNorthPatios(scene,skeleton.boundaryReference);}
  addMiddlePool(scene);
  addMiddleSouthGate(scene);
  addElenaGatedEntry(scene);
  addEvaLawn(scene);
  const gate=addCoastalGate(scene,liveGroundY);
  if(layoutOnly&&skeleton.boundaryReference)addLayoutRoutes(scene,routes,skeleton.boundaryReference,liveGroundY);
  const fenceRings = barrierRings(skeleton.boundaryReference?.barriers ?? []);
  fenceRings.push(...elenaEntryRings());
  fenceRings.push(...evaWallRings());
  fenceRings.push(...middleSouthRings(),...middlePoolRings()); // traced middle pool gateway and planter are solid
  // Covered walk-throughs remain open; traced patio walls use their own rings.
  const solidBuildings = buildings.filter((b) => !b.passage && b.floors>0);
  const solids = new Solids([...solidBuildings.map((b) => b.id===POOL_TERRACE_ID?poolTerraceRing:b.ring), ...fenceRings, ...cervantesPatioWallRings(),...cervantesNorthPartitionRings(),...gardenDoorRings(),...elenaNorthRings(),...coastalWallRings(), ...accessWallRings(), ...seaWallRings(skeleton.seaWall?.points ?? [], seaside ? paseoWallCovers : undefined), ...(seaside ? paseoWallRings() : [])], Object.fromEntries(solidBuildings.flatMap((b,i)=>b.id===POOL_TERRACE_ID?[[i,-0.5]]:[])));
  const start = centroid(pool.ring);
  const spawn = findSpawn(start, pool.ring, buildings, poolRings);
  if (seafrontFocus && skeleton.seafront) {
    const restaurant = centroid(skeleton.seafront.restaurant.ring);
    const safe = skeleton.seafront.paseo.points.filter(([x, z]) => !buildings.some((b) => nearRing(x, z, b.ring, 1.5)));
    safe.sort((a, b) => Math.hypot(a[0] - restaurant.x, a[1] - restaurant.z) - Math.hypot(b[0] - restaurant.x, b[1] - restaurant.z));
    if (safe.length) { spawn[0] = safe[0][0]; spawn[1] = safe[0][1]; }
    const beach = centroid(skeleton.seafront.restaurant.terrace);
    start.x = beach.x; start.z = beach.z;
    document.querySelector("#title")!.textContent = "Paseo · Barraka Beach";
  }
  if (daliFocus && skeleton.boundaryReference) {
    const ref = skeleton.boundaryReference;
    const anchor = { x: ref.walkAnchor[0], z: ref.walkAnchor[1] };
    const road = ref.roads.find((r) => r.name === "Calle Pintor Dalí")!;
    const nearest = road.points.map((p) => ({ p, d: Math.hypot(p[0] - anchor.x, p[1] - anchor.z) })).sort((a, b) => a.d - b.d)[0].p;
    // Project onto the road rather than spawning in a parked bay or hedge.
    let best = { x: nearest[0], z: nearest[1], d: Infinity };
    for (let i = 0; i < road.points.length - 1; i++) {
      const a = road.points[i], b = road.points[i + 1];
      const hit = closestOnSegment(anchor.x, anchor.z, a[0], a[1], b[0], b[1]);
      if (hit.d < best.d) best = hit;
    }
    spawn[0] = best.x; spawn[1] = best.z;
    start.x = best.x + 5; start.z = best.z + 12;
    document.querySelector("#title")!.textContent = "Pintor Dalí · Calle Cervantes";
  }
  if (connectionFocus && skeleton.boundaryReference?.connection) {
    const road = skeleton.boundaryReference.roads.find((r) => r.id === "cervantes" || r.name === "Calle Cervantes" || r.name === "Calle Miguel de Cervantes")!;
    [spawn[0], spawn[1]] = road.points[0];
    [start.x, start.z] = road.points[1];
    document.querySelector("#title")!.textContent = "Dalí car park → Cervantes → Picasso car park";
  }
  if (rampFocus && skeleton.boundaryReference?.ramps?.length) {
    const [top,foot] = skeleton.boundaryReference.ramps[0].points;
    const dx=top[0]-foot[0], dz=top[1]-foot[1], length=Math.hypot(dx,dz);
    spawn[0]=foot[0]-dx/length*2; spawn[1]=foot[1]-dz/length*2;
    start.x=top[0]; start.z=top[1];
    document.querySelector("#title")!.textContent = "Calle Cervantes · Elena ramp";
  }
  if(new URLSearchParams(location.search).get("view")==="coastal-gate"){spawn[0]=coastalAccess.points[0][0];spawn[1]=coastalAccess.points[0][1];start.x=gate.at[0];start.z=gate.at[1];}
  // A link can start the walk anywhere: ?at=x,z stands the player there and &look=x,z faces them
  // that way. Both are in the master map's turned frame (sea downward), in metres.
  const spot = (name: string): Vec2 | undefined => {
    const v = new URLSearchParams(location.search).get(name)?.split(",").map(Number);
    if (!v || v.length !== 2 || !v.every(Number.isFinite)) return undefined;
    const turn = skeleton.viewRotation * Math.PI / 180;
    return [v[0] * Math.cos(turn) + v[1] * Math.sin(turn), -v[0] * Math.sin(turn) + v[1] * Math.cos(turn)];
  };
  const at = spot("at"), look = spot("look");
  if (at) { spawn[0] = at[0]; spawn[1] = at[1]; }
  if (look) { start.x = look[0]; start.z = look[1]; }
  player.place(spawn[0], spawn[1], 0);
  const world: MoveWorld = {
    solids:new GatedSolids(solids,()=>gate.open),
    coast,
    pools: poolRings,
    maxGroundStep:0.45,
    seaLevel: seaside?.seaY,
    poolFloor: (x,z) => POOL_STAND + (nearbyPools.some(p=>(p.id==="main"||p.id==="toddler")&&pointInRing(x,z,p.ring))?LOWER_POOL_Y:0),
    groundHeight: (x,z) => seaside?.inZone(x,z) ? seaside.y(x,z) + 0.06 : siteY(x,z) + stepsGroundOffset(x,z) + gardenGroundOffset(x,z,skeleton.boundaryReference) + poolGroundY(x,z) + (skeleton.boundaryReference ? referenceGroundHeight(skeleton.boundaryReference,x,z) : 0.06),
    bounds: { minX: centre.x - RADIUS, maxX: centre.x + RADIUS, minZ: centre.z - RADIUS, maxZ: centre.z + RADIUS },
  };

  bindInput();
  let camYaw = Math.atan2(start.x - spawn[0], -(start.z - spawn[1]));
  let pitch = seafrontFocus ? 0.75 : 0.45;
  let distance = seafrontFocus ? 90 : 6;
  let lookHold = 0;
  // Far enough back to take in every courtyard on show.
  let farthest = RADIUS * 2.6 * Math.max(1,innerHeight/innerWidth);
  window.addEventListener("resize",()=>{const previous=farthest;farthest=RADIUS*2.6*Math.max(1,innerHeight/innerWidth);if(overview)distance*=farthest/previous;});
  let wasOverview = false;
  const overviewCentre=new THREE.Vector3(centre.x,0.5,centre.z);
  const refPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-0.27),raycaster=new THREE.Raycaster();
  const references=referenceEditor({surface:canvas,labels:mapLabels(skeleton),enabled:()=>overview,
    project:(x,z)=>{const p=new THREE.Vector3(x,liveGroundY(x,z)+1,z).project(camera),y=(1-p.y)*innerHeight/2;
      const top=document.querySelector("#areas")!.getBoundingClientRect().bottom+8;
      const bottom=document.querySelector(".reference-tools")?.getBoundingClientRect().top??innerHeight-180;
      return {x:(p.x+1)*innerWidth/2,y,visible:p.z>-1&&p.z<1&&p.x>-1&&p.x<1&&y>top&&y<bottom-12};},
    unproject:(x,y)=>{raycaster.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),camera);const hit=raycaster.intersectObjects(scene.children,true).find(h=>h.object.userData.referenceSurface);const p=hit?.point??raycaster.ray.intersectPlane(refPlane,new THREE.Vector3());return p&&Math.abs(p.x)<500&&Math.abs(p.z)<500?[p.x,p.z]:null;}
  });
  // Map targets stay in the same world coordinates at every zoom and bearing.
  const checks = new THREE.Group();
  checks.name="map-alignment-checks"; checks.userData.noDrape=true;
  const checkLine=(points:Vec2[],closed=false,dashed=false)=>{
    const material=dashed?new THREE.LineDashedMaterial({color:0xe22222,depthTest:false,dashSize:2,gapSize:1}):new THREE.LineBasicMaterial({color:0xe22222,depthTest:false});
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints((closed?[...points,points[0]]:points).map(([x,z])=>new THREE.Vector3(x,liveGroundY(x,z)+.2,z))),material);
    line.computeLineDistances();line.renderOrder=100;checks.add(line);
  };
  const platform=skeleton.buildings.find(b=>b.id===POOL_TERRACE_ID);
  if(mainPool&&platform)checkLine(platform.ring,true);
  if(seaside&&skeleton.seafront)checkLine(skeleton.seafront.coast,false,true);
  scene.add(checks);
  let showChecks=true;
  const notes=document.querySelector<HTMLElement>("#alignment-notes")!;
  if(matchMedia("(max-width:700px)").matches)document.querySelector<HTMLDetailsElement>("#alignment-details")!.open=false;
  document.querySelector<HTMLButtonElement>("#alignment-platform")!.hidden=!mainPool;
  document.querySelector<HTMLButtonElement>("#alignment-coast")!.hidden=!seaside;
  const controls=document.querySelector<HTMLElement>("#overview-controls")!;
  const action=(id:string,callback:()=>void)=>document.querySelector(id)!.addEventListener("click",callback);
  action("#overview-in",()=>{distance=Math.max(8,distance/1.3);});action("#overview-out",()=>{distance=Math.min(farthest,distance*1.3);});
  action("#overview-left",()=>{camYaw-=Math.PI/12;});action("#overview-right",()=>{camYaw+=Math.PI/12;});
  action("#overview-top",()=>{pitch=Math.PI/2;});action("#overview-north",()=>{camYaw=0;});
  action("#overview-fit",()=>{overviewCentre.set(centre.x,0.5,centre.z);distance=farthest;pitch=Math.PI/2;camYaw=0;});
  const panMode=(pan:boolean)=>{
    overviewPan=pan;
    document.querySelector("#overview-pan")!.setAttribute("aria-pressed",String(pan));
    document.querySelector("#overview-rotate")!.setAttribute("aria-pressed",String(!pan));
  };
  action("#overview-pan",()=>panMode(true));action("#overview-rotate",()=>panMode(false));
  const rotation=document.querySelector<HTMLInputElement>("#overview-rotation")!;
  rotation.addEventListener("input",()=>{camYaw=-Number(rotation.value)*Math.PI/180;});
  action("#overview-check",()=>{showChecks=!showChecks;document.querySelector("#overview-check")!.setAttribute("aria-pressed",String(showChecks));});
  const focus=(points:Vec2[])=>{const at=centroid(points);overviewCentre.set(at.x,.5,at.z);distance=Math.min(farthest,85);pitch=Math.PI/2;};
  action("#alignment-platform",()=>{if(platform)focus(platform.ring);});
  action("#alignment-coast",()=>{if(skeleton.seafront)focus(skeleton.seafront.coast);});
  document.querySelector("#overview")!.textContent=overview?"Walk":"Overview";
  const fog = scene.fog as THREE.Fog;
  const target = new THREE.Vector3();
  const clock = new THREE.Clock();

  // Everything is built on the flat; now lift it onto the ground heights.
  drapeScene(scene, buildings);

  const gateButton=document.querySelector<HTMLButtonElement>("#gate-control")!;
  gateButton.addEventListener("click",()=>{gate.setOpen(!gate.open);gateButton.textContent=gate.open?"Close coastal gate":"Open coastal gate";});
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    readKeys();
    const currentRoute=document.querySelector<HTMLElement>("#current-route")!;
    const nearbyNames=routes.map(r=>({name:r.name,d:Math.min(...r.points.slice(1).map((b,i)=>closestOnSegment(player.x,player.z,...r.points[i],...b).d)),width:r.width})).filter(r=>r.d<r.width/2+.7).sort((a,b)=>a.d-b.d);
    const routeNames=[...new Set(nearbyNames.map(r=>r.name))].slice(0,2);currentRoute.hidden=overview||!routeNames.length;currentRoute.textContent=routeNames.join(" · ");
    gateButton.hidden=overview||Math.hypot(player.x-gate.at[0],player.z-gate.at[1])>6;
    if(!overview && !references.active()) player.update(dt, input, world, camYaw);

    const moving = input.moveX * input.moveX + input.moveZ * input.moveZ > 0.04;
    if (input.lookDx || input.lookDy) lookHold = 0.9;
    lookHold = Math.max(0, lookHold - dt);
    camYaw += input.lookDx * 0.0045;
    if (overview !== wasOverview) {
      // The overview button jumps between walking height and looking down on the whole area.
      wasOverview = overview;
      controls.hidden=!overview;backdrop.visible=!overview&&!layoutOnly;
      document.querySelector("#help")!.textContent=overview?"Drag to pan · pinch or +/− to zoom · ↶/↷ to rotate":"WASD or left thumb to walk · drag to look";
      if(overview)camYaw=0;
      distance = overview ? farthest : 6;
      pitch = overview ? Math.PI/2 : 0.45;
    }
    pitch = clamp(pitch + input.lookDy * 0.0035, 0.15, overview ? Math.PI/2 : 1.45);
    distance = clamp(distance * Math.exp(input.zoom * 0.08), overview ? 8 : 3.5, farthest);
    // Push the haze back as the camera rises, so the layout stays clear from above.
    fog.near = 90 + distance * 1.5;
    fog.far = 260 + distance * 3;
    if (!overview && lookHold === 0 && moving) camYaw = dampAngle(camYaw, player.yaw, dt * 2.2);

    if(overview) {
      const scale=distance/innerHeight;
      const dx=panDx*scale-input.moveX*dt*distance*0.4, dz=panDy*scale+input.moveZ*dt*distance*0.4;
      overviewCentre.x-=Math.cos(camYaw)*dx+Math.sin(camYaw)*dz;
      overviewCentre.z-=Math.sin(camYaw)*dx-Math.cos(camYaw)*dz;
      overviewCentre.x=clamp(overviewCentre.x,centre.x-RADIUS,centre.x+RADIUS);overviewCentre.z=clamp(overviewCentre.z,centre.z-RADIUS,centre.z+RADIUS);
      target.copy(overviewCentre);
    } else target.set(player.x, player.y + 1.3, player.z);
    panDx=panDy=0;
    const hd = Math.cos(pitch) * distance;
    camera.position.set(target.x - Math.sin(camYaw) * hd, target.y + Math.sin(pitch) * distance, target.z + Math.cos(camYaw) * hd);
    camera.lookAt(target);
    pools.update(clock.elapsedTime);
    camera.updateMatrixWorld();
    document.querySelector<HTMLElement>(".reference-tools")!.style.bottom=`${controls.offsetHeight+72}px`;
    checks.visible=overview&&showChecks;
    notes.hidden=!overview||!showChecks;
    const bearing=((Math.round(-camYaw*180/Math.PI)%360)+360)%360;
    rotation.value=String(bearing);
    document.querySelector("#overview-bearing")!.textContent=`${bearing}°`;
    controls.dataset.distance=distance.toFixed(2);controls.dataset.bearing=String(bearing);
    controls.dataset.centre=`${overviewCentre.x.toFixed(2)},${overviewCentre.z.toFixed(2)}`;
    references.update();
    renderer.render(scene, camera);

    input.jump = false;
    input.lookDx = 0;
    input.lookDy = 0;
    input.zoom = 0;
  });
}

function findSpawn(centre: { x: number; z: number }, pool: Vec2[], buildings: SkeletonBuilding[], pools: Vec2[][]): Vec2 {
  for (let r = 7; r < 30; r += 1.5) {
    for (let a = Math.PI; a < Math.PI * 3; a += Math.PI / 8) {
      const x = centre.x + Math.sin(a) * r;
      const z = centre.z + Math.cos(a) * r;
      if (pointInRing(x, z, pool) || pools.some((ring) => pointInRing(x, z, ring))) continue;
      if (buildings.some((b) => nearRing(x, z, b.ring, 1.5))) continue;
      return [x, z];
    }
  }
  return [centre.x, centre.z];
}

function nearRing(x: number, z: number, ring: Vec2[], margin: number): boolean {
  if (pointInRing(x, z, ring)) return true;
  return ring.some((p) => Math.hypot(p[0] - x, p[1] - z) < margin);
}

async function addGround(scene: THREE.Scene, skeleton: Skeleton, centre: { x: number; z: number }, pools: Vec2[][]): Promise<void> {
  const cover = skeleton.cover;
  const image = await new THREE.ImageLoader().loadAsync(asset(cover.image));
  const w = cover.maxX - cover.minX;
  const h = cover.maxZ - cover.minZ;

  // Redraw the part of the cover around this area larger and softened, so the
  // edges between grass, path and deck are soft lines instead of squares.
  const span = RADIUS + 25;
  const size = 2048;
  const paint = document.createElement("canvas");
  paint.width = paint.height = size;
  const pctx = paint.getContext("2d")!;
  pctx.fillStyle = skeleton.cover.classes.paving;
  pctx.fillRect(0, 0, size, size);
  pctx.filter = layoutOnly?"none":"blur(2.5px)";
  const perMetre = image.width / w;
  pctx.drawImage(
    image,
    (centre.x - span - cover.minX) * perMetre,
    (centre.z - span - cover.minZ) * perMetre,
    span * 2 * perMetre,
    span * 2 * perMetre,
    0,
    0,
    size,
    size,
  );
  // Paint short blades all over the lawn so it reads as grass right to its edges.
  pctx.filter = "none";
  const painted = pctx.getImageData(0, 0, size, size).data;
  // Keep classification pixels intact, but make the rendered turf less saturated.
  const turf=new ImageData(new Uint8ClampedArray(painted),size,size);
  const lawnColour=skeleton.cover.classes.lawn,lr=parseInt(lawnColour.slice(1,3),16),lg=parseInt(lawnColour.slice(3,5),16),lb=parseInt(lawnColour.slice(5,7),16);
  for(let k=0;k<painted.length;k+=4) if(Math.abs(painted[k]-lr)+Math.abs(painted[k+1]-lg)+Math.abs(painted[k+2]-lb)<30) {
    const v=(hash(k,2.1)-.5)*14;turf.data[k]=105+v;turf.data[k+1]=124+v;turf.data[k+2]=78+v;
  }
  pctx.putImageData(turf,0,0);
  // Lanes and patios are paved in square terracotta tiles, laid square to the houses.
  const rgbOf = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const paving = rgbOf(skeleton.cover.classes.paving);
  const tiled = document.createElement("canvas");
  tiled.width = tiled.height = size;
  const tctx = tiled.getContext("2d")!;
  const mask = tctx.createImageData(size, size);
  for (let k = 0; k < painted.length; k += 4) {
    if (Math.abs(painted[k] - paving[0]) + Math.abs(painted[k + 1] - paving[1]) + Math.abs(painted[k + 2] - paving[2]) < 36) mask.data[k + 3] = 255;
  }
  tctx.putImageData(mask, 0, 0);
  const tilePx = Math.max(4,Math.round((size / (span * 2)) * 0.4));
  const swatch = document.createElement("canvas");swatch.width=swatch.height=tilePx*4;
  swatch.getContext("2d")!.drawImage(pavingCanvas(),0,0,swatch.width,swatch.height);
  const pattern = tctx.createPattern(swatch, "repeat")!;
  pattern.setTransform(new DOMMatrix().rotate(-skeleton.viewRotation));
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = pattern;
  tctx.fillRect(0, 0, size, size);
  pctx.drawImage(tiled, 0, 0);

  const lawn = skeleton.cover.classes.lawn;
  const lawnRgb = [parseInt(lawn.slice(1, 3), 16), parseInt(lawn.slice(3, 5), 16), parseInt(lawn.slice(5, 7), 16)];
  pctx.lineCap = "round";
  pctx.lineWidth = 0.6;
  for (let i = 0; i < 90000; i++) {
    const x = Math.floor(hash(i, 1.7) * size);
    const y = Math.floor(hash(i, 9.1) * size);
    const k = (y * size + x) * 4;
    if (Math.abs(painted[k] - lawnRgb[0]) + Math.abs(painted[k + 1] - lawnRgb[1]) + Math.abs(painted[k + 2] - lawnRgb[2]) > 30) continue;
    pctx.strokeStyle = ["#62744c", "#7c895f", "#526644", "#9d9b75"][i % 4];
    pctx.beginPath();
    pctx.moveTo(x, y);
    pctx.lineTo(x + (hash(i, 3.3) - 0.5) * 2, y - 1 - hash(i, 5.9) * 2);
    pctx.stroke();
  }
  if (seaside) {
    // Cut the flat sheet away seaward of the paseo; the sand there has its own heights.
    const turn = skeleton.viewRotation * Math.PI / 180, out: Vec2 = [Math.sin(turn) * 3000, Math.cos(turn) * 3000];
    // Carry the edge on past both ends of the mapped paseo.
    const far = (a: Vec2, b: Vec2): Vec2 => [b[0] + (b[0] - a[0]) * 50, b[1] + (b[1] - a[1]) * 50];
    const edge = [far(seaside.edge[1], seaside.edge[0]), ...seaside.edge, far(seaside.edge[seaside.edge.length - 2], seaside.edge[seaside.edge.length - 1])], first = edge[0], last = edge[edge.length - 1];
    const px = ([x, z]: Vec2): [number, number] => [(x - (centre.x - span)) / (span * 2) * size, (z - (centre.z - span)) / (span * 2) * size];
    pctx.globalCompositeOperation = "destination-out";
    pctx.beginPath();
    [...edge, [last[0] + out[0], last[1] + out[1]] as Vec2, [first[0] + out[0], first[1] + out[1]] as Vec2].forEach((p, i) => i ? pctx.lineTo(...px(p)) : pctx.moveTo(...px(p)));
    pctx.fill();
    pctx.globalCompositeOperation = "source-over";
  }
  const texture = new THREE.CanvasTexture(paint);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // The ground is one sheet with the pools cut out of it.
  const showLowerDeck=pools.some(r=>pointInRing(...r[0],lowerPoolRing));
  const sheet = shapeOf(
    [[centre.x - span, centre.z - span], [centre.x + span, centre.z - span], [centre.x + span, centre.z + span], [centre.x - span, centre.z + span]],
    showLowerDeck?[...pools.filter(r=>!pointInRing(...r[0],lowerPoolRing)),lowerPoolRing]:pools,
  );
  const geometry = new THREE.ShapeGeometry(sheet).rotateX(-Math.PI / 2);
  if(showLowerDeck) for(const ring of lowerPoolHoles) {const island=new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(ring)).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:"#c78667",roughness:0.95}));island.userData.referenceSurface=true;scene.add(island);}
  const at = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < at.count; i++) {
    uv.setXY(i, (at.getX(i) - (centre.x - span)) / (span * 2), 1 - (at.getZ(i) - (centre.z - span)) / (span * 2));
  }
  if(showLowerDeck) {
  const lowerGeometry=lowerPoolSurface(pools.filter(r=>pointInRing(...r[0],lowerPoolRing)));
  const lowerUv:number[]=[];const lowerAt=lowerGeometry.getAttribute("position");
  for(let i=0;i<lowerAt.count;i++) lowerUv.push((lowerAt.getX(i)-(centre.x-span))/(span*2),1-(lowerAt.getZ(i)-(centre.z-span))/(span*2));
  lowerGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(lowerUv,2));
  const lowerGround=new THREE.Mesh(lowerGeometry,new THREE.MeshStandardMaterial({map:texture,roughness:0.95,alphaTest:0.5}));lowerGround.receiveShadow=true;lowerGround.userData.referenceSurface=true;scene.add(lowerGround);
  }
  const ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, alphaTest: 0.5 }));
  ground.receiveShadow = true;
  ground.userData.noDrape = true;
  addRaisedGround(scene, ground.material, centre, span);
  ground.userData.referenceSurface=true;
  scene.add(ground);

  // Plants grow according to the ground cover: trees on planting, tufts on lawn.
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const ctx = probe.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height).data;
  const classes = Object.entries(skeleton.cover.classes).map(([name, hex]) => ({
    name,
    rgb: [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)],
  }));
  const coverAt = (x: number, z: number): string => {
    const px = Math.floor(((x - cover.minX) / w) * image.width);
    const pz = Math.floor(((z - cover.minZ) / h) * image.height);
    if (px < 0 || pz < 0 || px >= image.width || pz >= image.height) return "";
    const i = (pz * image.width + px) * 4;
    let best = "";
    let bestD = 60;
    for (const c of classes) {
      const d = Math.abs(data[i] - c.rgb[0]) + Math.abs(data[i + 1] - c.rgb[1]) + Math.abs(data[i + 2] - c.rgb[2]);
      if (d < bestD) {
        bestD = d;
        best = c.name;
      }
    }
    return best;
  };
  const scatter = (step: number, wanted: string, reach: number): SpritePlacement[] => {
    const out: SpritePlacement[] = [];
    for (let x = centre.x - reach; x <= centre.x + reach; x += step) {
      for (let z = centre.z - reach; z <= centre.z + reach; z += step) {
        const jx = x + (hash(x, z) - 0.5) * step * 0.9;
        const jz = z + (hash(z, x) - 0.5) * step * 0.9;
        // Nothing grows on the sand.
        if (seaside?.inZone(jx, jz)) continue;
        if (inMiddlePoolReview(jx, jz) || inEvaLawn(jx, jz)) continue;
        if (coverAt(jx, jz) === wanted) out.push({ x: jx, y:poolGroundY(jx,jz), z: jz, scale: 0.75 + hash(x + 7, z) * 0.5 });
      }
    }
    return out;
  };
  if(layoutOnly)return;
  // Inside the courtyard every tree is placed by hand from the photos, so the
  // scattered ones only fill in beyond it.
  const fromCourt = (p: SpritePlacement) => Math.min(...COURTS.map((c) => Math.hypot(p.x - c.x, p.z - c.z)));
  addSprites(scene, "tree", scatter(3.6, "planting", RADIUS).filter((p) => fromCourt(p) > COURTYARD && !inElenaNorthReview(p.x, p.z)));
  // Tufts only near the courtyards; the painted blades cover lawns further off.
  addSprites(scene, "grass", scatter(0.8, "lawn", RADIUS).filter((p) => fromCourt(p) < 45 && !inElenaNorthReview(p.x, p.z)).map((p) => ({ ...p, scale: 0.16 + hash(p.x, p.z) * 0.14 })));
}

function shapeOf(ring: Vec2[], holes: Vec2[][] = []): THREE.Shape {
  // Shape y is north, so the extruded solid can be laid flat with one turn.
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const hole of holes) shape.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))));
  return shape;
}

function addBuildings(scene: THREE.Scene, buildings: SkeletonBuilding[], floorHeight: number): void {
  const wall = plasterMaterial(WALL);
  const grey = new THREE.MeshStandardMaterial({ color: ROOF_GREY, roughness: 0.95 });
  const terrace = new THREE.MeshStandardMaterial({ color: ROOF_TERRACE, roughness: 0.9 });
  for (const b of buildings) {
    const c = centroid(b.ring);
    // A zero-storey enclosure is not evidence of a solid house or measured walls.
    const height = b.floors > 0 ? b.floors * floorHeight : .035;
    // A covered walk-through is only the storey above; the lane runs under it.
    const lift = b.passage ? PASSAGE_HEADROOM : 0;
    const cap = b.floors === 0 || hash(c.x, c.z) < 0.22 ? terrace : grey;
    const geometry = new THREE.ExtrudeGeometry(shapeOf(b.id===POOL_TERRACE_ID?poolTerraceRing:b.ring, b.holes), { depth: height - lift, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, [cap, wall]);
    mesh.position.y = lift;
    if(b.id===POOL_TERRACE_ID) {mesh.position.y=LOWER_POOL_Y;mesh.userData.referenceSurface=true;}
    // A building out on the sand stands at the beach's height.
    else if(seaside?.inZone(c.x,c.z)) mesh.position.y=seaside.y(c.x,c.z);
    mesh.castShadow = mesh.receiveShadow = true;
    // A house keeps one floor level: the ground height at its middle.
    mesh.userData.base = [c.x, c.z];
    mesh.name=`building:${b.id}`;mesh.userData.structural=true;
    scene.add(mesh);
    const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(b.ring.map(([x,z])=>new THREE.Vector3(x,height+lift+.012,z))),new THREE.LineBasicMaterial({color:b.floors>0?"#59564e":"#936347"}));
    outline.position.y=mesh.position.y-lift;outline.userData.base=[c.x,c.z];scene.add(outline);
  }
}

function addShutters(scene: THREE.Scene, buildings: SkeletonBuilding[], floorHeight: number): void {
  const houses = buildings.filter((b) => b.floors > 0);
  const windows: THREE.Matrix4[] = [];
  const doors: THREE.Matrix4[] = [];
  const surrounds: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const b of houses) {
    const ring = b.ring;
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 2.6) continue;
      let nx = (bz - az) / length;
      let nz = -(bx - ax) / length;
      const mx = (ax + bx) / 2;
      const mz = (az + bz) / 2;
      if (pointInRing(mx + nx * 0.3, mz + nz * 0.3, ring)) {
        nx = -nx;
        nz = -nz;
      }
      const count = Math.max(1, Math.floor(length / 3.1));
      const turn = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(nx, nz));
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        const x = ax + (bx - ax) * t + nx * 0.04;
        const z = az + (bz - az) * t + nz * 0.04;
        // A wall shared with the next house has no openings.
        if (houses.some((o) => o !== b && pointInRing(x + nx * 0.5, z + nz * 0.5, o.ring))) continue;
        for (let f = 0; f < b.floors; f++) {
          const door = f === 0 && hash(x, z) < 0.3;
          const y = f * floorHeight + (door ? 1.05 : 1.3);
          (door ? doors : windows).push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), turn, new THREE.Vector3(1, 1, 1)));
          // A white moulding over each opening, and a sill under the windows.
          const head = y + (door ? 1.05 : 0.9) + 0.14;
          surrounds.push(new THREE.Matrix4().compose(new THREE.Vector3(x + nx * 0.05, head, z + nz * 0.05), turn, new THREE.Vector3(1.5, 0.16, 0.16)));
          if (!door) surrounds.push(new THREE.Matrix4().compose(new THREE.Vector3(x + nx * 0.05, y - 0.95, z + nz * 0.05), turn, new THREE.Vector3(1.35, 0.1, 0.2)));
        }
      }
    }
  }
  const material = new THREE.MeshStandardMaterial({ map: slatTexture(), roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.5 });
  const place = (geometry: THREE.PlaneGeometry, list: THREE.Matrix4[]) => {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    scene.add(mesh);
  };
  place(new THREE.PlaneGeometry(1.15, 1.8), windows);
  place(new THREE.PlaneGeometry(1.15, 2.1), doors);
  const mouldings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.9 }), surrounds.length);
  surrounds.forEach((matrix, i) => mouldings.setMatrixAt(i, matrix));
  mouldings.castShadow = true;
  scene.add(mouldings);
}

/** Low white garden walls round the lawn, with hedges growing over them in places. */
function addGardenWalls(scene: THREE.Scene, walls: Vec2[], reference?: BoundaryReference): void {
  // A continuous wall: a straight run between each pair of neighbouring points,
  // with a slim round joint at each point so curves stay smooth.
  const m = new THREE.Matrix4();
  const still = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const material = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.95 });
  const runs: THREE.Matrix4[] = [];
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const dx = walls[j][0] - walls[i][0], dz = walls[j][1] - walls[i][1];
      const length = Math.hypot(dx, dz);
      if (length > 0.8) continue;
      const turn = new THREE.Quaternion().setFromAxisAngle(up, -Math.atan2(dz, dx));
      runs.push(new THREE.Matrix4().compose(new THREE.Vector3(walls[i][0] + dx / 2, 0.5, walls[i][1] + dz / 2), turn, new THREE.Vector3(length, 1, 0.34)));
    }
  }
  const lengths = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, runs.length);
  runs.forEach((matrix, i) => lengths.setMatrixAt(i, matrix));
  const blocks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.17, 1.0, 10), material, walls.length);
  walls.forEach(([x, z], i) => {
    m.compose(new THREE.Vector3(x, 0.5, z), still, new THREE.Vector3(1, 1, 1));
    blocks.setMatrixAt(i, m);
  });
  blocks.castShadow = blocks.receiveShadow = lengths.castShadow = lengths.receiveShadow = true;
  scene.add(blocks, lengths);

  // Hedges come in runs: a few metres of hedge, then bare wall.
  const hedged = walls.filter(([x, z]) => hash(Math.floor(x / 4), Math.floor(z / 4)) < 0.5 && !reference?.roads.some((road) => road.surface === "terracotta" && roadHeight(road,x,z).distance < road.width/2 + 1.5));
  const place = ([x, z]: Vec2): SpritePlacement => ({ x, y: 0.55, z, scale: 0.9 + hash(x, z) * 0.3 });
  const flowering = (p: Vec2) => hash(Math.floor(p[0] / 8), Math.floor(p[1] / 8)) < 0.5;
  addSprites(scene, "hibiscus_hedge", hedged.filter(flowering).map(place));
  addSprites(scene, "hedge", hedged.filter((p) => !flowering(p)).map(place));
}

/**
 * Front porches on walls that face open ground: a clay-tiled
 * lean-to roof, and on two-storey houses a balcony: wooden under that roof,
 * or a plain wrought-iron one.
 */
function addPorches(scene: THREE.Scene, buildings: SkeletonBuilding[], floorHeight: number): void {
  const protectedRoutesForPorches=(scene.userData.protectedRoutes??[]) as import("./route-clearance").ProtectedRoute[];
  const houses = buildings.filter((b) => b.floors > 0);
  const blocked = (x: number, z: number) => houses.some((o) => pointInRing(x, z, o.ring));
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3(1, 0, 0);
  const parts: Record<"white" | "tile" | "wood" | "iron" | "canvas", THREE.Matrix4[]> = { white: [], tile: [], wood: [], iron: [], canvas: [] };
  const climbers: SpritePlacement[] = [];
  const WIDTH = 3.4;
  const DEPTH = 1.5;

  for (const b of houses) {
    const ring = b.ring;
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < WIDTH + 0.6) continue;
      if(inCervantesWallReview((ax+bx)/2,(az+bz)/2)||inDaliThreshold((ax+bx)/2,(az+bz)/2))continue;
      const tx = (bx - ax) / length;
      const tz = (bz - az) / length;
      let nx = tz;
      let nz = -tx;
      if (pointInRing((ax + bx) / 2 + nx * 0.3, (az + bz) / 2 + nz * 0.3, ring)) {
        nx = -nx;
        nz = -nz;
      }
      const turn = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(nx, nz));
      const count = Math.floor(length / (WIDTH + 1.6)) || 1;
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        if(!routeClearance(protectedRoutesForPorches,x+nx*1.3,z+nz*1.3,WIDTH/2))continue;
        // Only where the house looks out over a lane or garden.
        if ([1, 2.5, 4.5].some((d) => blocked(x + nx * d, z + nz * d))) continue;
        // A box given in porch space: across the wall, up, and out from it.
        const box = (list: THREE.Matrix4[], across: number, y: number, out: number, sx: number, sy: number, sz: number, tilt = 0) => {
          const q = tilt ? turn.clone().multiply(new THREE.Quaternion().setFromAxisAngle(side, tilt)) : turn;
          const p = new THREE.Vector3(x + tx * across + nx * out, y, z + tz * across + nz * out);
          list.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(sx, sy, sz)));
        };
        const top = Math.min(b.floors, 2) * floorHeight - 0.35;
        // Half the balconies are wooden with a little tiled roof; the rest are plain iron.
        const wooden = b.floors < 2 || hash(x * 3.1, z * 1.7) < 0.5;
        if (wooden) {
          box(parts.tile, 0, top - 0.22, DEPTH / 2 + 0.1, WIDTH + 0.3, 0.12, DEPTH + 0.5, 0.3);
        }
        if (!wooden) {
          // Plain fronts get a patio: sometimes an awning and a climber.
          const pick = hash(x * 0.7, z * 2.3);
          if (pick < 0.45) box(parts.canvas, 0, 2.55, 1.0, WIDTH, 0.05, 2.1, 0.32);
          if (pick > 0.6) climbers.push({ x: x + tx * (WIDTH / 2) + nx * 0.25, y: 1.2, z: z + tz * (WIDTH / 2) + nz * 0.25 });
        }
        if (b.floors >= 2) {
          const rail = wooden ? parts.wood : parts.iron;
          const bar = wooden ? 0.07 : 0.03;
          const depth = wooden ? DEPTH : 0.7;
          box(parts.white, 0, floorHeight - 0.08, depth / 2, WIDTH, 0.16, depth);
          box(rail, 0, floorHeight + 0.95, depth - 0.05, WIDTH, bar + 0.02, bar + 0.02);
          for (let r = -6; r <= 6; r++) box(rail, (r * WIDTH) / 13, floorHeight + 0.5, depth - 0.05, bar, 0.9, bar);
          if (wooden) {
            for (const edge of [-WIDTH / 2 + 0.1, WIDTH / 2 - 0.1]) {
              box(parts.wood, edge, floorHeight + (top - floorHeight - 0.5) / 2, DEPTH - 0.1, 0.12, top - floorHeight - 0.5, 0.12);
            }
          }
        }
      }
    }
  }
  addSprites(scene, "bougainvillea", climbers);
  const colours = { white: WALL, tile: "#b9663f", wood: SHUTTER, iron: "#1d1b1a", canvas: "#efe6d2" };
  const unit = new THREE.BoxGeometry(1, 1, 1);
  for (const key of ["white", "tile", "wood", "iron", "canvas"] as const) {
    const mesh = new THREE.InstancedMesh(unit, new THREE.MeshStandardMaterial({ color: colours[key], roughness: 0.9 }), parts[key].length);
    parts[key].forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = key === "white" || key === "tile" || key === "canvas";
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

/** Brown wooden Persian-blind slats in an arched frame. */
function slatTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 112;
  const g = c.getContext("2d")!;
  // An arched opening: everything outside the arch stays see-through.
  g.beginPath();
  g.moveTo(2, 110);
  g.lineTo(2, 30);
  g.quadraticCurveTo(2, 2, 32, 2);
  g.quadraticCurveTo(62, 2, 62, 30);
  g.lineTo(62, 110);
  g.closePath();
  g.fillStyle = "#4a2a14";
  g.fill();
  g.clip();
  g.fillStyle = SHUTTER;
  g.fillRect(5, 5, 54, 104);
  g.fillStyle = "#5b3519";
  for (let y = 8; y < 108; y += 6) g.fillRect(5, y, 54, 2);
  g.fillStyle = "#4a2a14";
  g.fillRect(31, 2, 2, 108);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Hand-placed things from the skeleton, each drawn according to its kind. */
function addProps(scene: THREE.Scene, props: Skeleton["props"]): void {
  const white = plasterMaterial(WALL);
  const steel = new THREE.MeshStandardMaterial({ color: "#c9d1d6", roughness: 0.25, metalness: 0.8 });
  const ring = new THREE.MeshStandardMaterial({ color: "#e8532b", roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: "#1d1b1a", roughness: 0.6 });
  const canvas = new THREE.MeshStandardMaterial({ color: "#efe6d2", roughness: 0.9 });
  const mesh = new THREE.MeshStandardMaterial({ color: "#6f6a64", roughness: 0.8 });
  const blueLounger = new THREE.MeshStandardMaterial({ color: "#4096d2", roughness: 0.8 });
  const sprites: Partial<Record<SpriteKind, SpritePlacement[]>> = {};
  const add = (mesh: THREE.Mesh, x: number, y: number, z: number) => {
    mesh.position.set(x, y+groundY(x,z), z);
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  };
  for (const p of props) {
    switch (p.kind) {
      case "pool_steps":
        // Three wide steps going down into the water.
        for (let i = 0; i < 3; i++) add(new THREE.Mesh(new THREE.CylinderGeometry(1.5 - i * 0.4, 1.5 - i * 0.4, 0.3, 20), white), p.x, -0.95 + i * 0.3, p.z);
        break;
      case "pool_ladder":
        for (const side of [-0.25, 0.25]) {
          const rail = add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 16, Math.PI), steel), p.x + side, 0.45, p.z);
          rail.rotation.y = Math.PI / 2;
          add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), steel), p.x + side, -0.2, p.z - 0.42);
          add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), steel), p.x + side, 0.2, p.z + 0.42);
        }
        break;
      case "pump_box":
        add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.9), white), p.x, 0.32, p.z);
        break;
      case "life_ring": {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), steel), p.x, 0.75, p.z);
        add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 10, 20), ring), p.x, 1.35, p.z + 0.1);
        break;
      }
      case "parasol": {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8), steel), p.x, 1.15, p.z);
        add(new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 8), canvas), p.x, 2.45, p.z);
        break;
      }
      case "blue_sun_lounger":
      case "sun_lounger": {
        const fabric = p.kind === "blue_sun_lounger" ? blueLounger : mesh;
        add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 1.3), fabric), p.x, 0.32, p.z);
        const back = add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.75), fabric), p.x, 0.58, p.z - 0.9);
        back.rotation.x = 0.85;
        break;
      }
      case "bench": {
        add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.6), white), p.x, 0.22, p.z);
        add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.18), white), p.x, 0.75, p.z - 0.3);
        break;
      }
      case "lamp_post": {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 8), dark), p.x, 1.4, p.z);
        add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: "#ffe9b0" })), p.x, 3.0, p.z);
        break;
      }
      case "plant_pot": {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.5, 12), new THREE.MeshStandardMaterial({ color: "#c27a5a", roughness: 0.9 })), p.x, 0.25, p.z);
        (sprites.oleander ??= []).push({ x: p.x, y: 0.45, z: p.z, scale: 0.6 });
        break;
      }
      case "monkey_puzzle":
        (sprites.pine ??= []).push({ x: p.x, z: p.z });
        break;
      case "passage":
      case "gate":
      case "sign":
        // Shown on the master map; not yet built in 3D.
        break;
      default:
        if (p.kind in SPRITE_SIZE) (sprites[p.kind as SpriteKind] ??= []).push({ x: p.x, z: p.z });
    }
  }
  for (const [kind, places] of Object.entries(sprites)) addSprites(scene, kind as SpriteKind, places.map(p=>({...p,y:(p.y??0)+groundY(p.x,p.z)})));
}

/** Upright black bars in a frame, see-through between them. */
function ironTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.strokeStyle = "#1d1b1a";
  g.lineWidth = 5;
  g.strokeRect(3, 3, 58, 122);
  g.lineWidth = 3;
  for (let x = 13; x < 60; x += 9.5) {
    g.beginPath();
    g.moveTo(x, 3);
    g.lineTo(x, 125);
    g.stroke();
  }
  g.strokeRect(3, 60, 58, 1);
  return new THREE.CanvasTexture(c);
}

/** An arched white gateway with an iron gate at each gap in the garden walls. */
function addGardenGates(scene: THREE.Scene, gates: Vec2[], walls: Vec2[]): void {
  const white = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.92 });
  const iron = new THREE.MeshBasicMaterial({ map: ironTexture(), alphaTest: 0.5, side: THREE.DoubleSide });
  for (const [gx, gz] of gates) {
    // The gate posts stand on the wall ends either side of the gap.
    const nearby = walls
      .map(([x, z]) => ({ x, z, d: Math.hypot(x - gx, z - gz) }))
      .filter((w) => w.d < 2.2)
      .sort((a, b) => a.d - b.d);
    const first = nearby[0];
    const second = nearby.find((w) => first && (w.x - gx) * (first.x - gx) + (w.z - gz) * (first.z - gz) < 0);
    if (!first || !second) continue;
    for (const post of [first, second]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.1, 0.45), white);
      pier.position.set(post.x, 1.05, post.z);
      pier.castShadow = true;
      scene.add(pier);
    }
    // A black iron gate, standing open.
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.9), iron);
    const along = Math.atan2(second.z - first.z, second.x - first.x);
    leaf.position.set(first.x - Math.sin(along) * 0.5, 0.97, first.z + Math.cos(along) * 0.5);
    leaf.rotation.y = -along + Math.PI / 2;
    scene.add(leaf);
    const span = Math.hypot(second.x - first.x, second.z - first.z);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(span / 2, 0.2, 8, 16, Math.PI), white);
    arch.position.set((first.x + second.x) / 2, 2.0, (first.z + second.z) / 2);
    arch.rotation.y = -Math.atan2(second.z - first.z, second.x - first.x);
    arch.castShadow = true;
    scene.add(arch);
  }
}

/** What you see over the rooftops looking inland: tall pines, palms, blue mountains. */
function addBackdrop(scene: THREE.Scene, centre: { x: number; z: number }): void {
  const pines: SpritePlacement[] = [];
  const palms: SpritePlacement[] = [];
  for (let i = 0; i < 46; i++) {
    const a = -1.5 + (i / 45) * 3 + (hash(i, 3) - 0.5) * 0.05;
    const d = RADIUS + 22 + hash(i, 9) * 30;
    const spot = { x: centre.x + Math.sin(a) * d, z: centre.z - Math.cos(a) * d, scale: 0.8 + hash(i, 5) * 0.6 };
    (hash(i, 1) < 0.22 ? palms : pines).push(spot);
  }
  addSprites(scene, "pine", pines);
  addSprites(scene, "palm", palms);

  // Two ridgelines to the north, the far one paler.
  for (const [distance, height, colour, seed] of [[330, 62, "#8fa9c4", 1], [270, 40, "#6f8fae", 2]] as const) {
    const positions: number[] = [];
    const steps = 80;
    const ridge = (i: number) => {
      const t = i / steps;
      const peak = Math.sin(t * 9 + seed * 2) * 0.25 + Math.sin(t * 23 + seed) * 0.12 + Math.sin(t * 4.3 + seed * 5) * 0.35;
      return height * (0.55 + peak * 0.6);
    };
    for (let i = 0; i < steps; i++) {
      const a0 = -1.9 + (i / steps) * 3.8;
      const a1 = -1.9 + ((i + 1) / steps) * 3.8;
      const x0 = centre.x + Math.sin(a0) * distance;
      const z0 = centre.z - Math.cos(a0) * distance;
      const x1 = centre.x + Math.sin(a1) * distance;
      const z1 = centre.z - Math.cos(a1) * distance;
      positions.push(x0, -2, z0, x1, -2, z1, x1, ridge(i + 1), z1, x0, -2, z0, x1, ridge(i + 1), z1, x0, ridge(i), z0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: colour, fog: false, side: THREE.DoubleSide })));
  }
}

function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const keys = new Set<string>();
let overview = new URLSearchParams(location.search).get("view") === "overview";
let overviewPan=true, panDx=0, panDy=0;
let stick: { id: number; x: number; y: number } | null = null;

function readKeys(): void {
  if (stick) return;
  input.moveX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  input.moveZ = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  input.run = keys.has("ShiftLeft") || keys.has("ShiftRight");
}

function bindInput(): void {
  window.addEventListener("keydown", (e) => {
    if((e.target as HTMLElement).matches("input,textarea,select")||document.querySelector("dialog[open]"))return;
    keys.add(e.code);
    if (e.code === "Space") input.jump = true;
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  document.querySelector("#jump")!.addEventListener("pointerdown", () => (input.jump = true));
  const overviewButton = document.querySelector<HTMLButtonElement>("#overview")!;
  overviewButton.addEventListener("click", () => {
    overview = !overview;
    overviewButton.textContent = overview ? "Walk" : "Overview";
  });

  // Left half of a touch screen walks, anything else looks around.
  const looks = new Map<number, { x: number; y: number }>();
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    if (!overview && e.pointerType === "touch" && e.clientX < window.innerWidth / 2 && !stick) {
      stick = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else {
      looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (stick && e.pointerId === stick.id) {
      input.moveX = clamp((e.clientX - stick.x) / 50, -1, 1);
      input.moveZ = clamp(-(e.clientY - stick.y) / 50, -1, 1);
      return;
    }
    const prev = looks.get(e.pointerId);
    if (!prev) return;
    if (looks.size === 2) {
      // Two fingers: pinch to zoom.
      const other = [...looks.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if(before>5&&after>5) {
        input.zoom += Math.log(before/after)/.08;
        if(overview){const turn=Math.atan2(e.clientY-other.y,e.clientX-other.x)-Math.atan2(prev.y-other.y,prev.x-other.x);input.lookDx+=Math.atan2(Math.sin(turn),Math.cos(turn))/.0045;}
      }
      looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
      return;
    }
    if(overview && overviewPan && !e.shiftKey && !(e.buttons&2)) {panDx+=e.clientX-prev.x;panDy+=e.clientY-prev.y;}
    else {input.lookDx += e.clientX - prev.x;input.lookDy += e.clientY - prev.y;}
    looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const release = (e: PointerEvent) => {
    if (stick && e.pointerId === stick.id) {
      stick = null;
      input.moveX = 0;
      input.moveZ = 0;
    }
    looks.delete(e.pointerId);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  window.addEventListener("blur",()=>{keys.clear();looks.clear();stick=null;input.moveX=input.moveZ=0;});
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    input.zoom += clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1)/100,-4,4);
  }, { passive: false });
}
