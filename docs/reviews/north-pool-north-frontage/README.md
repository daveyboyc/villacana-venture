# North pool: the north row's front gardens and patios (north-pool-north-frontage)

Dave asked for the houses and patios round the north pool: details added, and the front gardens and patios
completed. This pass covers the north row and the north-west terrace house. These are the houses the roof
station (IMG_2204, IMG_2205) looks straight at.

## What the photos showed that the model did not

- **The patios were drawn too small and too far south.** The north patios had been traced with an older
  camera fit. Through the solved IMG_2205 camera, the plinth wall's foot runs 0.2 m (west) to 2.3 m (east)
  north of that trace. IMG_2204 from the same station agrees on where the three white steps are along the
  wall, to within 0.3 m. The crazy-paving path, about 1.1-1.7 m wide, runs at the wall's foot, and the lawn
  reaches up to the path, so the lawn is 1-3 m deeper on the north side than drawn. Behind the wall, the
  patios run back to the house walls, with tables against them under the awnings. The model's floor
  stopped 3-5 m short.
- **Missing furniture and fittings.** The patios hold a grey-white parasol over two loungers, three white
  dining sets and some armchairs. There are three awnings: a blue striped one on the north-west terrace
  house, and a grey and a white retractable one. Bougainvillea climbs three walls, and a white arched
  canopy spans the alley mouth. The clipped hedges behind the plinth are continuous. The model had small
  ball hedges, random generated awnings and climbers, and a generated wooden balcony where the photo
  shows only shuttered windows.

## What changed

- **`data/raised_terraces.json` north-pool-north-patios:** re-traced from IMG_2205 casts.
  - **Front:** the wall foot, with the three steps at their cast positions.
  - **Back:** the registry house fronts, except the porch fronts between x -167 and -174.6. The laser
    survey puts those at 1.3-1.5 m, above the patio floor, so they are left as an estimated step.
  - **Floor:** 0.4 m above the path, the top of the surveyed range.
  - **East end:** kept 1 m short of the wall's end by the gate, to stay clear of the mapped Calle Isabel
    lane.
  - **Hedges:** continuous clipped hedges, using a new `form: "clipped"` planting in
    `src/raised-terraces.ts`.
- **`data/ground_plan_north_pool.json`:** the path's north stretch moves to the photographed band, and
  the whole path becomes 1.3 m wide. The lawn's north edge moves to the photographed grass edge. This
  resolves the earlier north-paving discrepancy: the patio fronts the path had been kept against were
  themselves too far south.
- **`data/north_pool_frontages.json` and `src/north-pool-frontages.ts`:** furniture, awnings,
  bougainvillea and the alley arch.
  - The arch is structure and shows in Layout. The rest shows with Show details.
  - Each awning's wall is the registry front that projects onto the photographed awning's span through
    the solved camera: x 631-795 for the blue awning, 448-562 for the grey and 600-689 for the white.
  - Furniture is placed along the wall from the photo, at the distance from the wall the photo shows.
  - Generated awnings and climbers are left out on these photographed fronts.
- **`data/plain_fronts.json`:** three fronts are now photo-plain.
  - The recessed front east of the porch house loses its generated iron railing and awning.
  - The east block's return face facing the recess loses its generated wooden balcony with tiled roof.
  - The parasol house's pool front loses its generated iron balcony; the photos show a moulded sill there.
- **`data/objects.json`:** the pollarded tree o12 moves 2.3 m east, where both cameras put its trunk. It
  stands on the patio (new `onTerrace` flag). The feathery lawn tree o9 moves to its cast position, but
  the route-clearance guard still drops it (`gap:north-pool-lawn-tree`).
- **New check:** `scripts/check_north_pool_frontages.py`. `check_north_pool_gardens.py` is updated for
  the re-trace.

## Limits

- **Depth near the house fronts:** the roof station is one position, so it fixes depth near the house
  fronts only to 1-3 m. The two station cameras differ by 0.6-1.6 m at the patio front. IMG_2205 is used;
  it has the smaller residual on the pool, 0.11 m rms against 0.35 m. Furniture and awnings are placed
  relative to the registry fronts rather than by raw casts. Ground-level photos from the lawn are
  requested (`north-pool-north-row-ground`, discrepancy `north-row-front-depth`).
- **Not modelled:** the moulded window surrounds and crests (`gap:north-pool-window-mouldings`), the
  planting inside the patios (shrubs, pots, topiary) and the north-west terrace's mixed bed.

## Files

- `IMG_2204-before.png`, `IMG_2204-after.png`, `IMG_2205-before.png`, `IMG_2205-after.png`: the model
  rendered through the solved cameras with Show details. The "before" renders are of `main` before this
  change.
- `north-row-layout.png`, `north-row-details.png`: Inspect, Layout and Show details, from the pool.

## Independent review and fixes

A second agent reviewed the first renders and found them not satisfactory (`REVIEW.md`). This was fixed
afterwards:
- **Balconies:** the wooden balcony was on the return face, not the face first made plain. The parasol
  house's front also had a generated iron balcony. Both are now photo-plain.
- **Hedges:** they were blocky cushions that broke at every corner and ran past the first step. They are
  now laid along one polyline through the planted edges, broken only at the steps. They are about 0.85 m
  high and sit right behind the wall.
- **Bougainvillea:** it was small and too high. It now climbs from about 1 m above the floor to its
  photographed height, and the third plant moves 0.6 m east to where both cameras cast it.
- **Colours:** the grey awning (`#8e8e8a`) and the parasol (`#9da3a9`) are now grey, as photographed.
- **Alley arch:** it was a solid masonry arch. It is now a thin curved canopy on slim posts, about 3.8 m
  high, with its west post about 0.8 m east of the terrace house corner.
- **Small moves:** dining set A moves 0.6 m east, the folded parasol 0.6 m east, and the awnings drop
  further (0.95 m).
- **Not changed:** the white awning still runs only along its face; the photo shows about 0.7 m more to
  the east.

### Second round (after the re-check)

- **Alley canopy:** it was flipped, hanging like a hammock below its posts. It now arches up, with its top
  at about 3.8 m.
- **Awnings:** lowered, so their tops sit where the photos put them: blue 2.25 m with a 0.35 m drop,
  grey 2.1 m and white 1.75 m above their floors.
- **Bougainvillea:** the blue-awning house's plant moves to (-187.6, 11.3) and climbs from 2 m above the
  terrace, above the awning. The parasol house's plant reaches 4.8 m.
- **Hedges:** 1.15 m high, to match the photo's tops.

### Final check

The reviewer's final verdict is satisfactory-with-notes. Its two last numbers are applied:
- the alley canopy is lowered to a 2.5 m springing above the alley ground, giving a top of about 3.75 m;
- the blue-awning house's bougainvillea runs from 3.1 m to 4.9 m above the ground at its wall.

The remaining notes are known follow-ups:
- the east end of the plinth is left 1 m short for the lane;
- the pollarded tree uses a generic leafy model, where the photo shows bare knuckles;
- the window mouldings and the planting inside the patios are not modelled;
- the lawn tree is dropped by the route guard;
- the porch roofs are drawn as pergolas, where the photos show tiled roofs.
