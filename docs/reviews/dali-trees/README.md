# Pintor Dalí and Calle de Miguel trees (19 November 2026)

Trees from the 19 November photo batch (IMG_3082-3096), placed in `data/objects.json` and drawn
with **Show details** in Inspect:

| Id | Kind (model) | Photos | Position good to |
| --- | --- | --- | --- |
| dali-strelitzia-1 to -4 | `bird_of_paradise` (plants/strelitzia) | IMG_3082-3084 | ±1-4 m along the path |
| dali-jacaranda-1 | `feathery_tree` (trees/spreading-tree) | IMG_3082 | ±3.5 m |
| dali-loquat-1 | `tree` at scale 0.8 (trees/broadleaf) | IMG_3084, IMG_3085 | ±2 m |
| cervantes-apron-fan-palms | `fan_palm` (plants/fan-palm-clump, new) | IMG_3087, IMG_3088 | ±1.5 m |
| dali-north-fan-palms | `fan_palm` | IMG_3086, IMG_3089 | ±3 m |
| dali-cycad-1 | `cycad` (plants/cycad, new) | IMG_3086 | ±1.5 m |
| miguel-banana-1 | `banana` (plants/banana, new) | IMG_3090, IMG_3092 | ±3 m |

## How they were placed

These are photo estimates, not measured placements. No camera was solved, and they carry no
placement approval.

- **Lawn-strip trees.** Each was placed in the house-side footpath's own frame. The camera station
  is the GPS pin projected onto the modelled path centreline. Distances come from where each trunk
  meets the ground in the photo, taking a 1.5 m camera height and the path's vanishing point.
- **Banana.** Placed where its bearings from IMG_3090 and IMG_3092 cross. The phone compasses here
  read up to about 15 degrees off, so its position is good to about ±3 m.

## Renders

- `inspect-dali-lawn-strip-details.jpg`: Inspect with Show details over the lawn strip south of the
  Cervantes apron. It shows the bird of paradise clumps, the jacaranda, the loquat and the apron fan palms.
- `inspect-dali-apron-details.jpg`: the Pintor Dalí view from the apron. It shows the fan palm clumps and
  the banana above the Calle de Miguel garden hedge.

## Known differences from the photos

- **Jacaranda.** The existing spreading-tree model reads as a low dome. IMG_3082 shows a tall,
  leaning, gnarled trunk under an open canopy.
- **Lawn strip south of z ≈ 95.** It is not traced (gap `dali-lawn-strip-south`), so the trees
  south of there stand beside a thin strip rather than on a 3 m lawn.
- **Apron planter.** The raised planter is not modelled (gap `cervantes-apron-raised-planter`), so
  the palms stand on the ground.
- **Bollard lamps.** The green bollard lamps on the strip are not placed (gap `dali-lawn-bollards`).
