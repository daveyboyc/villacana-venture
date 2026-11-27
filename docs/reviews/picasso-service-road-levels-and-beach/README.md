# Review: Calle Pintor Picasso south of the car park, levels (task `picasso-service-road-levels-and-beach`)

Package 2 in `docs/PICASSO_SOUTH_HANDOVER.md`. Stage 3 (levels) of the structure-first order. 26 November 2026.

## What changed

- **Kerbed pavement held at road level.** `scripts/lidar_check.py grid` now reads a `pavementHold` block in
  `data/picasso_service_frontage.json`.
  - It holds the terrain over the outline of the ground-plan surface `picasso-service-pavement`, grown 2 m onto the
    road and along it, at the road's own level. The road level is the 2020-21 ground model averaged 1.0, 1.5 and 2.0 m
    out from the kerb line.
  - It never holds past the row's faces. Nodes on the far side of the outline's face edge (points 0-11) keep their
    own values, and so do nodes beyond the pavement's ends on the garden side.
  - The exception is the ground under the row's own buildings (the substation and the meter box, `buildingsHeld`),
    which stand on the pavement's level.
- **Step lines in the terrain (revision 2).** A 2 m grid cannot step at a wall by itself. The grid now also writes
  `steps` to `data/terrain.json`: the outline's face edge (points 0-12, the faces and the pavement's south end) and the
  two held buildings' outlines.
  - Each line is set `stepInset` (0.1 m) into the wall or building. Points on the pavement's own edge, which lies on
    the face, then read the pavement's side, and the step falls inside the wall.
  - A node inside that 0.1 m (only (-26,42), 1 cm behind the slatted gate's line) is held with the pavement.
  - `src/terrain.ts` reads a cell's node whose straight line to the sampled point crosses a step line as the mean of
    the cell's nodes on the point's own side.
  - `refine()` also splits draped triangles along those lines.
  - The ground therefore steps at the wall: the pavement is flat up to the faces, and the garden is level up to the
    walls behind them.
  - The step box is only this stretch; nothing else in the resort samples differently.
- **`data/terrain.json`** changes in 29 cells, all now -0.67 to -0.89 m:
  - on the pavement (17);
  - on the road beside it (9);
  - under the substation and meter box (2);
  - inside the slatted gate's wall line (1: (-26,42)).
  - **No node behind the walls changed.** The nodes the first review flagged keep their values: (-38,28) +0.38,
    (-36,30) +0.36, (-34,32) +0.48, (-34,34) +0.57, (-28,40) +0.25, (-26,44) +0.28 and (-24,46) +0.33.
  - (-22,44), from -0.79 to -0.89, lies past the pavement's south end at road level, not in the garden.
- **Result, sampled through the game's own `siteY`.**
  - Pavement: over 1656 samples inside the pavement, the ground is within -0.04..+0.01 m of the road 1.5 m out. Before
    this change it reached up to +1.2 m. The pavement is drawn at ground + 0.39 m and the road at ground + 0.27 m, so
    the pavement stands 0.08-0.13 m over the road.
  - Garden: 1893 points behind the faces were compared with `origin/main`. Every point 2 m or more from a face is
    unchanged.
  - Between 1 and 2 m from a face nothing drops by more than 0.035 m; 23 points rise, by up to 0.22 m.
  - Closer to the walls the garden mostly *rises*, by up to 0.54 m at 0.25 m from a wall. Before, it sloped down
    towards the road through the cell across the wall; now it stays at its surveyed level.
  - Drops beyond 0.25 m from a face are 0.10 m at most, near the bin store's street corner and the gate
    recess. Larger drops occur only within 0.15 m of a face, inside the wall thickness.
- **Revision history.** The first version held the outline grown 2 m past the faces. The independent review (CHANGES
  NEEDED) found that it dented the raised garden by 1.1-1.35 m in a trough along the walls. Cutting `behind` alone
  cannot fix this on a 2 m grid: with no node behind a wall held, the pavement's back edge ramped up to +1.2 m in the
  recess. Hence the step lines.

### Note on regenerating the grid

On unchanged `origin/main`, a fresh `python3 scripts/lidar_check.py grid` does not reproduce the committed
`data/terrain.json`. It differs in 413 cells, by up to 0.70 m. The differences are mostly at the north-pool north
patios (x -184..-160, z -2..20) and around x -120..-60, z 120..220. The same happens at the commit that last wrote the
file (#306, 83a514b), so they come from the model export (`layout-checks.local/model.json`), not from this change.
Inside the Picasso-south box (x -50..35, z 0..110) the drift is 2 cm at most.

To avoid shipping unreviewed changes elsewhere, the committed file is the committed grid plus exactly the cells that
this hold changes (fresh grid with the hold minus fresh grid without it, 29 cells; the header with `steps` is the fresh one). Regenerating the whole grid is
left for whoever owns those areas.

## Survey readings

Readings are from the 2020-21 ground model, in metres over the datum. They are recorded in `data/levels_survey.json`.

| Place | Survey | Model terrain | Record |
| --- | --- | --- | --- |
| Road by the row (1-2 m out from the kerb) | -0.64 at the long wall's end to -0.88 by 6364501UF1366S_part1 | same (held) | `picasso-service-pavement-kerb` |
| Pavement kerb | not resolved by the 1 m grid; photo-judged 0.12 m | drawn 0.08-0.13 m | same |
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
- Inspect Layout after the revision, from `scripts/shoot_inspect.cjs`:
  - `row-oblique-after-layout.png`, an oblique view from over the road;
  - `row-overhead-after-layout.png`, a steep view over the row and the garden.

  In both views the pavement is a flat cream strip from the bin store to the slatted gate, and the garden behind the
  walls is level up to them. The terracotta and lawn behind the walls are generated filler, left for stage 4
  (package 8). Two small terracotta shards stick up:
  - one in the 0.7 m gap between the set-back wall's south end and the substation's corner;
  - one at the slatted gate's south end, where the unseen ground beyond the pavement (survey +0.3 m,
    `gap:picasso-utility-row-part1-face`) falls to the road. That fall is unchanged from main.

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
- `check_middle_pool`
- `tsc --noEmit`
- `npm run build`
- `build_references.py --check`

## Independent review

**First review (26 Nov 2026), by a reviewer agent started by the coordinating session: CHANGES NEEDED.** The reviewer
found the pavement right but the garden dented: the hold, grown 2 m with a 1 m blend on a 2 m grid, dropped the nodes
1-2.4 m inside the garden by 1.1-1.35 m. Those were (-38,28), (-36,30), (-34,32), (-34,34), (-28,40), (-26,44) and
(-24,46). The README's claim that the garden keeps its level was wrong. Fixed in revision 2 (step lines, no node behind
the walls held; see above).

**Re-review of revision 2: APPROVED** (27 Nov 2026, independent reviewer subagent that made neither revision).
- The seven flagged garden nodes are back at their `origin/main` values; 29 cells change, all on the pavement, the road,
  under the substation and meter box, or at (-26,42) inside the slatted gate's 0.1 m inset.
- `src/terrain.ts` step logic is correct and confined to the step lines' box plus 2 m; a point far outside reads
  normally. Transects at z = 30, 34 and 40 step cleanly at the inset line; the garden keeps its surveyed values.
- The Layout overhead and oblique show no trough; the IMG_3123 pair now matches the photo's flat kerbed strip.
- The two terracotta shards are small and described accurately.
- Two wording slips (the discrepancy's resolution and the cell count here) were corrected before merge.

**Review packet.**
- Photos at full size: `public/photos-ref/IMG_3124.jpg`, `IMG_3123.jpg`, `IMG_3105.jpg`, and for context
  `IMG_3106.jpg`, `IMG_2345.jpg`, `IMG_3101.jpg` and `IMG_3103.jpg` (the bin yard).
- Renders: the three `*-pair.jpg` files and the two `row-*-after-layout.png` Inspect views in this folder.
- Aerial: `public/map/ground.jpg`, with its bounds in `public/map/ground.json`.
- Data:
  - `data/picasso_service_frontage.json` (`pavementHold`, `frame`, `buildings`, `recess`);
  - `data/ground_plan_picasso.json` (`picasso-service-pavement`, `picasso-hotel-apron`);
  - `data/levels_survey.json` (the four `picasso-*` items);
  - the diff of `data/terrain.json` (cells and `steps`), `scripts/lidar_check.py` and `src/terrain.ts`;
  - the step logic in `src/terrain.ts`: `crossesStep`, the side-aware read in `surveyed()`, and `stepped()` in `refine()`.
- Survey: `python3 scripts/lidar_grid.py -14 26 -6 8 2 --surface --frame=-35.7,23.9,0.5191,0.8547`.

**What to check.**
1. In the after renders the pavement is flat one kerb over the road all along the row, with no bank against the
   set-back wall or the substation.
2. Nothing else visibly moved: the hotel side, the road crown and the bin store.
3. No grid node behind the faces changed (the README lists the 29 changed cells by place), and the step lines follow
   the faces.
4. In the Inspect views, the raised garden behind the walls is level up to the walls with no trough. The
   substation and meter box stand on the pavement's level.
5. The readings and the light-well interpretation are fairly worded.

Then record the verdict here, sign-off or a list of errors, with the reviewer's name and date.
