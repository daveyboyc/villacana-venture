# Ground from the laser survey (task `terrain-from-lidar`)

The ground used to be one rule: a 0.5 m rise at a guessed foot line on the Dalí side, everything
else at the middle pool deck. It now follows PNOA-LiDAR, Spain's national airborne laser survey
(2020–21 ground model, 1 m; © Instituto Geográfico Nacional, CC BY 4.0, via REDIAM, Junta de
Andalucía). `scripts/lidar_check.py grid` turns the cached survey tiles into `data/terrain.json`, a
2 m height grid; the raw tiles stay out of the repository. How it is applied: `docs/TERRAIN.md`.

## Before and after (`scripts/lidar_check.py report`)

All heights relative to the middle pool deck (5.05 m above sea level in the survey).

| Measure | Before | After |
| --- | --- | --- |
| Open ground within 15 m of a house, within 0.25 m of the survey | 26% | **92%** |
| … more than 0.5 m off | 55% | **6%** |
| … median miss | −0.15 m | +0.06 m |
| North pool deck (survey +0.80) | 0.00 | +0.82 |
| South pool deck (survey +0.11) | 0.00 | +0.12 |
| Middle pool deck (survey 0.00) | 0.00 | +0.02 |
| Main pool deck (survey −2.87) | −3.00 | −2.83 |

Streets, model minus survey along the mapped centre line (median / worst):

| Street | Before | After |
| --- | --- | --- |
| Pintor Dalí | −0.51 / 1.43 | +0.06 / 0.72 |
| Miguel de Cervantes | −0.48 / 0.97 | +0.07 / 0.39 |
| Loira | −1.25 / 2.22 | +0.06 / 0.46 |
| Bolivia | −1.34 / 1.49 | +0.06 / 0.08 |
| Pintor Picasso | −0.01 / 1.46 | +0.06 / 0.23 |
| Picasso car-park access | −0.59 / 1.23 | +0.06 / 0.13 |
| Elena (north) | −0.61 / 0.68 | +0.07 / 0.14 |
| Elena (south) | −0.50 / 0.73 | +0.11 / 0.39 |
| Isabel de Oyarzábal | −0.67 / 1.09 | +0.09 / 0.19 |
| Alberto | −0.91 / 1.31 | +0.07 / 0.10 |
| Eva | +0.10 / 0.49 | +0.08 / 0.19 |
| Patricia | +0.03 / 0.60 | +0.07 / 0.23 |
| Silvia (north) | −0.02 / 0.18 | +0.07 / 0.22 |
| Silvia (south) | +0.02 / 0.35 | +0.10 / 0.15 |
| Jorge | +0.06 / 0.53 | +0.07 / 0.32 |
| Teodoro Rojo | +0.39 / 0.46 | +0.09 / 0.18 |
| Guillermo | +0.35 / 2.76 | +0.07 / 2.76 |
| Eva west footpath | +0.16 / 0.29 | +0.39 / 0.45 |

The street figures are the walking surface, which stands 0.06 m above the ground (the
`referenceGroundHeight` paving), so a perfect fit reads about +0.06.

## What is kept from the photos

- The three photographed flights keep an exact profile in `ramps`: the Cervantes steps at Elena
  (photo-read 0.5 m), and the middle pool south-west (0.53 m) and north white steps (0.52 m),
  whose survey rises fall inside the photo range.
- Raised terraces and patios are masked out of the survey (it reads their floors as ground) and
  held at the ground at their foot; houses keep one floor datum at the ground under their middle.
- `scripts/check_levels.py`: every built photo level still fits the terrain.

## What remains off, and why

- **Guillermo (2.76 m):** the lowered main-pool area's south-west corner and the Guillermo cut keep
  the lowered lawn level; the survey has the street 2.5 m above the lawn behind a sharp edge. Left
  for `guillermo-descent-recheck`; nothing there was made unwalkable.
- **Cervantes steps (0.39 m):** built at the photo-read 0.5 m; the survey measures 0.21 m. Open in
  `docs/LEVELS.md`.
- **Dalí (0.72 m at about −175, 122):** the south Dalí flagstone approach is held at the survey
  level of its foot so its photographed kerb works; the survey is higher a few metres along.
- **Loira (0.46 m at about −193, −27), Jorge (0.32 m at about −20, 126):** isolated spots; most likely the grid's smoothing of a sharp survey edge
  (a wall or kerb) or a masked patio nearby. Not investigated.
- **Eva west footpath (+0.39 m median):** the Dalí footpath and its kerb keep their own visual
  datum (`door_sills.json` `daliSurface`, 0.27 m over the inherited ground) and photo-read 0.12 m
  rise. Not changed here.
- **Seafront:** the strip 4 m behind the paseo wall stays at the old zero so the photographed 1 m
  wall keeps its height; the survey puts the gardens there 0.1–0.6 m higher. Seaward of the fade
  line the seafront keeps its own heights.
- **North pool west terrace:** its floor (+1.93 m) is about 0.2 m above the survey's top
  (+1.72 m) and its outline may sit about 5 m too far east over the lawn; not changed.
- **Oleander bed (middle pool):** stands where the survey climbs 0.3 m towards Calle Eva; its
  ±2 m placement may be off.

## Rendering

Draped surfaces are cut along the survey grid's cell edges and diagonals, where `siteY` is flat,
so stacked surfaces (ground sheet, car park, lawn strips, lanes) keep their few-centimetre
separation on slopes. Without that, the Dalí lane and lawn verges at Cervantes vanished under the
car park (first draft). The ground sheet is laid out on the same cells. A frame at the Cervantes
junction draws about 1.5× the vertices of `main` (3.2 M against 2.0 M over two frames, shadows
included).

## Views

Before and after from the same spots, first person:

| View | Before | After |
| --- | --- | --- |
| Down Cervantes from Pintor Dalí | `before-cervantes-downhill.png` | `after-cervantes-downhill.png` |
| Picasso looking south | `before-picasso-south.png` | `after-picasso-south.png` |
| Pintor Dalí looking south | `before-dali-south.png` | `after-dali-south.png` |

These are measurements against a survey, not placement approvals (`docs/PLACEMENT_VERIFICATION.md`).
Buildings and door sills move vertically with the ground, so the placement gate flags them; no
placement approval is claimed and the task stays in progress until a verified packet exists.
