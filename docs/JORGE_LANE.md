# Calle Jorge

`data/jorge_lane.json`, drawn by `src/jorge-lane.ts`. Built on 9 and 10 November 2026 (PRs #193-196),
reviewed on 10 November (task `jorge-lane-review`), given its surroundings on 11 November
(task `jorge-lane-surroundings`), and its other benches the same day (task `jorge-more-benches`).

## What the photos show

The east-end photos were taken between 101 and 130 m along the 136 m mapped centreline; IMG_2234
looks about 15 m further west. The west entrance has its own photos (IMG_2280, IMG_2696-2698).

| Photo | Shows |
| --- | --- |
| IMG_2182, IMG_2229, IMG_2230 | Looking west along the lane: four square terracotta tiles across with a pale edge; lawn to the house fronts on the south side with one white azulejo bench, two-tile cross-paths and a kerbed bed; on the north side white planters with clipped hedges, brick thresholds into the patios and small recesses with blue number tiles, then a kerbed lawn with a dragon tree |
| IMG_2231, IMG_2232, IMG_2596 | The bench up close; house number 20; a flush SANEA cover and a square grate in the tiles |
| IMG_2234 | The CALLE DE TEODORO plaque under a bougainvillea, a tall hedge and lantana in front of it, a green cover in the grass; slot drains across the path where an octagon-tiled lane joins; a black lamp post on the corner of a white-kerbed lawn; a planter with a hedge beyond |
| IMG_2235 | That octagon-tiled lane, with the kerbed lawn on its east side |
| IMG_2183, IMG_2233 | The candelabra tree on the garden lawn, which is open to the lane: pale trunks, stems leaning out and then up, a lantana bed at its foot, a bougainvillea on the wall behind |
| IMG_2597 | The CALLE DE JORGE plinth and lamp at the east end, the lettered face turned towards the path, on a lawn with an old olive |

## The review (10 November)

**What was not photographed.** The first build repeated things the photos don't show:

- six copies of the one photographed bench, every 16 m;
- grass, a hedge wall and sphere shrubs along 120 m of lane.

These were removed. The path, grass, planter wall, hedge and planting are now built only from
about 86 m to the east end. The rest of the lane keeps the generic ribbon, recorded as
`gap:jorge-west` with photo request `jorge-west-walk`.

**What looked unlike the photos:**

- **Planter wall:** it was 3.15 m green boxes with gaps. It is now a continuous white planter
  wall, 0.55 m high, built in runs stopped at the houses, with a leafy clipped hedge on top in
  Details (`src/clipped-plants.ts`).
- **Covers:** they stood 7 cm proud of the tiles. They are now flush.
- **Grass:** the texture was stretched into stripes along the lane. It is now laid in metres,
  in a calmer green.
- **Shrubs:** spheres became leafy round shrubs. The yucca is now the resort's 3D yucca, set
  behind the wall where IMG_2230 shows it.
- **Cactus:** a column of thin sticks became a two-trunk candelabra with leaning-then-upright
  stems, with a round shrub at its foot. It was then rebuilt again; see below.
- **Plinth:** it faced about 60° away from the photo. It now faces the path.

**Layout and Details.** Planting now appears only with Details on, and every plant passes the
route guard. The bench, plinth, lamps, plaques, covers and walls are photo-backed fittings and
show in Layout too.

## The candelabra tree (task `jorge-cactus-smooth`)

The first two versions were built from straight cylinders and looked clunky. The tree is now
`src/candelabra-cactus.ts`, following IMG_2183 and IMG_2233:

- four pale woody trunks rising close together and leaning apart;
- arms that sweep outward and curve up into a broad domed crown;
- each stem a single smooth tube along a curve, with four wings, scalloped wing edges, growth
  constrictions and a rounded tip;
- grey-green colouring, darker in the grooves and paler on the wing edges, greying to bark on
  the old wood;
- a bed of lantana and a lighter shrub at its foot, on the lane side.

It is one mesh of about 130 stems (65,000 vertices), shown only with Details on. It stands 5 m
behind the lane, in the open garden the registry leaves there, so its whole crown clears the
walking line. That distance, its 5.6 m height and 4.2 m spread are estimates: the photos show it
about twice the height of the garden wall behind it, but no camera is solved.

## The surroundings (11 November, task `jorge-lane-surroundings`)

The first builds dressed only a strip either side of the path. The photos show more, and one thing
the model had wrong: a hedge wall ran in front of the garden with the candelabra tree, which
IMG_2183, IMG_2233 and IMG_2234 show open to the lane.

**South (lawn) side**

- Lawn from the path to the house fronts, from about 95 to 127 m (the aerial agrees).
- A two-tile cross-path leaving the lane about 1.9 m east of the bench (IMG_2182, IMG_2229: read
  from the tile rows and the horizon in both).
- A second path leaving the lane about 4 m west of the bench, running behind it and along the
  house front (IMG_2229, IMG_2231).
- A white-kerbed bed with three round clipped shrubs and a strelitzia, a climber on the wall
  behind it and a bougainvillea by door 23 (IMG_2229); a smaller kerbed shrub on the lawn west
  of the bench.
- At the CALLE DE TEODORO wall: a tall clipped hedge on the lawn, yellow lantana behind it, a
  bougainvillea over the plaque, and a green round cover in the grass (IMG_2234).

**North (hedge) side, west to east**

- A planter with a hedge at the path edge up to the octagon-tiled lane (IMG_2234).
- Slot drains and a square grate across the path at that junction.
- The garden: an open lawn with a white-painted kerb along the lane and back along the
  octagon-tiled lane, one lamp post on the kerb corner, the dragon tree near the lane, the
  candelabra tree towards the back and a bougainvillea on the back wall.
- Planters in front of the patios: 0.7 m above the path, a clipped hedge in each, two brick
  thresholds 1.1 m wide with a short planter between, and a recess with a blue-and-white tile by
  each threshold. The digits are not legible, so none are drawn.
- Lawn and the old olive beside the CALLE DE JORGE plinth (IMG_2597).

**Removed:** the lamp posts at 88, 92 and 118 m. IMG_2234 looks along that stretch and shows wall
lanterns, not posts; the only post in the photos is the one on the kerb corner. The two round
shrubs that stood alone on the lawn went too; the photos show shrubs only in the beds.

Lawns, paths, kerbs, planters, thresholds, niches, covers and the lamp show in Layout. Hedges,
shrubs, climbers and trees show with Details on, behind the route guard.

## The other benches (11 November, task `jorge-more-benches`)

Dave: there is more than one bench on Calle Jorge. Only one is photographed, so the others are
placed from the aerial (Esri World Imagery, 0.24 m a pixel), which shows white marks the size of
the bench, with a shadow, on the grass 1.6 to 1.9 m off the path:

| Along the lane | Side | Built as |
| --- | --- | --- |
| 64.3 m | north | bench, inferred |
| 79.2 m | north | bench, inferred |
| 106.5 m | south | the small white-kerbed shrub bed (IMG_2229 and IMG_2230 look along this lawn and show a bed, not a second bench) |
| 122.3 m | south | bench, inferred |

The marked crops are in `docs/reviews/jorge-benches-aerial/`. The three benches reuse the
photographed bench and face the path; they show orange (inferred) on the Sure / unsure overlay.

Open: the aerial shows nothing at 112 m, where the photo pins put the photographed bench. That
bench may really be the 106.5 m mark, with the pins about 5 m too far east. No camera is solved,
so it stays at 112 m; photo request `jorge-benches` asks for a photo of each bench.

A second agent that did not make the change checked it on 11 November: the lane check, type-check,
reference check and build pass, the four bench spots are clear of houses, paths and thresholds, and
each faces the path. Reading the aerial crops itself, it found the 79.2 m and 122.3 m marks clear,
the 64.3 m mark fainter, and agreed that the 106.5 m mark looks like the bench marks while nothing
shows at 112 m. That is the open question above; it is not placement approval.

## The west entrance and the east planter (11 November, task `jorge-west-entrance`)

Earlier notes said nothing west of 86 m was photographed. That was wrong for the lane's west end:
IMG_2280 and IMG_2696-2698 stand in the Pintor Dalí car park on the mapped Calle Jorge line and
look along it. Built from them (`west` in the data), from 0.3 to 28 m:

- a path of sandstone flags about 2 m wide (the resort's crazy-paving surface), not terracotta;
- two white-painted kerbs the length of the parking bays, each with a short return at its end;
- a lamp post at the end of the north kerb (the camera on it is not modelled);
- lawn both sides, 9 m deep on the north and a narrow strip on the south, as the aerial shows;
- two round clipped trees on the north lawn (Details);
- a border of clipped and yellow-flowering shrubs and a bougainvillea along the house on the
  south side (Details).

The white gateway at the far end (about 28 m, where the aerial shows a white mark on the line) is
too small in the photos to build, and what the path is made of beyond it is not known. Jump to it
in Inspect with **Calle Jorge · west entrance**.

At the east end, IMG_2773 looks up Calle Guillermo from the junction and shows a white planter wall
full of lantana along its east side; IMG_2597 shows the same wall behind the plinth lawn. It is
built at the edge of the mapped Guillermo line (`guillermoPlanter`); its height and length were
corrected on 12 November, see below.

IMG_2594 looks up the lane from the south towards the junction and shows the dragon tree right
beside the lamp post on the kerb corner, so the tree moved 1.4 m west to stand there.

## The planter height and the palms (12 November, task `jorge-planter-palms`)

Dave: the Guillermo planter was too high and should be neater, about one metre; the palm was
inaccurate. Checked against IMG_2773, IMG_2774, IMG_2764, IMG_2765, IMG_2230 and IMG_2594:

- **Planter:** one straight wall, 0.45 m thick, its top one metre above the lane beside it, 22 m
  long. Its heights come from the lane surface (it is not draped), because the ground under it is
  the bank down to the main pool. A low dense carpet of lantana lies along the top and a clump of
  yucca heads rises behind it, as the photos show.
- **Palms:** the short, thick generic palm that stood against the planter is removed (the photos
  show none there), and so is the one 5 m in front of the IMG_2764 camera, where the photos show
  open lawn. One tall slender palm (`src/spiky-trees.ts`, 15 m) stands on the main-pool lawn where
  IMG_2764 and IMG_2765 show the nearest one.
- **Dragon tree:** the tree on the kerb corner beside the lamp post is now a dragon tree with a
  stout trunk and a dense head of sword leaves (IMG_2230, IMG_2594), not the yucca stand-in.

A second agent that did not make the change checked it: the lane check, map check, type-check,
reference check and build pass, the two removed palms are gone from the object list and the map,
and the records agree with the data. Comparing renders with photos itself, it found the planter
straight, neat and about waist high with no palm beside it, and asked for a stouter palm trunk,
a fuller crown and a darker, denser dragon tree, which were then made. Still off: the lantana is
thinner than the real carpet, and the model's wall stands a grass strip back from the lane where
the photo's rises straight from the paving. That is not placement approval.

Not done: the planter's continuation south of the junction towards the sea (IMG_2822, IMG_2823),
the second, farther palm, and the other generic palms round the main pool.

## Calle Guillermo paving (12 November, task `jorge-guillermo-paving`)

IMG_2773 and IMG_2774 show the lane beside the planter paved wall to wall: large terracotta squares
at the Jorge junction, then octagons with small square insets, a round cover and two grates. That
is now laid 2.3 m wide (squares 0.56 m, octagons 0.4 m, as their ratio in the photo) against the planter's lane face (`guillermoPaving`), level across at the
lane's surveyed height, with the planter's top one metre above it. It replaces a grass strip and
the narrow generic ribbon, which broke into tilted pieces over the bank to the pool.

A second agent measured this change: the wall-to-tile ratio agrees between photo and render, the
squares were too small against the octagons and the surface bowed. The squares were enlarged, the
surface straightened and the grates made grey afterwards; those fixes were re-rendered but not
re-validated. Open (Dave): the houses left of the lane do not match the photo, task
`guillermo-west-walls`.

## West of Calle Guillermo: garden walls, not house fronts (12 November, task `guillermo-west-walls`)

Dave: from the IMG_2773 viewpoint the houses on the left do not match the photo. The photo has a
plain garden wall and hedged planters with the houses standing back; the model drew registry
blocks as houses with generic doors, shutters and porches at the lane, and open plaza where the
registry is empty. Built from IMG_2773 and IMG_2774 (`guillermoWest`):

- The wall along the north side of the plinth lawn is plain, with no door, window or porch. (A
  `plainWalls` list, read by the shutters, the porches and the facade kit, can keep generic openings
  off any registry wall a photo shows plain; it is empty now that this wall is a garden wall.)
- It runs on to the lane with a falling top, ending in a pier with a no-dogs sign near its top.
- Along the lane: white planters with clipped hedges between piers, two gateways, a taller patio
  wall behind with strelitzia above it, two lamp posts, and a brick-on-edge border.
- The lawn now reaches the wall foot, with a small tree and a rose (Details).

**The patio behind the wall (Dave's decision, 12 November).** Plants show above the lawn wall in
the photo and the aerial shows a pale court there, so the east portion of registry part
`6364401UF1366S_part7` is now an open walled patio and only its west block stays a house
(`data/registry_corrections.json`, `openPatios`; the registry ring is kept beside it in the map
data). Dave agreed to this on the photo evidence, without the measured check the rules normally
ask for. The lawn wall is therefore one wall from the west block's corner to the lane, falling
from 3.9 m to 2.6 m, and the patio's other sides are walled at 2.1 m on the registry lines.
Where the roofed part really ends is not seen in any photo.

A second agent checked the correction: the map rebuilds from the registry source unchanged, the
roofed part and the patio add up to the registry ring (42.9 + 42.2 = 85.1 m2) without overlap,
and no other building changed. It found the fall of the wall still reads shallower from the photo's
viewpoint than in the photo (far-left to lane-end height about 1.1 against 1.5), and that a
post-validation tweak had dropped lane hedges below the browser test's count; the hedges now
check their own narrow footprint against the route guard. Known side effect: the path-network
outline for this part now follows the roofed part only.

Not done:

- The houses further up the lane keep generic fronts; the gateways have no gates.

A second agent inventoried and measured both views: the first build's wall end was about 0.7 m too
low and its sign too low, the climber read as a solid hedge, and the planters and hedges were a
little low. Those were corrected afterwards (re-rendered, not re-validated). It also noted the
generic door, balcony and shutter on the two-storey block behind the wall, which remain.

The task stays in progress until Dave says the view is fine. The `plainWalls` list is the general
tool: wherever a photo shows a garden wall where the model draws a house front, add the wall there.

## Planting and lawns (13 November, task `jorge-planting`)

From IMG_2229, IMG_2230, IMG_2697 and IMG_2773 (`planting` in the data), all Details:

- Bougainvilleas are masses of purple bract, not green climbers: the wall climbers now carry
  clusters of bracts (`wallClimber` in `src/clipped-plants.ts`). This changes the ones on the
  house-23 front, over the CALLE DE TEODORO plaque, on the cactus-garden wall and on the south
  house at the west entrance, which is now covered to first-floor height.
- A tall bougainvillea at the house-23 corner and a small grey-green tree beside the bed.
- A light-green broad-leaved tree on the plinth lawn, replacing the dark generic tree.
- Bougainvillea spilling over the top of the lawn wall.
- A row of low clipped shrubs along the north edge of the flagged west path.
- The lawns are a darker, duller green.

The house-23 group is checked in the Inspect view only (`docs/reviews/jorge-planting/`): no photo
camera on record faces it.

## How these builds were checked, and what that is worth

- Each change is rendered from the photo's position and compared with the photo by eye, by the
  agent that made it and then by a second agent. "Matches" in `data/photo_checks.json` is that
  judgement; no camera on this lane is solved, so nothing lines up pixel for pixel and no size is
  measured by the render.
- That let the planter through at the wrong height until Dave corrected it. Where a size matters,
  measure it in the photo against something of known size and write the figure in the check. For
  the planter: in IMG_2773 the wall is 2.5 tile-widths high at the same depth, so 0.9 m with
  0.36 m tiles or 1.25 m with 0.5 m tiles. A second agent measured 2.3 to 2.9 in the photo and
  2.3 to 2.8 in the render. The tile size there is not known, so the photo allows roughly 0.85 to
  1.2 m: one metre is plausible, and the measurement does not say whether it is high or low.
- Solving the IMG_2773 camera (`docs/PHOTO_ALIGNMENT.md`) was tried and abandoned: the registry
  corners in view are too distant and cluttered to match with confidence. A photo taken square-on
  to a house corner on this lane would make a solve possible.

## Limits

- Positions are read from the photo pins, which are good to ±2-5 m. No camera is solved.
- The comparisons in `docs/reviews/jorge-lane-review/` use starting poses set from photo content.
  They are photographic diagnostics, not placement approval.
- The cross-paths' distances from the bench are read from tile rows; how far back they run is
  estimated to about 1 m. Planter gaps and the kerb corner are good to about 2 m.
- The generic tiled porches and awnings are left off the walls round the garden and off the
  house-23 front (`plainFronts`), where IMG_2183, IMG_2229 and IMG_2233 show plain or planted
  walls. Door 23 itself and the arched recess above it are not modelled.
- Not built: the octagonal tiles of the lane that joins from the north (it keeps the generic
  ribbon), the patio floors and furniture behind the planters, the wall lantern and meter box on
  the patio wall (IMG_2230), and the low wall with lantana behind the olive (IMG_2597).

## Checks

- `python3 scripts/check_jorge_lane.py` checks:
  - one photographed bench, and others only at recorded aerial marks;
  - the dressing stays within the photographed stretch;
  - fittings stay off the walking line and out of houses;
  - covers sit in the tiles;
  - cross-paths start at the lane edge and stay out of houses, beds and the bench;
  - the kerb runs along an open gap in the planters, and no grass lies under a planter;
  - one lamp post along the lane;
  - planting is in Details behind the route guard.
