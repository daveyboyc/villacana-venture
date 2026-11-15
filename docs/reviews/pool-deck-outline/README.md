# North pool: water ring and deck tongues (pool-deck-outline)

The north pool's two deck tongues were wrong in the model. Both are photographed square through the
three solved station cameras (IMG_2204, IMG_2205 and IMG_2206, `data/photo_poses.json`). The
registry water ring drew both short, with rounded noses, and `build_skeleton.py` rounded them
further. The tongues are edges of the water as well as of the deck, so matching them meant correcting
the registry ring. This is a measured correction under Dave's measured approval
(docs/PLACEMENT_VERIFICATION.md): two or more solved cameras within 0.3 m rms, with held-out points
reported, and a second agent reviewing.

## What changed

- **`data/pool_ring_corrections.json`** replaces two runs of the 42-vertex registry ring.
  `build_skeleton.py` (`correct_pool_ring`, `smooth_ring(..., hard=...)`) applies the replacements
  before rounding and keeps the photographed corners sharp. The other pools rebuild byte-identical.
  - **East tongue (pump box):** a straight coping run from the ladder pocket's south-west corner to a
    square corner at about (-174.54, 20.13), about 0.6 m beyond the old rounded nose. The ladder
    pocket's floor moves about 0.5 m north, to the photographed edge.
  - **South-west tongue (ladder):** a square tongue about 1.4 m wide (x -177.2 to -178.6), its
    north edge at about z 22.5, about 0.9 m beyond the old nose at z 23.4. The west face's foot is
    hidden by the strelitzias and keeps the registry vertex (-178.73, 24.72). The small ladder
    recess in its north edge is not modelled.
- **`public/map/skeleton.json`:** the north pool's ring and deck are patched in place from
  `build_pools()`. A full `build_skeleton.py` run does not reproduce the committed file.
- **Deck band widths** (`data/pool_decks.json`) are refitted to the new ring by
  `scripts/measure_pool_decks.py --write`, which also redraws its overlays in
  `docs/reviews/north-pool-detail-pilot/`. Kept at the old widths, the deck's outer edge fitted its
  38 photo picks worse (0.21 m rms, worst 0.67 m). Refitted, it is 0.18 m rms (worst 0.53 m), where
  it was 0.15 m (worst 0.48 m) before. The aerial check moves from 0.36 to 0.39 m rms.
- **Ladders o2 and o3** (`data/objects.json` and the skeleton props) move to where the photos show
  them.
  - o3 descends into the ladder pocket north of the east tongue. It had stood at the tongue's tip,
    where neither photo shows a ladder.
  - o2 descends over the south-west tongue's north edge.

## Measurement

`python3 scripts/measure_pool_ring.py --write` holds the picks and writes the overlays and residuals
here.
- **Picks:** pixels on the coping's water edge, picked on 4–6× zooms with a 10 px grid.
- **Projection:** each pick is cast through its solved camera onto the deck level, 0.82 m
  (`data/terrain.json` decks).
- **Comparison:** the cast points are measured against the ring before and after the correction.

| picks | n | rms before → after | worst before → after |
| --- | --- | --- | --- |
| fit (placed the vertices), all cameras | 39 | 0.66 → 0.14 m | 1.43 → 0.29 m |
| held-out on the corrected edges | 9 | 0.53 → 0.18 m | 0.98 → 0.28 m |
| unchanged edges (each camera against the registry) | 19 | 0.26 → 0.25 m | 0.45 → 0.43 m |

Per camera, after the correction:

| camera | fit rms | held-out rms |
| --- | --- | --- |
| IMG_2204 | 0.16 m | 0.21 m |
| IMG_2205 | 0.09 m | 0.09 m |
| IMG_2206 | 0.16 m | 0.28 m (one point) |

Limits:
- **Not independent cameras:** the three cameras share one position (one roof station) but are
  solved separately. They disagree by about 0.25 m from one to the next in z on the same corners:
  IMG_2204 north of IMG_2205, which is north of IMG_2206. IMG_2204 also sits 0.35 m rms from the
  unchanged registry edges. The corrected vertices use the mean of the cameras, so each camera's
  residual includes its share of that spread.
- **Not surveyed:** this is not a survey.
- **No aerial check:** the aerial (0.24 m a pixel, registered by the water itself) cannot resolve
  the tongues and was not used for them.

## Files

- **`ring-IMG_2204.jpg`, `ring-IMG_2205.jpg`, `ring-IMG_2206.jpg`:** full-size photos with the
  registry ring (red) and the corrected ring (yellow) drawn at deck level through each solved
  camera. Picks are marked by role: fit magenta, held-out cyan, unchanged green, excluded orange.
- **`ring-residuals.json`:** every pick, its cast point and its distance to both rings.
- **`IMG_220x-before.png`, `IMG_220x-after.png`:** the model rendered through each solved camera
  with Show details, before and after.

These are photographic measurements through solved cameras. Approval needs the second agent's review,
recorded in `data/placement_reviews.json` under `measuredApprovals`. The placement gate stays red
until `scripts/placement_verification.py` reads those records (task `loop-measured-approval`).
