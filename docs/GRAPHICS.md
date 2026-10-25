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
from numbers read off IMG_2204–2206, and exports them to `public/models/` (183 kB in total):
- `shutter-door.glb`: arched brown louvred leaves in a white moulded surround.
- `iron-balcony.glb`: white slab and black railing with a row of rings.
- `wood-balcony.glb`: timber balustrade and posts under a barrel-tile lean-to.

The pip build of Blender has no Draco or meshopt compression, so the files are plain glTF; at
this size that costs little and needs no decoder. `src/facade-kit.ts` places the parts by
footprint data on the house walls facing the north pool (Details view only). The generic
shutters skip those walls. Opening spacing and which walls get a wooden balcony are generated,
not traced from photos. No collision, footprint or ground changed. Before and after views
through the solved photo cameras are in `docs/reviews/blender-kit-pilot`.
