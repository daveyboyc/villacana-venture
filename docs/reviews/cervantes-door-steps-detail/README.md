# Cervantes/Elena garden door: step detail (27 October 2026)

Task `cervantes-door-steps-detail`. The brown garden door on the north edge of
Cervantes at the Elena junction, the entrance to the private patio seen from the
Elena 24 roof (IMG_2358/2367). Features: `cervantes_garden_door.json:cervantes-garden-door`,
`:cervantes-junction-north-bed`, new `:cervantes-junction-east-planter`.

## What the full-size photos show

Sources: IMG_2196 and IMG_2287 (frontal, same station), IMG_2327 (close, looking
west along the north edge), IMG_2328 (the flight at the far right).

| Observation | Source | Model before | Model after |
| --- | --- | --- | --- |
| Three white risers: lane → tread → tread → threshold tread at the door | IMG_2196, IMG_2287 (three white faces), IMG_2327 (third riser below the door's red threshold tiles) | two .225 m risers | three .15 m risers to the unchanged .45 m rise |
| Each tread is two rows of small square red quarry tiles | IMG_2327, IMG_2328 | .38 m treads, lane paving texture | .33 m treads, threshold .29 m, ~.165 m tiles |
| Bottom step wider than the flight, rounded ends | IMG_2196, IMG_2287, IMG_2328 | 1.04 m, square | 1.2 m, .12 m rounded front corners |
| Bottom step flush with the west bed front; its rounded west end wraps the bed's thickened end | IMG_2196 (base lines within ~.06 m), IMG_2328 | flight recessed .28 m behind the bed; .5 m gap to the bed | bed front = bottom riser line; bed runs to the flight with a notch for the bottom step |
| Low white east planter directly beside the upper treads, front set back .2–.3 m from the bottom step | IMG_2196, IMG_2287 base lines; IMG_2327 rounded end | absent | `eastPlanter`, front .24 m behind, .45 m high |
| Door about .72 × 1.8 m in a white pilaster frame (~.14 m pilasters) about 1.0 m wide; coping about 1.1 m wide | IMG_2196 (door 198 × 510 px; frame 280 px; coping 320 px) | .9 m door flush on the wall, 1.44 m coping | .72 m recessed leaf, pilasters + head, 1.1 m coping |

Riser heights read about .18, .14 and .15 m in IMG_2196 (the bottom face includes
its bulging base); they are modelled equal. Widths are scaled from the door height
and are good to roughly ±.05–.1 m.

## Renders

- `IMG_2196-compare.jpg`, `IMG_2327-compare.jpg`: photo / before / after through a
  hand-set starting pose (`data/photo_poses.json`, not solved: pin, looksAt and
  vanishing-point yaw/pitch, eye ~1.5 m above the lane).
- `<photo>-before.png` / `-after.png`: standard third-person `shoot_views` views.

## Not changed / open

- Garden wall origin, line and length, patio extent and the .45 m datum are unchanged.
- The separate .65 m lane-edge wall `cervantes-patio-north-east` starts at the planter's
  east end but stands .32 m further out than the planter front the photos show; it was
  not moved here. Whether it is the continuation of the same planter is open.
- The bed's thickened rounded end and the bottom step's bulging base are simplified.
- No measured placement packet or independent review: placement remains unapproved.
