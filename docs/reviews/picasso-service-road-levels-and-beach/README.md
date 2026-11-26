# Review: Calle Pintor Picasso south of the car park, levels (task `picasso-service-road-levels-and-beach`)

Package 2 in `docs/PICASSO_SOUTH_HANDOVER.md`. Stage 3 (levels) of the structure-first order. 26 November 2026.

## What changed

- **Kerbed pavement held at road level.** `scripts/lidar_check.py grid` now reads a `pavementHold` block in
  `data/picasso_service_frontage.json`. It holds the terrain over the outline of the ground-plan surface
  `picasso-service-pavement`, grown 2 m (one grid cell past the utility row's faces, onto the road and round the bin
  yard's street-face corner), at the road's own level. The road level is the 2020-21 ground model averaged 1.0, 1.5
  and 2.0 m out from the kerb line. It blends back to the survey over 1 m, so the raised garden behind the walls keeps
  its level. This follows the way the car park is held to the west lawn's retaining wall (`data/picasso_west_lawn.json`).
- **`data/terrain.json`** changes in 40 cells, all within x -38..-20, z 24..46 (they were between -1.20 and +0.57 m;
  they are now -0.67 to -0.89 m).
- **Result.** Over 1060 samples inside the pavement, the terrain is within -0.02..+0.02 m of the road 1.5 m out,
  except a 2 m corner by the bin store's street door, which reaches up to +0.19 m. Before this change it reached up
  to +1.18 m. The pavement is drawn at terrain + 0.39 m and the road at terrain + 0.27 m, so the pavement stands
  0.10-0.14 m over the road.

### Note on regenerating the grid

On unchanged `origin/main`, a fresh `python3 scripts/lidar_check.py grid` does not reproduce the committed
`data/terrain.json`. It differs in 413 cells, by up to 0.70 m. The differences are mostly at the north-pool north
patios (x -184..-160, z -2..20) and around x -120..-60, z 120..220. The same happens at the commit that last wrote the
file (#306, 83a514b), so they come from the model export (`layout-checks.local/model.json`), not from this change.
Inside the Picasso-south box (x -50..35, z 0..110) the drift is 2 cm at most.

To avoid shipping unreviewed changes elsewhere, the committed file is the committed grid plus exactly the cells that
this hold changes (fresh grid with the hold minus fresh grid without it, 40 cells). Regenerating the whole grid is
left for whoever owns those areas.

## Survey readings

Readings are from the 2020-21 ground model, in metres over the datum. They are recorded in `data/levels_survey.json`.

| Place | Survey | Model terrain | Record |
| --- | --- | --- | --- |
| Road by the row (1-2 m out from the kerb) | -0.64 at the long wall's end to -0.88 by 6364501UF1366S_part1 | same (held) | `picasso-service-pavement-kerb` |
| Pavement kerb | not resolved by the 1 m grid; photo-judged 0.12 m | drawn 0.10-0.14 m | same |
| Bin-yard floor | median -0.24 (p10 -0.39, p90 -0.05); road at the street door about -0.65, so 0.3-0.45 m higher | -0.26; rise 0.45 m | `picasso-bin-yard-floor` |
| Hotel apron | median -0.64 (p10 -0.76), level with the road | -0.69 | `picasso-hotel-apron-level` |
| Forecourt by the low block | median -1.09 (-1.31..-0.90) | -1.08 | `picasso-forecourt-to-lane` |
| Lane concrete / west footway | -1.70 / -1.74 | -1.77 / -1.83 | same |
| Lane footway kerb | survey across it reads a median 0.00 (range -0.21..+0.12, 19 places): below resolution | drawn by the ground plan's kerb edge | same |
| Dip behind the low box (frame s 3-5, e -1 to -2) | ground -1.4..-2.0 (0.7-1.3 m below the road, about 2 m below the garden) over about 2 by 2 m; the 2014-15 surface reads +0.55-0.59 (the box's top) | not modelled; the pavement in front is held level | `gap:picasso-low-box-light-well` (needs-photos) |

The dip is most likely a light well behind the box's parapet. IMG_3124 shows a dark low opening at the wall's foot
behind it. It is not confirmed and not built.

## Renders

Each pair image puts the photo, the before render and the after render side by side. All renders are from the
photos' pins (unsolved cameras, Walk eye-height view), so the framing is not pixel-matched.

- `IMG_3124-pair.jpg` (`-before.png`, `-after.png`)
- `IMG_3123-pair.jpg`
- `IMG_3105-pair.jpg`

The photo checks are in `data/photo_checks.json`. They are `differs` only for the details still to come (packages 4
and 5); the levels agree.

## Checks

These passed:
- `check_picasso_service_frontage`
- `check_picasso_service_road`
- `check_picasso_beach_lane`
- `check_ground_plan`
- `check_levels`
- `check_street_layout`
- `check_terrain`
- `npm run build`
- `build_references.py --check`

## Independent review: PENDING

The session that made this change had no tool to start a separate reviewer agent, so no sign-off is recorded yet. The
task stays `in-progress` until a reviewer that did not make the change signs it off here.

**Review packet.**
- Photos at full size: `public/photos-ref/IMG_3124.jpg`, `IMG_3123.jpg`, `IMG_3105.jpg`, and for context
  `IMG_3106.jpg`, `IMG_2345.jpg`, `IMG_3101.jpg` and `IMG_3103.jpg` (the bin yard).
- Renders: the three `*-pair.jpg` files in this folder.
- Aerial: `public/map/ground.jpg`, with its bounds in `public/map/ground.json`.
- Data:
  - `data/picasso_service_frontage.json` (`pavementHold`, `frame`, `buildings`, `recess`);
  - `data/ground_plan_picasso.json` (`picasso-service-pavement`, `picasso-hotel-apron`);
  - `data/levels_survey.json` (the four `picasso-*` items);
  - the diff of `data/terrain.json` and `scripts/lidar_check.py`.
- Survey: `python3 scripts/lidar_grid.py -14 26 -6 8 2 --surface --frame=-35.7,23.9,0.5191,0.8547`.

**What to check.**
1. In the after renders the pavement is flat one kerb over the road all along the row, with no bank against the
   set-back wall or the substation.
2. Nothing else visibly moved: the hotel side, the road crown and the bin store.
3. The 0.19 m residual by the bin store's street door is acceptable. IMG_3124 shows a small ramp up to that door.
4. The raised garden behind the walls is not visibly dented in Inspect Layout. The hold reaches 2 m behind the
   faces, under the walls' 2.2 m tops.
5. The readings and the light-well interpretation are fairly worded.

Then record the verdict here, sign-off or a list of errors, with the reviewer's name and date.
