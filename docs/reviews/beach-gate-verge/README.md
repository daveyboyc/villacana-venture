# Beach gateway, paseo levels and the grass in front of Barraka (27 October 2026)

Dave: the beach entrance from the big pool is not at the end of the slope but to its left looking at
the beach; the height there is wrong; there is grass and planting in front of the gateway and the
railings alongside Barraka (Barraka used to sit inside Villacana and the grass went further out).

## What changed

- **Gateway** (`data/seafront_fence.json`): moved 7.5 m north-east along the same line, from the foot
  of Calle Guillermo to the dark gateway the aerial shows at the big-pool lawn's south-west corner
  (about scene -6, 131.5; `aerial-old-gate.jpg` shows the old position). The arch's bearing in IMG_2226
  agrees within the phone compass's error. A new white wall (`guillermo-ramp-wall`, 1.5 m runs) follows
  the paseo ramp from the lane's foot down to the arch; the lane's foot onto the paseo stays open.
- **Paseo heights** (`data/main_pool.json` seafront profile) from the laser survey: about -0.3 past the
  foot of Calle Guillermo, one 12 % ramp down to lawn level (-2.0 to -2.35) along the railings, rising
  to about -1.1 past Barraka. It was -3 (pool level) all along the lawn and street level east of
  Barraka. Along the paseo from the Guillermo foot to past Barraka, 37 of 38 samples are within 0.25 m
  of the survey (before: up to 2.7 m off).
- **Calle Guillermo** is level again at street level (survey -0.2 to -0.4; IMG_2488 shows it level).
  The 3 m ramp built on 21 October from the Apple 3D screenshots is removed, which closes
  `guillermo-descent-recheck`'s levels question. The sloping corner by the kiosk is taken out of the
  lowered lawn so the ground there follows the survey, and the terrain grid fills the lowered lawn and
  the ground round it separately (`scripts/lidar_check.py grid`). Open ground across the resort: 95 %
  within 0.25 m of the survey (was 92 %).
- **Grass and shrubs** (`data/beach_verge.json`, `src/beach-verge.ts`, map and 3D): a rough outline
  of the grass seaward of the paseo from the lane's foot to Barraka, ending at a long shrub strip, and
  17 shrub clumps (Details only), read off the aerial and IMG_2226.

## Renders

`gate-from-beach-before.png` / `-after.png`: from the beach looking at the gateway, railings and the
new verge. `IMG_2488-before/after.png`: the lane from its foot, sunk in a channel before, level after
(as the photo). `IMG_2226-before/after.png`: from the photo's pin, 50 m out on the beach.

## Still open

- The verge is a rough outline (edges about 2-3 m); shrub sizes and the grass's seaward edge need
  close photos. No fence along Barraka itself is modelled: none is visible in the photos we have.
- Calle Guillermo's east edge reads the lawn below the retaining wall in the 1 m survey (up to 2.3 m),
  so the mapped lane may sit up to 1 m too far east.
- West of turned x -110 the paseo keeps its photo-read level (1 m below the south lawn); the survey
  puts that stretch about 1 m higher. Not changed here.
- The arch's height, opening and the walls' heights are by eye; placement is unapproved (the
  placement gate flags it, as for every geometry change).
