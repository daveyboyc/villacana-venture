# Calle Jorge

`data/jorge_lane.json`, drawn by `src/jorge-lane.ts`. Built on 9 and 10 November 2026 (PRs #193-196),
then reviewed on 10 November (task `jorge-lane-review`).

## What the photos show

All Calle Jorge photos were taken between 101 and 130 m along the 136 m mapped centreline, at its
east end. IMG_2234 looks about 15 m further west.

| Photo | Shows |
| --- | --- |
| IMG_2182, IMG_2229, IMG_2230 | Looking west along the lane: four square terracotta tiles across with a pale edge; grass both sides; one white azulejo bench on the lawn side; a low white planter wall with a clipped hedge on the other side; white patio walls with small vents; tiled cross-paths to the houses |
| IMG_2231, IMG_2232, IMG_2596 | The bench up close; house number 20; a flush SANEA cover and a square grate in the tiles |
| IMG_2234 | The CALLE DE TEODORO plaque, a black lamp, and the hedge on the planter wall |
| IMG_2183, IMG_2233 | The candelabra cactus in the garden behind the wall: two pale trunks, stems leaning out and then up, a round shrub at its foot |
| IMG_2597 | The CALLE DE JORGE plinth and lamp at the east end, the lettered face turned towards the path |

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
  stems, with a round shrub at its foot.
- **Plinth:** it faced about 60° away from the photo. It now faces the path.

**Layout and Details.** Planting now appears only with Details on, and every plant passes the
route guard. The bench, plinth, lamps, plaques, covers and walls are photo-backed fittings and
show in Layout too.

## Limits

- Positions are read from the photo pins, which are good to ±2-5 m. No camera is solved.
- The comparisons in `docs/reviews/jorge-lane-review/` use starting poses set from photo content.
  They are photographic diagnostics, not placement approval.
- Not built: the tiled cross-paths to the houses, and the patio walls' vents.

## Checks

- `python3 scripts/check_jorge_lane.py` checks:
  - one photographed bench;
  - the dressing stays within the photographed stretch;
  - fittings stay off the walking line and out of houses;
  - covers sit in the tiles;
  - planting is in Details behind the route guard.
