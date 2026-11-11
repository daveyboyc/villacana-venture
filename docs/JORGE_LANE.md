# Calle Jorge

`data/jorge_lane.json`, drawn by `src/jorge-lane.ts`. Built on 9 and 10 November 2026 (PRs #193-196),
reviewed on 10 November (task `jorge-lane-review`), and given its surroundings on 11 November
(task `jorge-lane-surroundings`).

## What the photos show

All Calle Jorge photos were taken between 101 and 130 m along the 136 m mapped centreline, at its
east end. IMG_2234 looks about 15 m further west.

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
  behind it, a bougainvillea and a smaller kerbed shrub by door 23 (IMG_2229).
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
  - one photographed bench;
  - the dressing stays within the photographed stretch;
  - fittings stay off the walking line and out of houses;
  - covers sit in the tiles;
  - cross-paths start at the lane edge and stay out of houses, beds and the bench;
  - the kerb runs along an open gap in the planters, and no grass lies under a planter;
  - one lamp post along the lane;
  - planting is in Details behind the route guard.
