# The forecourt by the pool building: 90 MILES building, garden wall, grey containers

Task `picasso-beach-forecourt-buildings` (package 3 in `docs/PICASSO_SOUTH_HANDOVER.md`). The forecourt is where
Calle Pintor Picasso passes the hotel's low block (registry `6465301UF1366N_part2`) and the pool building
(registry `6364501UF1366S`), around x -10..8, z 45..68. Data: `data/picasso_forecourt.json`; code:
`src/picasso-forecourt.ts`; check: `scripts/check_picasso_forecourt.py`. Everything is graded `estimated`: no camera
here is solved.

## Stage 1: photo coverage

| Camera | Pin (x, z) ± m | Lens | Sees |
| --- | --- | --- | --- |
| IMG_3118 | (7.7, 73.9) ± 7.5 | 26 mm | North-west from the lane's north end: the 90 MILES block and the tower on the left, the low block, garden wall and vans on the right |
| IMG_3119 | (6.5, 69.6) ± 4.2 | 52 mm | North-west: the grey containers in front of the low block, the garden wall; the utility row about 50 m off |
| IMG_3105, IMG_3106 | (-36.1, 21.6), (-31.1, 27.2) ± 4.7 | 26 mm | South-east down the road: the low block's road face, the containers beyond its corner, the tower |

One pin fixes a direction, not a depth. Depths here come from apparent size and the distance of a foot below the
horizon (eye height 1.6 m), good to about 20 %, and from the survey. Nothing is seen square-on: photo request
`picasso-forecourt-square-on` is added; `picasso-service-road-to-beach` stays open.

## What the photos show (and two corrections to the brief)

- **The "utility sheds with brown doors" in IMG_3119 are not on the forecourt.** Read at full size (x 385-640), they are
  a dark slatted fence, a white box with a grey meter panel, a dark recess and a kiosk with three maroon louvred doors:
  the utility row's slatted gate, meter box, recessed grey gate and Ormazabal substation, already built
  (`data/picasso_service_frontage.json`). Their bearing from the pin, about 314°, is the bearing of the substation
  (-30, 34), 51 m away; beyond them the white wall with a green door receding to the right is the bin store's street face
  and the long car-park wall (bearings 317-325°).
- **The white shed behind the grey containers is the hotel's low block.** Its flat, overhanging slab roof, louvre and
  pipe railing match the low block's road face in IMG_3105 (x 380-580), and the registry corner (-9.9, 48.2) falls at
  x ≈ 705 in IMG_3119, just left of the containers. Its height from the photo, about 3.1 m above the road, matches the
  survey's 1.4-2.2 m over the datum. It already stands in the model.
- **The forecourt is otherwise open.** The 2014-15 surface model reads ground (-1.0 to -1.5 m) everywhere on it between
  x -6 and 8, z 54 and 67. The aerial's marks at (2.5-6, 60-66) are parked cars (IMG_3118 has vans there, about 16 m from
  the pin), and an L-shaped low wall or kerb at (2-5, 55.5-59) is hidden behind them in every photo. That is recorded as
  `gap:picasso-forecourt-east-enclosure`, not built.
- **The 90 MILES building is the pool building's road end.** IMG_3118's face left of the tower (x 0-280, bearings
  288-300°) meets the south-east edge of registry part `6364501UF1366S_part5` 19-20 m from the pin; the face's right-hand
  corner is within about 3° of the registry corner (-7.3, 64.1), and the tower stands about 10 m behind it. The survey
  has a band 2-3 m deep along that edge from x -8 to -16.5 at 5.6-5.7 m over the datum, against 4.2 m for the rest of
  the pool building and -1.0 to -1.2 m on the road. IMG_3118's roofline, scaled by the tower's surveyed top, gives about
  5.5 m. So the block is about 6.7 m above the forecourt; the registry gives the part one storey and the model draws it
  at about 3.4 m.

## Layout (built, estimated)

| Piece | Where | From |
| --- | --- | --- |
| 90 MILES upper block (`picasso-90-miles-upper`) | 3 m deep along part 5's south-east edge, (-7.3, 64.1) to (-16.8, 69.8), from the model's roof of part 5 to 5.6 m over the datum (+0.27 m paving lift, as the tower) | IMG_3118 bearings; survey band; registry ring unchanged |
| Garden wall (`picasso-forecourt-garden-wall`) | 1.5 m white wall (-5.2, 50.6), (-2.6, 52.2), (1.0, 52.0), 0.35 m outside the forecourt asphalt | IMG_3119 x 980-1200 (bearing 329°, 21-25 m); IMG_3118 x 820-1080; survey cells (-4, 50) and (-2, 52) about 0.8 m above the ground; the aerial's pale band along the plane-tree garden |

## Show details

| Piece | Where | From |
| --- | --- | --- |
| 90 MILES sign (`picasso-90-miles-sign`) | Black board 1.8 × 0.9 m, 1.6 m from the block's north-east corner, just under the parapet | IMG_3118 x 183-275 |
| Grey containers (`picasso-forecourt-containers`) | Two 1.5 × 1.1 × 1.45 m wheeled containers at (-8.0, 48.9) and (-6.6, 49.6), about 1.8 m in front of the low block's south-east face | IMG_3119 x 735-905 (bearing about 325°, 23-28 m by size and horizon), IMG_3118 x 715-790, IMG_3105 x 580-645 |

## Not built (gaps and follow-ups)

- `gap:picasso-90-miles-front` and task `picasso-90-miles-front`: the one-storey front with the black awning and menu
  board and the white stepped-parapet wall with a door (IMG_3118) stand on registry part `6364501UF1366S_part4`. The model
  draws part 4 from its centroid's ground, about 2.8 m below the road (roof about 0.2 m over the datum), while the survey
  reads 3.2-3.3 m and 0.7-1.4 m there. Changing a registry part's level is a levels task of its own.
- `gap:picasso-forecourt-east-enclosure`: the low walls and parking on the east side, south of the garden.
- How the garden wall ends at the low block (IMG_3119 shows a black grille gate between them) and at its east end.
- The low block's pipe railing and the vans.

## Renders

Pairs: the photo on the left, an Inspect render from the phone pin on the right. They are diagnostics, not
measurements (unsolved pins; the render's field of view is wider than the photo's).

| Photo | Before | Layout after | Show details after |
| --- | --- | --- | --- |
| IMG_3118 | [pair](IMG_3118-before-pair.jpg) | [pair](IMG_3118-layout-pair.jpg) | [pair](IMG_3118-details-pair.jpg) |
| IMG_3119 | [pair](IMG_3119-before-pair.jpg) | [pair](IMG_3119-layout-pair.jpg) | [pair](IMG_3119-details-pair.jpg) |
| IMG_3105 | [pair](IMG_3105-before-pair.jpg) | [pair](IMG_3105-layout-pair.jpg) | [pair](IMG_3105-details-pair.jpg) |

Inspect: [oblique, Layout](fc-oblique-layout.png), [oblique, Show details](fc-oblique-details.png),
[overhead, Layout](fc-over-layout.png), [containers close, Show details](fc-containers-details.png).

`scripts/shoot_inspect.cjs` takes map coordinates (x east, z south), not the turned frame its header used to claim;
the header and the slice.ts comment are corrected. Show details took about 3 minutes to load on the shared machine,
longer than `shoot_views.cjs`'s 120 s wait, so the details renders were taken with the same URLs and a longer wait.

## Checks

- `scripts/check_picasso_forecourt.py` (new): the upper block stays on its registry building at the surveyed top, the
  garden wall keeps off the forecourt asphalt, the road and every house, the containers stand clear of the road ribbon,
  houses and wall, and every piece has photo evidence, an `estimated` confidence entry and the gaps.
- `check_picasso_beach_lane.py`, `check_picasso_service_frontage.py`, `check_picasso_service_road.py`,
  `check_ground_plan.py`, `check_street_layout.py`, `npm run build`, `build_references.py --check`: see the task's
  report.

## Independent review

**Not yet reviewed.** The building agent could not start a subagent; the coordinator runs the independent review from
this packet. Until a reviewer that did not make the change signs off, the task stays `in-progress`.

Review packet (please sign off or list errors):

1. Full-size photos: `public/photos-ref/IMG_3118.jpg`, `IMG_3119.jpg`, `IMG_3105.jpg`, `IMG_3106.jpg` (1200 × 1600).
   Lenses: IMG_3118, 3105, 3106 26 mm equivalent (focal about 1200 px across the 1200 px width); IMG_3119 52 mm (about
   2400 px). Pins and headings in `public/photos-ref/manifest.json`.
2. Aerial: `public/map/ground.jpg` with bounds in `public/map/ground.json` (about 0.24 m per pixel); crop x -26..16,
   z 42..76. Survey: `python3 scripts/lidar_grid.py -26 16 42 76 1 --surface` (tiles in `layout-checks.local/lidar`).
3. Data and code: `data/picasso_forecourt.json`, `src/picasso-forecourt.ts`, the confidence entries and the two new gaps
   in `data/confidence.json`, registry parts `6364501UF1366S_part4`/`part5` and `6465301UF1366N_part2` in
   `public/map/skeleton.json`.
4. Renders in this folder: before/after pairs per photo, the Inspect oblique (Layout and Show details), the overhead
   and the containers close-up.

Questions for the reviewer:

- Are the brown-door sheds in IMG_3119 the utility row (about 50 m), and the slab-roofed shed behind the containers the
  hotel's low block, as argued above? If not, where do they stand?
- Is the 90 MILES face on part 5's south-east edge, and is a 3 m-deep upper block to 5.6 m over the datum the right
  reading of the survey band and IMG_3118?
- Does the garden wall's line (-5.2, 50.6) → (-2.6, 52.2) → (1.0, 52.0) and 1.5 m height fit IMG_3119 / IMG_3118 and
  the aerial, and is it right to leave it off the forecourt asphalt?
- Do the containers' positions agree with IMG_3119, IMG_3118 and IMG_3105 within their stated 2-3 m?
- Anything built that the photos do not support, or anything plainly there that should be `inferred` instead of left
  out?

## Independent review: APPROVED (27 Nov 2026)

A reviewer subagent that did not make the change checked the full-size photos, the pairs and Inspect renders, the
aerial, the registry rings and the 2015 surface model:
- The reinterpretation stands. IMG_3119's brown-door "sheds" are the utility row about 45-50 m away (substation
  bearing 314° from the pin); the slab-roofed shed behind the containers is the hotel's low block; nothing stands on
  the forecourt between x -6..8, z 54..67 apart from car and tree spikes.
- The 90 MILES upper block: IMG_3118 puts the face's corner at about 300°, against the registry corner's 303°; the
  surface band at 5.60-5.67 m supports the 5.6 m top. The aerial's shadow line about 1.5 m inside the edge suggests
  3 m may be slightly deep; the depth is recorded as judged.
- The garden wall measures 1.3-1.5 m in the photos and follows the aerial's pale band, off the asphalt.
- Grading (`estimated`), gaps, the new task and the photo request are honest; the wiring only adds the module.

Minor, left open: the two containers may stand about 1.5 m further south-west, at the low block's south corner
(within their stated 2-3 m); task `picasso-90-miles-front` should name registry part 4 as its subject.
