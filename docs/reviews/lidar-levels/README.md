# Levels and roof heights against the national laser survey

`scripts/lidar_check.py` compares the running model with PNOA-LiDAR, Spain's national airborne
laser survey. REDIAM, the Junta de Andalucía's environmental network, publishes it as 2 × 2 km
elevation tiles. All heights below are relative to the middle pool deck, the model's zero; the
survey puts that deck at 5.05 m above sea level. Full numbers are in `measurements.json`.

- `survey-ground.png`: surveyed ground with 0.5 m contours, mapped streets and footprints.
- `ground-difference.png`: model ground minus surveyed ground (blue: model too low; red: too high).

## Sources and what each can show

| Survey | Product | Used for |
| --- | --- | --- |
| 2020–21 (V226) | Ground model (MDT), 1 m | Ground levels, pool decks, street profiles |
| 2014–15 (V208) | Surface and ground models (MDS, MDT), 2 m | Roof heights above each building's ground |

Two 2020–21 products look useful but leave buildings out:
- The **2020–21 surface model** fills each building in from its edges, so roofs come out tent-shaped.
- The **normalised-height products** (`MDHN`, and the classified `MDHN_cla`) are vegetation heights.

The raw laser points (LAZ) are on the national download centre, which did not answer from this
environment. The tiles stay out of the repository (`layout-checks.local/lidar`).

## Findings

> **Update, 24 October (task `terrain-from-lidar`).** The ground now follows a 2 m grid from this
> survey (`data/terrain.json`, `docs/TERRAIN.md`), and `measurements.json` and
> `ground-difference.png` are refreshed for it: 92% of the open ground near houses is within
> 0.25 m of the survey (was 26%), pool decks are within 0.04 m, and every street's median miss is
> 0.06–0.11 m. Findings 1 and 2 below describe the model before that change; before and after
> numbers are in `docs/reviews/terrain-from-lidar`.


**1. The ground is not flat; the model mostly is.** The block falls about 3 m from its
north-west corner to the main pool and the paseo. The model has one 0.5 m rise on the Dalí side
and keeps everything else at zero.

| Street | Survey, start → end | Model, start → end |
| --- | --- | --- |
| Pintor Dalí | +1.75 → +0.07 | +0.56 → +0.47 |
| Miguel de Cervantes | +1.40 → +0.23 | +0.56 → +0.06 |
| Alberto | +1.32 → +0.26 | flat +0.06 |
| Pintor Picasso | +1.52 → −0.90 | flat +0.06 |
| Eva, Patricia, Jorge | about +0.6 to +1.0 → −0.1 to −0.5 | +0.56 → +0.06 |

Within 15 m of a house, a quarter of the open ground is within 0.25 m of the survey and over
half is more than 0.5 m off.

**2. Pool decks.** The north pool deck is **+0.80 m** and the south pool deck +0.11 m. The model
has all three courtyard pools level at zero. The main pool deck is −2.87 m against the model's
−3.00 m, which is right.

**3. The photo "roof height" finding was ground, not roofs.** `docs/reviews/photo-camera-alignment`
measured the north-pool parapets 1.0–1.2 m above the model's roofs, relative to the pool. The
survey agrees with that relative to the pool:
- The tall house (`6165501UF1366N_part5`) has its roof at 6.8 m above the north deck, with the
  highest roof points at 7.3–7.8 m.
- The east block (`6266601UF1366N_part4`) is at 6.3 m, with highest points at 6.9–7.4 m.

Relative to their own ground, though, both are ordinary two-storey houses: 5.5–5.9 m at the
median, 5.9–6.3 m at the highest roof points. The error is the ground. The north deck stands
0.8 m higher than the model puts it, and both houses' ground stands about 1.2 m higher.

**4. Storey heights, resort-wide (163 buildings).**

| Storeys | Buildings | Model | Survey, median roof | Survey, high roof points |
| --- | --- | --- | --- | --- |
| 1 | 108 | 3.0 m | 3.7 m | 4.1 m |
| 2 | 45 | 6.0 m | 5.9 m | 6.6 m |
| 3 | 10 | 9.0 m | 8.3 m | 8.4 m |

Two-storey houses are right. Single storeys are about 0.7 m too low and three storeys about 0.7 m
too high, so a flat 3 m per storey is a fair first rule but not the real one.

**5. Calle Guillermo.** Along the mapped street the survey stays at about −0.2 to −0.4 m to its
end. The main-pool lawn beside it lies 2.5 m lower behind a sharp edge, most likely a retaining
wall. The survey's fall to the paseo begins south of the mapped street's end. The model drops
the street 3 m over its last 15 m, which the survey does not show there.

**6. Photo-read level changes** (`data/levels_survey.json`, the 7 items with comparison points):
- **Inside the photo range:** the middle-pool south-west and north-west rises (0.53 and 0.52 m),
  the gates (0.04 m) and the upper Cervantes lane (0.10 m).
- **Dalí apron:** surveys 0.11 m over its range.
- **Cervantes ramp and steps:** survey at about half the photo-read rise (0.21–0.22 m against
  0.4–0.5 m). Either the comparison points do not straddle the whole rise, or the 1 m grid
  smooths a 3 m ramp. Worth a look on the spot.

**7. Plan position.** The registry footprints best fit the surveyed roofs when moved 0.25 m east
and 1.5 m north, but the fit barely improves (0.404 against 0.385). The 2014–15 grid is 2 m and
pixel-is-point, so a 1 m shift is within its own uncertainty. Comparing the Esri aerial with the
IGN orthophoto (PNOA) gave 1–1.5 m with no consistent direction. The plan layout is good to about
a metre; the large errors are vertical.

## Limits

- The ground model interpolates under buildings and over pools; those cells are left out.
- A 1 m grid softens steps and short ramps; a 2 m grid softens roof edges and misses thin parapets.
- The two surveys are about six years apart. Their ground under the middle pool deck agrees to
  0.05 m (5.00 against 5.05 m).
- Survey heights are ground and roof surfaces, not floor levels, door sills or parapet tops.
- These are measurements, not placement approvals (`docs/PLACEMENT_VERIFICATION.md`). This
  report changed no geometry; `terrain-from-lidar` then rebuilt the ground from it.

Sources: PNOA-LiDAR © Instituto Geográfico Nacional de España (CC BY 4.0), via REDIAM, Junta de
Andalucía. REDIAM's own terms for this folder were not found; only derived maps and numbers are
published here.
