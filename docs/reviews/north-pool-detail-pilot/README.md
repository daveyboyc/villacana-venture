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

## Step 2: 3D planting (1 November 2026)

The `-after` renders now include step 2. `scripts/build_plants.py` builds five plants
headless in Blender, seeded so a rebuild is byte-identical, each at the size of the
painted card it replaces (`public/models/plants/`, about 0.9 MB together):

- **Strelitzia** (`strelitzia.glb`, 1,146 faces): seven grey stems carrying fans of
  broad paddle leaves on stalks, some torn into strips, as beside the pool in
  IMG_2204 and IMG_2206.
- **Clipped hedge** (`hedge.glb`, 1,100 faces): a boxy rounded mound slightly wider
  than the card, so neighbours along a wall join into a continuous hedge, covered in
  900 small leaves in three greens over a dark shell.
- **Flowering hedge** (`hibiscus-hedge.glb`, 1,210 faces): the same with 22 red
  five-petalled hibiscus flowers, as in the hedge in front of the camera in IMG_2204.
- **Yucca** (`yucca.glb`, 3,470 faces): five leaning trunks, each ending in a spiky
  rosette over a skirt of dead leaves (the yucca by the east wall in IMG_2205).
- **Feather palm** (`palm.glb`, 5,578 faces): a diamond-scarred trunk under a dense
  dome of 44 arching fronds.

`src/sprites.ts` swaps each kind's cards for instanced copies of its model once
loaded, at the same positions, turns and scales; small screens keep the cards, as
they keep the flat shutters. Bougainvillea, trees and grass stay as cards.

Against the photos: the hedges now read as continuous clipped hedges with depth,
the flowering one with red flowers, and the Strelitzia clumps as clumps of paddle
leaves. Still different: the photo hedges are darker and more finely textured; the
large tree and bougainvillea are still cards; the yucca and Strelitzia are original
models of the species, not traced from the actual plants.

## Step 3: pool details (1 November 2026)

The `-after` renders now include step 3. Compared first against IMG_2204-2206 (north pool),
IMG_2195 (middle pool close-up) and the two south-pool web photos:

- **Ladders, step handrails and life rings built in Blender** (`scripts/build_pool_kit.py`,
  `public/models/pool/`, about 90 kB together, byte-identical on rebuild). The ladder is two
  goose-neck stainless rails anchored on the deck half a metre back, arching over the coping and
  down into the water with three treads, as on the north pool's deck tongue (IMG_2204). The step
  handrail is a post with an upper and lower bar sloping down over the treads (IMG_2204 north
  steps, IMG_2195). The life ring hangs from the hook of a steel post, with four white bands and
  a grab line (IMG_2204, IMG_2195, south-pool-02). `src/pool-kit.ts` instances them at the same
  props: ladders on the nearest wall point (all within 0.4 m, except two main-pool ladders over
  2 m off, which stay at their markers) facing into the pool; rings facing the nearest pool.
- **Handrails at straight steps:** one just inside each end of the north and south steps, as in
  IMG_2204 and south-pool-01. The north and south steps stay straight, as photographed.
- **Bullnose coping:** each slab's edge over the water is now a 3.5 cm quarter-round over a
  plain face, as in IMG_2195 and IMG_2204; joints and the three tones are unchanged.
- **Curved middle-pool steps:** IMG_2195 shows three treads curving round the inside of a lobe
  end, with the double handrail at their west end. Steps can now be laid along the wall's curve
  (`"steps": {"form": "curved"}` on the entry in `data/objects.json`). The middle pool's steps
  (`o26`) are curved, 3.4 m along the wall, centred on the wall by the `wallAt` point
  (-123.45, 87.74): from beside `o27` round into the north-east lobe end, read by eye from
  IMG_2195. The `o26` marker itself, 2 m out in the water, is unchanged; centred on its nearest
  wall the flight overlapped `o27` and ran straight. `o27` is drawn as the step handrail it is in
  the photo (`"fitting": "step-rail"`), not a ladder.

Middle and south pools were compared through hand-placed cameras only (IMG_2195 and the web
photos are not solved), so the curved steps' place is a reading by eye, not a measurement.

Still different from the photos: the rails are thinner and duller from the high north cameras
than the bright stainless in IMG_2204, and the step handrails' posts are shorter; the glass pool
fence, the shower posts and the waterline tile pattern are not built; the north pool deck is wider
and stair-stepped and lacks the squared tongue east of the steps (`pool-deck-outline`, below).

### Deck outline (`pool-deck-outline`): left open

Looking through the solved IMG_2204-2206 cameras, the photographed deck is a band about
1.5-2 m wide with a straight-edged tongue reaching into the water east of the steps, where the
pump box stands; the model's deck, from the 0.25 m cover classes, is wider round the east and
south and stair-stepped at its outer edge. Two findings stop a proper trace in this step:
- the squared tongue is an edge of the *water*, not only of the deck: in IMG_2204-2206 the pool
  wall itself turns square round it, while the registry water ring is a smooth curve there, so
  matching the photo means moving the ring, which needs measured evidence and placement approval
  (docs/PLACEMENT_VERIFICATION.md) that this step did not have;
- the deck's outer edge is hidden behind the frosted bands of the glass fence along most of its
  length in all three photos, so edge points would have to be picked between fence panels and
  posts, and no deck-edge residuals were measured.
A follow-up should pick deck-edge and tongue points in IMG_2204-2206 between the fence panels,
solve them with `scripts/photo_pose.py` against the aerial, and record residuals before any
outline or ring change.

## Step 4: the deck band round the small pools (1 November 2026)

Dave, after looking at the live site: "The border around the pool is wrong." The pale stone deck
round the north, middle and south pools came from the 0.25 m ground cover, stamped as a 2.4 m band
round each pool's *convex hull*: an irregular, stair-stepped blob, far too wide round the lobes. In
the photos it is a band following the pool, with a crisp curved outer edge where the glass fence
stands (the fence is still not modelled).

**Measured, not guessed** (`scripts/measure_pool_decks.py`, data in `data/pool_decks.json`):
- *North pool, through the solved IMG_2204 camera:* 38 pixels picked on the deck's outer edge
  (where the paler edging stone meets the lawn, just outside the fence spigots) are cast onto the
  deck level (0.82 m, `data/terrain.json`). They give widths from the water ring of 1.1-1.3 m
  south-west, 1.6-1.8 m south, 2.3-2.9 m north (by the steps) and up to 3.4 m east, where the
  pump box stands on the squared tongue. `deck-IMG_2204-north.jpg` shows the picks (magenta), the
  fitted edge (yellow) and uniform bands of 1.2, 1.5, 1.8 and 2.2 m projected through the same
  camera: none of the uniform widths follows the edge (best 0.67 m rms), so the width varies
  with bearing.
- *All three pools, on the aerial:* the Esri image is registered to each pool by sliding its blue
  water onto the registry water ring (shifts of 0.8-1.4 m; water overlap 0.76-0.82), then the
  pale deck's edge is found along rays every 3° (`deck-aerial-*.jpg`). Under the tree canopy
  south-south-west of the middle pool the deck is hidden; those bearings are skipped.
- *Fit:* the band is the ground within a width of the ring, the width set at 12 compass bearings
  (linear between), softened with a 1 m Gaussian (1.5 m at the south pool) so the outer edge is a
  clean curve over the bays between lobes.

| Pool | Fitted on | Fit rms (worst) | Held-out check rms | Widths (m) | Best uniform width, rms |
| --- | --- | --- | --- | --- | --- |
| North | 38 IMG_2204 picks | 0.15 m (0.48) | aerial, 0.36 m (74/80 within 1 m) | 1.3-2.8 | 1.8-2.2 m, 0.67 m |
| Middle | 29 aerial points | 0.26 m | other 28 aerial points, 0.31 m | 1.3-2.0 | 1.8 m, 0.72 m |
| South | 55 aerial points | 0.20 m | other 54 aerial points, 0.21 m | 1.8-2.5 | 2.2 m, 0.36 m |

**Built:** `scripts/build_skeleton.py` writes each deck's outline (`pools[].deck` in skeleton.json,
via `scripts/pool_deck.py`) and draws that band into the cover classes instead of the hull band, so
lawn runs up to it. The scene (`src/pool-deck.ts`) lays it as a slab deck 3 cm above the lawn with
rounded paler edging stones along the outer edge, as at the foot of the fence in IMG_2204; the
ground's own painted deck stops just inside it, so no pale fringe shows. The 2D map draws the same
outline. Grass tufts keep off the deck. Walking heights are unchanged (3 cm). The main and toddler
pools keep their surroundings: their web photos show a broad apron, not this problem.

`deck-before-after.jpg`: photo, step 3 and step 4 through IMG_2204-2206 (solved cameras), IMG_2195
and a hand-placed south-pool camera (its web photo stays in the private reference repo).

Still different: the squared deck tongue east of the north steps is also an edge of the *water*
(the pool wall turns square round it), which the registry ring does not follow, so it can only be
built by moving the ring with placement approval; the deck in the photos is a slightly greyer cream
with wider joints; the glass fence is not built. Middle and south widths come from the 0.24 m
aerial only. No placement packet: approval needs an independent reviewer, so the decks remain
unapproved placements (`pool-deck-outline` stays open for the tongue).

## Step 5: trees and mountains in the background (1 November 2026)

Dave: "We are still lacking the trees and plants that you can see in the background in the
photos." Over the roofs, IMG_2204-2206 show a dense skyline of trees: flat-topped umbrella pines,
palms, Norfolk Island pines (one tall and sparse right of centre in IMG_2205, others in IMG_2204
and IMG_2206), a belt of tall eucalyptus-like trees over the west wall (IMG_2206, running off the
top of the frame), with the mountains and the peaked summit behind. Inside the courtyard, a
spreading fine-leaved tree leans over the north-west terrace (left of IMG_2204) and a feathery
tree and a pollarded stump stand by the path (right). The model had a ring of 46 painted pine and
palm cards and two sine-wave bands of flat blue, which read as sea.

**Trees built in Blender** (`scripts/build_trees.py`, `public/models/trees/`, 732 kB together,
byte-identical on rebuild): umbrella pine, Norfolk Island pine, eucalyptus, rounded broadleaf,
spreading tree, pollarded tree, each with lumpy crown clumps carrying leaf or needle cards,
plus light `-far` versions (47-578 faces: a few clumps, no cards) for the distance, and a simple
distant palm. `src/sprites.ts` swaps them in for the cards as for the plants: `tree`,
`feathery_tree` and `pollarded_tree` now draw as 3D trees, and three new kinds (`umbrella_pine`,
`norfolk_pine`, `eucalyptus`) have cards for small screens, which keep the cards. Far trees use
the light models, unshadowed, a little paler instead of fogged.

**Where they stand** (`scripts/build_backdrop.py`, `data/backdrop.json`, `src/backdrop.ts`):
- *Picked in the photos:* three Norfolk pines and five palms, each on the ray through its top
  pixel from the solved station, at the distance where a tree of its usual height reaches that
  pixel (Norfolk pines 117-191 m out, palms 50-60 m). Direction is measured; distance is not.
- *From the aerial:* 814 trees where the Esri aerial shows dark canopy outside the resort block and
  inland of the beach, spaced by crown size. The aerial does not show species: they are drawn
  from the mix in the photos, with tall eucalyptus in the belt beside the west wall. In the
  photographed bearings no tree may stand above the line the photos show against the sky: trees
  are lowered to it or, if hidden by the roofs anyway, left out.
- *Beyond the aerial:* 323 trees in groves on the land side, 230-650 m out, thinning with
  distance (filled in, not seen).
- The scattered garden trees from the ground cover now stay inside the resort block; outside it
  the backdrop has the trees.

**Mountains:** the line between sky and mountain is found column by column in IMG_2204-2206, only
in the stretches where mountains (not trees, roofs or cloud) meet the sky, and turned into compass
bearing and elevation through the solved camera (57 bearings from the photos, 296°-22°,
interpolated where trees hide it). It is built as one band 2.2 km from the station, hazy blue-grey
at the crest, with the peak at about 356-358° (5.7°). Past the photographed bearings it falls away
to low hills (inferred). Seen from the middle and south pools the bearings are a few degrees off.

**Cost in the whole-resort Details view (1280×800):** 3.42 M → 4.06 M triangles (+0.63 M,
+19%): broadleaf +0.32 M, umbrella pines +0.11 M, eucalyptus +0.12 M, distant palms +0.07 M,
other trees under 0.01 M. That is 1,145 backdrop trees, about 130 garden trees inside the block
and the courtyard trees, in about 30 more instanced meshes. Trees within 85 m of a shown pool get
the detailed models; palms in the backdrop always the light one (the detailed palm is 11,000
triangles). Small screens keep the cards.

`trees-before-after.jpg`: photo, step 4 and step 5 through IMG_2204-2206, IMG_2195 and the
hand-placed south camera.

Still different: the trees are generic models of the species, smoother and greener than the
photos' dark, ragged masses, and only the picked Norfolk pines and palms stand where a photo shows
a particular tree; the aerial trees' species and heights are guesses (capped by the skyline). The
ridge is a single flat-coloured band without the nearer, greener foothills, the summit is softer
than in the photos, and the clouds sitting on the mountains are not modelled. The spreading tree
on the north-west terrace is located (about -193.0, 20.8, through IMG_2204) but not built: its
crown would overhang the protected walk across the terrace, which the route-clearance guard keeps
clear (`gap:north-pool-west-terrace-tree`). The pollarded stump right of IMG_2204 is bare in the
photo; the model is in leaf. Bougainvillea stays a painted card: a 3D climber was not attempted in
this step.
