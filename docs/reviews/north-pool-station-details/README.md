# North pool: west gardens and the Calle Isabel side (north-pool-station-details)

## West gardens: the gated patio (IMG_2206, IMG_2208)

South of the west path, two white walls with curved cappings and brown plank gates hold a terracotta
patio with a parasol, with bougainvillea above. The model had generated 1 m garden walls in the same
place, without the height, the cappings or the gates.

The generated wall points project onto the photographed walls through the solved IMG_2206 camera. They
fix each wall's line, and the gates and heights are measured by intersecting photo rays with that wall's
vertical plane:

- **West wall (x -187):** cap 1.9 m above the ground. The gate is 1.0 m wide, centred at z 31.1, and its
  top is about 1.6 m up. This wall faces the camera, so these numbers are reliable.
- **East wall (re-traced after review):** it runs south-south-east from about (-183.1, 30.1), through its
  gate centred at (-182.37, 31.22), towards the block by the camera. On this direction the gate measures a
  usual 0.88 m wide, its foot is at the ground, and the wall top falls towards the camera as photographed;
  IMG_2208 shows the same wall. The first trace had the wall running west-north-west, which gave an
  impossible 0.56 m gate.

Built as `north-pool-west-gated-patio` in `data/ground_plan_north_pool.json`: a terracotta patio whose
wall edges are solid and appear on the map, with openings for the gates. The gates and their raised
cappings come from `data/north_pool_frontages.json` (`gates`); they are structure and show in Layout. The
parasol and bougainvillea show with Show details. On a wall's plane the bougainvillea stands 3-4.4 m up,
above the wall's top, so it grows inside the patio behind the wall. The generated walls and gates in that
box give way (`replacesGardenWalls`).

## Calle Isabel side (IMG_2205)

- **East block's face:** the block across Calle Isabel shows plain white wall with two shuttered windows
  and a ground-floor archway. The generated iron balcony and awning on it are removed
  (`data/plain_fronts.json` `north-pool-isabel-east-block`).
- **Calle Isabel paving:** the photo shows open crazy paving from the lawn up to the iron gate. The
  generated low wall, its hedges and a white arched gate there give way.

## Open

- The trees and the yucca beside Calle Isabel are placed but dropped by the route-clearance guard
  (`gap:north-pool-lawn-tree`, `gap:north-pool-station-yucca`). This leaves the east side looking bare,
  and it needs Dave's decision.
- The archway into the east block (`gap:north-pool-isabel-archway`) and the creeper on the near block
  (`gap:north-pool-station-creeper`) are not modelled.
- The near block's corner and height: `north-pool-station-notch-corner`.
- Ground-level photos of the gates are requested: `north-pool-gated-patio-gates`.

## Files

- `IMG_2205-before.png`, `IMG_2205-after.png`, `IMG_2206-before.png`, `IMG_2206-after.png`: renders
  through the solved cameras with Show details. The "before" renders are of `main`.
- `west-gardens-layout.png`, `west-gardens-details.png`: Inspect views of the gated patio.
- `isabel-layout.png`, `isabel-details.png`: Inspect views of the Calle Isabel side.

## Independent review and fixes

A second agent found the first version not satisfactory (`REVIEW.md`). This was fixed:
- **Gate openings:** they were off by half a gate, because the ground plan reads `at` as the opening's
  centre. They are now centred on the measured gates, so collision and the map change with them.
- **East wall:** re-traced south-south-east, as described above. The patio's outline follows it.
- **Parasol:** it hid the west gate. It now stands inside the re-traced wall, lilac-grey (`#b4b0c6`),
  with its canopy at 2.1 m.
- **Leftover generated wall:** a stub of generated wall east of the patio is gone; the replacement box
  now reaches x -179.
- **Calle Isabel paving:** it now runs continuously from the lawn up to the iron gate and along the east
  block (`calle-isabel-east-paving`, raised over the lane mesh). This covers the green patch and the
  lane's terracotta squares.
- **Map:** it now leaves out the replaced generated walls too (`src/blueprint.ts`).
- **Confidence:** the stale entries for the gated walls are updated.
- **Not changed:** a generated wall stub at about (-159.6, 18) behind the yucca stays, because the photo
  can't show whether a wall is there.
