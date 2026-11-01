# Photo-referenced graphics

This first visual pass compares IMG_2263 (Cervantes paving, plaster and clipped
planting), IMG_2237 (hedges, white walls and weathered paving), IMG_2239 (leaf and
trunk detail) and IMG_2204 (pool, Strelitzia, muted grass and flowering terraces).
It changes rendering materials, not the mapped buildings, routes or elevations.

`public/art/villacana-vegetation.png` is an **original AI-generated** transparent
2×2 atlas informed by those photos: feather palm, clipped hedge, bougainvillea
and Strelitzia. It is an illustrative botanical asset, not a cutout of an exact
plant in the photographs. `src/sprites.ts` reuses it across instanced crossed
cards, crops each cell with UV transforms and keeps the old procedural painters
as immediate/network-failure fallbacks. Other trees receive finer leaf strokes.
The cards receive lighting; existing dimensions and placements remain in use.
A narrow palm-only alpha-fringe filter removes isolated red matte artifacts.

`src/materials.ts` generates original repeating weathered terracotta, subtle
plaster grain and pool mosaic detail. Street paving and ground painting share
roughly 40 cm tile sizing and a muted pink/brown palette. Lawn colours are less
saturated, grass marks are finer and tufts smaller/sparser. Pool caustics are
quieter, with static mosaic tiles under a separate moving light pattern. No new runtime API or
external asset host is needed. The atlas is approximately 2 MB; only one image
request is shared by all four plant types.

The reference-based pool scenes and overview use these assets. This remains a
stylized prototype: crossed cards, generated frontages, the character and several
props are still simplified. These are material/sprite improvements rather than
photogrammetry or a claim of photographic reconstruction.

## Lighting, occlusion and the Blender facade kit (October 2026 pilot)

`src/look.ts` sets the scene's light and finish everywhere:
- **Sky light:** image-based lighting from a 1k CC0 sky, Poly Haven's *Kloofendal 48d
  Partly Cloudy (Pure Sky)*, stored as `public/art/sky-kloofendal-1k.hdr` (1.4 MB).
- **Tone mapping:** Khronos PBR Neutral. ACES was tried first and washed out the painted colours.
- **Shadows:** the sun's shadow box follows the point the camera looks at instead of covering the
  whole resort, so shadows are sharp at walking distance.
- **Ambient occlusion:** three's GTAO pass on desktop screens. It is off on small screens and under
  browser automation; `?ao=1` or `?ao=0` forces it on or off. Cut-out cards (plants, shutters, wire)
  and the far backdrop are left out of the pass so they do not darken as solid rectangles.

`scripts/build_kit.py` builds facade parts headless in Blender (`pip install bpy==5.2.3`)
from numbers read off IMG_2204–2206, and exports them to `public/models/` (242 kB in total):
- `shutter-door.glb`: arched brown louvred leaves in a white moulded surround.
- `iron-balcony.glb`: white slab and black railing with a row of rings.
- `wood-balcony.glb`: timber balustrade and posts under a barrel-tile lean-to.

The pip build of Blender has no Draco or meshopt compression, so the files are plain glTF; at
this size that costs little and needs no decoder. `src/facade-kit.ts` places the parts by
footprint data, first on the house walls facing the north pool (`docs/reviews/blender-kit-pilot`)
and now on every house wall long enough for an opening (`docs/reviews/facade-kit-resort`).
It is Details view only; the generic shutters skip the dressed walls. No collision, footprint or
ground changed.

- **Mobile:** on small screens (`max-width: 700px` or `max-height: 500px`) only the traced walls
  get the kit; the rest keep the flat shutters.
- **Draw calls:** the parts go up in 80 m cells, as one `LOD` each, so frustum culling skips
  houses out of view.
- **Distance:** beyond 120 m from a cell's middle, its doors and windows become one flat quad
  each in their own colour, and balconies drop out.
- **Shadows:** only balconies cast shadows.
- **Porches:** on walls where the porches (`addPorches`) hang a balcony, the generator adds the
  door onto it, not a second balcony.

Walls listed in `data/facade_kit.json` get the parts read from the north-pool photos through the
solved station camera, including two later parts: a rectangular shuttered window and a narrow
arched window (`docs/reviews/facade-kit-traced`). The other walls are generated, one opening
per 3.1 m as the flat shutters were.

## 3D plants (November 2026, north pool pilot step 2)

`scripts/build_plants.py` builds the Strelitzia, clipped hedge, flowering hedge, yucca and
feather palm headless in Blender (`pip install bpy==5.2.3`), seeded so a rebuild is
byte-identical, and exports them to `public/models/plants/` (about 0.9 MB). They are original
models of the species seen in the north-pool photos, sized to the cards in `SPRITE_SIZE`.
`addSprites` (`src/sprites.ts`) replaces those kinds' crossed cards with instanced copies once a
model loads, keeping each card's position, turn, scale, `spriteKind` and `spriteWidth`, so the
route-clearance guard and tests see the same footprints. Small screens keep the cards.

## Pool fittings and coping (November 2026, north pool pilot step 3)

`scripts/build_pool_kit.py` builds the stainless pool fittings headless in Blender the same
way (`public/models/pool/`, about 90 kB, byte-identical on rebuild): the goose-neck `ladder`
with three treads, the `step-rail` handrail at the end of a flight of steps, and the `life-ring`
on its hooked post. `addProps` (`src/slice.ts`) stands each prop through `addPoolFittings`
(`src/pool-kit.ts`): instanced, a simple stand-in until the model loads, on all screen sizes as
the models are small. Ladders stand on the nearest wall point when it is within a metre and face
into the pool; life rings face the nearest pool; straight steps get a handrail inside each end.
A ladder entry with `"fitting": "step-rail"` in `data/objects.json` draws the handrail instead.
Positions and the route-clearance filter are unchanged.

`src/water.ts` gives the coping slabs a bullnose: a plain face under a 3.5 cm quarter-round on
the edge over the water, keeping the joints and three tones. `poolSteps` lays straight treads
by default; a steps entry with `"steps": {"form": "curved", "length": ..., "wallAt": [x, z]}`
lays treads that follow the wall's curve, centred on the wall point nearest `wallAt` (the middle
pool's steps, IMG_2195).
