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
- **South-east wall:** from the white pier at (-181.6, 30.75) towards (-184.5, 32.5), with its cap 1.7 m
  above the ground. The gate is beside the pier and its foot is at ground level. The roof station can't
  fix this wall's direction; taken literally, the gate would be 0.56 m wide. The gate is drawn at a usual
  0.9 m, and the direction is marked estimated.

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
