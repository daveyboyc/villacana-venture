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
