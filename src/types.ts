export type Vec2 = [number, number];

export type Road = {
  name: string;
  kind: string;
  width: number;
  points: Vec2[];
};

export type Door = {
  x: number;
  z: number;
  yaw: number;
  color: string;
};

export type Building = {
  name: string;
  kind: string;
  height: number;
  ring: Vec2[];
  inferred: boolean;
  face: number;
  width: number;
  depth: number;
  door: Door;
};

export type MapData = {
  attribution: string;
  origin: { lat: number; lon: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  ground?: { image: string; minX: number; maxX: number; minZ: number; maxZ: number };
  spawn: { x: number; z: number; yaw: number; street: string };
  coast: Vec2[];
  landRef: Vec2;
  beaches: { name: string; ring: Vec2[] }[];
  gardens: { kind: string; ring: Vec2[] }[];
  lawns: { name?: string; ring: Vec2[] }[];
  pitches: { sport: string; ring: Vec2[] }[];
  roads: Road[];
  buildings: Building[];
  pools: { ring: Vec2[]; kind?: string; name?: string }[];
  palms: { x: number; z: number; s: number }[];
  meta: {
    osmBuildings: number;
    typicalHomes: number;
    pools: number;
    palms: number;
    roads: number;
  };
};

export type AlbumEntry = {
  id: string;
  title: string;
  lat: number;
  lon: number;
  image: string | null;
  suggest?: string;
  caption: string;
  credit?: string;
  source?: string;
};

export type InputState = {
  moveX: number;
  moveZ: number;
  run: boolean;
  jump: boolean;
  lookDx: number;
  lookDy: number;
  zoom: number;
  interact: boolean;
};

export type SkeletonBuilding = {
  id: string;
  /** Floors above ground. 0 is a yard or terrace, not a house. */
  floors: number;
  ring: Vec2[];
  holes?: Vec2[][];
};

export type SkeletonPool = {
  id: string;
  kind: "small" | "main" | "toddler";
  ring: Vec2[];
};

export type Seafront = {
  viewBounds: Vec2[];
  paseo: { name: string; width: number; points: Vec2[]; trust: string };
  beach: { name: string; ring: Vec2[]; trust: string };
  sea: { name: string; ring: Vec2[]; trust: string };
  coast: Vec2[];
  restaurant: { name: string; buildingId: string; ring: Vec2[]; terrace: Vec2[]; trust: string };
  sources: { title: string; url: string }[];
};

export type Skeleton = {
  seafront?: Seafront;
  origin: { lat: number; lon: number };
  /** Degrees that turn the block square on screen, sea at the bottom. */
  viewRotation: number;
  floorHeight: number;
  area: Vec2[];
  buildings: SkeletonBuilding[];
  pools: SkeletonPool[];
  /** Lanes and roads. Those the registry names but nobody has placed have no points. */
  streets: { name: string; width?: number; points?: Vec2[]; registryPlots?: Vec2[]; trust: string }[];
  /** Traced open ground such as the car park. */
  areas: { kind: string; name: string; ring: Vec2[]; trust: string }[];
  /** Rows of parking bays; `nose` is the compass side the cars point to, in the turned view. */
  parkingRows: { points: Vec2[]; nose: string }[];
  kerbs: Vec2[][];
  /** Things placed by hand: a kind and a position, drawn however the game chooses. */
  props: MapObject[];
  /** Centres of low garden-wall blocks, about half a metre apart. */
  gardenWalls: Vec2[];
  /** Middles of the gateways through those walls. */
  gardenGates: Vec2[];
  cover: { image: string; minX: number; maxX: number; minZ: number; maxZ: number; classes: Record<string, string> };
};

/** A hand-placed thing on the map. `evidence` says what it is based on: a photo, the aerial, or Dave. */
export type MapObject = { id: string; kind: string; x: number; z: number; evidence?: string; note?: string };
