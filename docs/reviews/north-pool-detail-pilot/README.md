# North pool detail pilot (task `north-pool-detail-pilot`)

Dave, 31 October 2026: start with one well-mapped, well-photographed area and take
it as far as it will go. The north pool has the most references, three solved
cameras (IMG_2204-2206), laser-survey levels and the Blender facade-kit pilot.

## Baseline (before)

`IMG_2204-before.png` to `IMG_2208-before.png`, rendered with Details on through
each photo's camera (`scripts/shoot_views.cjs IMG_2204 ... --pose --details
--task=north-pool-detail-pilot --as=before`), after the `pool-detail` work.
IMG_2207 and IMG_2208 are not solved yet and render from their starting poses,
which look far past the roof tiles in the photos; solving them is part of the pilot.

What the baseline shows against the photos:
- Plaster walls are flat white with no weathering; roofs and parapets are plain.
- Barrel roof tiles in the foreground of IMG_2205-2208 are flat orange slabs.
- Planting is painted cards: the Strelitzia clumps read, but the clipped hedges,
  bougainvillea and the yucca/dracaena by the east wall are much less detailed.
- The crazy-paving path round the lawn and the terracotta patios are plain fills.
- The lawn is a flat even green; the photos show worn patches and edging.
- The distant backdrop is a painted band; the photos show trees and mountains.

## Increments

1. Photo-matched surfaces: plaster, crazy paving, terracotta, barrel roof tiles.
2. 3D planting where the photos show it.
3. Pool details built in Blender, with the deck outline (`pool-deck-outline`).
4. Google satellite and photorealistic 3D tiles as further comparison views,
   credited "Imagery © Google".

Each increment replaces the `-after` renders through the same cameras.

## Step 1: photo-matched surfaces (31 October 2026)

`IMG_2204-after.png` to `IMG_2208-after.png`. Four CC0 Poly Haven textures,
recoloured to the photos and scaled to true size (`public/textures/CREDITS.md`,
about 790 kB together), replace the generated ones resort-wide:

- **Plaster:** every house wall and white wall that uses the shared plaster gets a
  2 m plaster texture with a normal map; still near-white, tinted by the wall colour.
- **Terracotta:** the shared paving texture is now 0.4 m terracotta tiles (8 to a
  3.2 m image) on patios, terraces, steps and roof terraces, and the ground draws
  them at full resolution on paved lanes. Local designs (Silvia, Elena, seaward
  paving) are masked out and keep their own patterns.
- **Crazy paving:** the ground's path class, including the path round the north-pool
  lawn, gets a full-resolution crazy-paving texture.
- **Barrel tiles:** porch roofs and the north-west canopies get the photo barrel
  tiles; the Blender facade kit's tiled balcony roofs are rebuilt
  (`scripts/build_kit.py`) in the same weathered colour (#a07c68) instead of bright orange.

Against the photos: tiled roofs and canopies now read as weathered barrel tiles,
the lawn path as crazy paving and the patios as tiled. Still different: the roof
the photographer stands on in IMG_2205-2208 is flat in the model (a roof-form
question, not a surface); walls lack the photos' weathering and parapet copings;
planting and the backdrop are unchanged (step 2 and later).
