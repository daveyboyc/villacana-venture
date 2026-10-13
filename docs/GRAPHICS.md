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
