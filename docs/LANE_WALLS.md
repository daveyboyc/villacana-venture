# Garden and patio walls along Calle Elena and Calle Jorge

`data/lane_walls.json`, drawn by `src/lane-walls.ts`, checked by `scripts/check_lane_walls.py`. Task
`lane-walls-jorge-elena` (Dave, 16 November 2026: the walls need adding around Calle Jorge and Elena).

The walls are structure: they show in Inspect in Layout and with **Show details**, they are solid, and
the map (`src/blueprint.ts`) draws them with their doors. Each has a confidence level in
`data/confidence.json`.

## How the lanes were surveyed

Both lanes were rendered in Inspect (Layout) and compared with the full-size photos and with the
aerials resampled onto the lane: Esri World Imagery at zoom 20, which lines up with the registry, and
Imagery © Google 2026 satellite at zoom 20-21 (fetched 16 November 2026), which is sharper but sits
1-2 m off and leans, so it was used to read what is there and Esri to place it. Along Calle Jorge the
aerial was cut into strips along the mapped centreline, so stations (metres from the Dalí car park)
and offsets read straight off it.

## What is built

| Wall | Where | From | Level |
| --- | --- | --- | --- |
| `elena-south-lawn-west-wall` | the whole west side of the two Elena south lawns, 2.2 m, two closed brown doors | IMG_2261, IMG_2260, IMG_2330 from the lane, IMG_2358 from a roof; the doors stand on the sills already built in `data/door_sills.json` | estimated |
| `elena-south-mouth-patio-wall` | east side of the Elena south lane mouth, 1.1 m, from the Cervantes south wall to the house corner | IMG_2358; the Google satellite view for its lane-side line | estimated |
| `jorge-garden-east-wall` | Calle Jorge at 104.3 m, north side, 2.6 m above the path, house corner to lane edge | IMG_2230 (the wall with lantern and meter box) and the Esri aerial | estimated |
| `jorge-patio-wall-117`, `-124` | Calle Jorge at 117.5 and 124.5 m, north side, house corner to the back of the planters, 2.2 m | Esri and Google aerials | inferred |

**Elena.** The photos show one continuous plain white wall along the west side of both lawns, a little
taller than its two doors, behind a bed of trained bougainvillea; the far end is the wall with the
cypresses, which the model draws as the north face of registry 6265801UF1366N_part5, and the north end
meets the existing Cervantes south patio wall. The wall's outer face runs through the two built sills;
the far door is set about 0.4 m back, as it is in IMG_2261. The traced north-west corner of lawn 2
(`data/frontage_divisions.json`) poked 0.24 m through that line, so it was moved 0.69 m (0.61 m east, 0.32 m north) to sit
0.45 m inside the wall, as the photos show the lawn edge running straight along it.

**Jorge.** In IMG_2230 the tall white wall with a lantern and meter box stands at the west end of the
hedged planters, with the candelabra tree behind it. Its lane end is about 10 degrees right of the
lane's vanishing point, which from the camera pin (113.8 m, ±2 m) puts it at 103-106 m; the Esri aerial
has a white wall at 104.3 m from the lane edge back to the corner of 6364401UF1366S_part2, with the
garden lawn ending against it and its shadow on the lawn. So the open, kerbed garden ends at 104.3 m,
not 108.4 m as first estimated from the pins: in `data/jorge_lane.json` the planter's open gap now ends
at 104.4 m and the garden kerb and lawn at 104.1 m, and the hedged planter runs on from the wall as in
the photo. Further east the aerials show a white wall square to the lane at each place the north-side
houses step back (111.1, 117.7 and 124.3 m), each from the house corner to the planters. The model had
the houses but left the strip between their corners and the planters open. The walls at 117.7 and 124.3 m are built as
inferred, as tall as the photographed one less a little. The one at 111.1 m is not: the brick entrances
in the planter were placed from photo pins (112.4 and 114.7 m) and probably sit as far east of the
truth as the garden end did, so a wall at 111.1 m would cut the first entrance off from the patio
IMG_2230 shows it leading into. Which is wrong is recorded as discrepancy `jorge-planter-gaps-vs-aerial`
(photo request `jorge-east-square-on`).

**Elena, measured 17 November 2026** (task `elena-junction-lawns-roof`, `docs/reviews/elena-junction-lawns-roof`).
A new roof photo from Elena 24 (`ELENA-ROOF-2026-11-17.jpg`) and IMG_2358, both with solved cameras, put the
wall foot 1.07 m east of the line above (1.01 m rms off its face). The wall, both doors and their sills were moved
1.07 m along the Cervantes south wall line, so the ends still meet that wall and the cypress wall; the lawns now
run from the lane kerb to a 0.35 m shrub strip at the wall foot. Measured points fit at 0.19 m rms (worst 0.55 m),
far held-out points 0.31 m.

## What was looked at and not built

- **Calle Jorge 56-86 m.** The aerial shows open front lawns with Y-shaped tiled paths up to the house
  fronts, two benches at the lane edge and planted beds in the house recesses: no lane-front wall, and
  the patio walls are inside the registry footprints the model already draws. Nothing added.
- **Calle Jorge at Calle Silvia** (`gap:jorge-silvia-lawn-wall`). Both aerials show a white wall with a
  curved corner round the north-east corner of the south-pool lawn, running south along its east side.
  No photo shows it, and where the second white portal stands relative to it is unknown, so it is a gap
  (photo request `jorge-silvia-junction`).
- **Calle Jorge south-side recesses** (`gap:jorge-south-recesses`). At 101-108 m and 121-125 m the
  registry house fronts step back to about 11 m; the aerials have these in deep shadow and do not show
  whether a wall closes them (photo request `jorge-east-house-fronts`).
- **Calle Elena south, east side.** House fronts stand at the lane; IMG_2330 shows planting, not walls.
- **Calle Elena north.** Its garden walls, patio walls and gateway were built earlier
  (`docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`).

## Limits

- No camera is solved for Calle Jorge (the Elena wall's line is now measured, above). Positions come from the door sills, the registry corners, photo pins and the
  aerial, and are good to about 1 m; heights are read by eye against doors and planters.
- These are photographic and aerial readings, not placement approval (`docs/PLACEMENT_VERIFICATION.md`).
- The walls have no texture of their own beyond the shared plaster, no bougainvillea and no lantern or
  meter box yet; those are detail for after the structure is reviewed.
