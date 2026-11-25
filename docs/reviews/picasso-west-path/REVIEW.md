# Independent review: Calle de Picasso west footpath (task `picasso-west-path`)

Reviewer: a Claude subagent that did not make the change. Reviewed 25 Nov 2026 on branch
`claude/calle-picasso-path-ramps-9boalk` (commits b92152f, 912d157 on origin/main). I measured from the sources
myself rather than checking the author's numbers: the aerial `public/map/ground.jpg` (`ground.json`), Google 3D
top-down `reference/google-maps/05`, IMG_3131, IMG_3134, and the PNOA-LiDAR 2020-21 1 m ground model (plus
2014-15) through `scripts/lidar_check.py` `Survey`.

## What I checked

1. **Layout.** I built my own straightened aerial strip along the west bay car line (-110.2,-57.2) to (-61.5,26.3)
   at 0.06 m sampling, s from -15 to 112 m and o (metres west of the car line) from -4 to 16 m. I looked at it in
   30 m segments with s/o ticks and took per-station profiles of "paleness" (brightness less greenness), 3 m
   windows every 1 m. The band centre is the midpoint of the half-maximum in o 6.0-10.3. I kept only stations
   with a clear peak 0.9-2.6 m wide; ones where the window caught a house wall or tree shadow are left out.
   Separately I checked green onset (hedge strip) for the car-park edge, the Google 3D top-down view at the north
   end (registered at 0.0385 m/px, long wall north end (-91.4,-67.8) at pixel about (1430,375)), IMG_3131 and
   IMG_3134 for the path mouth and the Juan Gris walls, and the south end against Calle Eva.
2. **Levels.** I sampled the 2021 survey every 0.5 m along the new centreline, 0.6 m to either side, and the 2015
   survey on the centreline. Datum 5.05 m (`terrain.json`). I compared these with the model `site_y` (copied from
   `check_terrain.py`), and the flights' foot, run, base and rise with the survey. I also took cross-sections from
   the bays to the house gardens at s = 10, 30, 50, 70 and 90.
3. **Checks run.** Results below.
4. **Inspect renders.** I looked at all four `inspect-*.jpg` images.
5. **Records.** I read confidence, discrepancies, photo and evidence requests, the build queue, the lane-wall and
   planter bases, and the README.

## My measurements

### Path centreline on the aerial (o metres west of the car line; author's line is o = 8.41 - 0.01 s)

72 accepted stations from s = -5 to 107: **mean residual -0.12 m** (the band is slightly east of the line),
**rms 0.38 m**. A free linear fit gives o = 8.14 - 0.007 s, rms 0.34 m. The worst stretches are s 24-28 (-0.94 m,
where a tree shadow narrows the band), s 50-55 (-0.5 to -0.57 m) and s 68-70 (+0.6 to +0.8 m). Everywhere else it
is within 0.5 m. **Median half-max width 1.62 m** (1.0-2.4 m). Half-max under-reads a blurred band, so 1.8 m is
plausible. Order from the bays westward: back of bays and kerb, then hedge strip from o ≈ 3.5-4.5 to ≈ 7-7.5, then
the pale band, then the garden walls at o ≈ 9.5-10. This confirms the author's reading.

### North end (Google 3D top-down, registered at about 1.5 m)

The house-side path between the garden walls and the lawn strip, read at three points, is at
(-118.31,-56.83), (-116.81,-53.94) and (-115.08,-51.05). That is **o = 7.19, 7.35 and 7.31 at s = -3.8, -0.5 and
+2.9**. The author's line is at 8.44-8.45 there and my aerial reading is 8.2-8.3. So the Google view puts the path
about 1.1 m east of the built line, inside its stated registration error, and the aerial agrees with the author.
The path enters the Juan Gris paving at about (-119.9,-59.7) in the Google view (s -7.1). The built end is
(-121.87,-60.35) (s -8.6), within about 1.5 m.

IMG_3131 shows the terracotta path behind the lawn and plinth running past the lantern into the paving at the foot
of the Juan Gris walls, **with nothing across it**. The old `juan-gris-east-screen` stood at s ≈ -7.8 from
o = 6.45 to 9.58, right across the path (o 7.6-9.4). The new screen spans o = 9.59 to 12.7 at the same s, just
west of the path's west edge. The slide is justified and better than before.

### Car-park west edge

Median green onset is between o = 3.5 and 4.5 in every 10 m window. In s 74.5-78.5 the hedge strip shows no green
from o 1.5 to 6.5 (the Cervantes crossing), which confirms the notch at 74.5-78.5 out to 6.2 m. The ring vertices
convert exactly to o = 4.0 and 6.2 at s = 1.4, 74.5, 78.5 and 105.7.

The survey, however, puts the bank at the back of the bays slightly further east than o = 4:

| s | o = 1 | o = 2 | o = 3 | o = 4 | o = 5 |
| --- | --- | --- | --- | --- | --- |
| 30 | +0.39 | +0.39 | +0.93 | +1.18 | +1.22 |
| 50 | +0.19 | +0.34 | +0.58 | +0.69 | +0.66 |
| 70 | +0.09 | +0.43 | +0.62 | +0.66 | +0.65 |

So the asphalt outline probably runs about 0.5-1.5 m up the bank (see finding 2). The bank heights match the
"0.4-0.9 m" in the discrepancy: 0.35 m at s 10, 0.85 m at s 30, 0.55 m at s 50, 0.65 m at s 70 and 0.4 m at s 90.

### Levels along the path (2021 survey minus datum; t = metres from the north end)

| Stretch | Survey 2021 | Model `site_y` |
| --- | --- | --- |
| t 0-39.0 | +1.09 to +1.20 (t 0 +1.09 at the paving edge) | +1.13 to +1.18 |
| drop t 39.0 → 41.5 | +1.17 → +0.72 (**0.45 m**); 2015 survey drops at t 37.5-38 (about 1.5 m north) | +1.16 → +0.71 |
| t 41.5-80.0 | +0.73 falling to +0.60-0.65 | +0.72 → +0.63 |
| drop t 80.0 → 84.0 | +0.64 → +0.52 (80.5-81.5) → +0.37 (82) → +0.26 (83-83.5) → +0.22 (84) (**0.42 m**) | +0.64 → +0.22, linear 80.7-83.5 |
| t 84-124 | +0.12 to +0.22 | +0.15 to +0.22 |
| t 124-126 | +0.13 → -0.03 (the dip before Calle Eva, not built) | +0.10 → 0.00 |

Model minus survey on the centreline is within ±0.05 m except +0.07 at t 0 (the paving edge), +0.08 at t 82 and
t 106 (1 m-pixel steps).

Flights against the survey:

- Upper flight: foot t = 41.40, top 41.40 - 2.4 = 39.0. This matches the survey's break exactly.
- Cervantes flight: foot t = 83.51, top 80.71. The survey's drop runs from 80.0 to 84.0 on 1 m pixels, so this fits.
  Calle Cervantes crosses at t 85.2, 1.7 m beyond the foot, as claimed.
- Comparison points: survey low and high are +0.710 and +1.160 (rise 0.450) for the upper flight, and +0.220 and
  +0.640 (rise 0.420) for the Cervantes flight. They match `terrain.json` (base 0.71 and 0.22; rise 0.45 and 0.42)
  and fall inside each flight's `rise` range.
- Both flights run exactly along the path (direction · path = -1.000) and sit on the centreline (offset ≤ 0.003 m).
- Side: `across` [-0.86, -0.02] is drawn on side = (-up_z, up_x) in both `src/ramp-steps.ts` and `check_terrain.py`.
  With uphill pointing north-north-west, negative is the west (house) half, as stated. This is the same convention
  as the existing flights.
- Treads are about 0.15 m (upper) and 0.14 m (Cervantes) per riser; the ramp pitch is 19 % and 15 %.

Thuja planter: its trimmed east corners (-79.57,12.54) and (-79.98,11.85) are 1.02 m from the path centreline, so
0.12 m off the path edge, as claimed.

## Checks

All pass:

- `check_street_layout.py`
- `check_boundary_reference.py`
- `check_terrain.py`: includes the new climb, tread-above-ramp and level-either-side asserts
- `check_levels.py`: 26 items
- `check_lane_walls.py`
- `check_cervantes_lane_edges.py`
- `build_references.py --check`: 683 references, 0 problems
- `test_confidence.py`: 5 OK
- `test_reference_index.py`: 17 OK
- `npx tsc --noEmit`

`check_placement_changes.py --base origin/main` **fails**, as expected for unverified geometry. It flags:
`street:picasso-access`, both `steps:picasso-path-*`, `parking:Picasso car park`, `juan-gris-east-hedge/screen`, and
also `jorge-patio-wall-124`, `juan-gris-middle/grille/west-bed` and four `middle_pool_north.json` items. Those
others look like file-level or terrain-level knock-ons. The PR must say this.

## Findings, most severe first

1. **North-end mismatch with the lawn strip (minor, layout).** At s -4 to +3 the path is about 1.1 m west of where
   the registered Google top-down view puts the house-side path (o 7.2-7.35 against 8.45). The aerial supports the
   author (8.2-8.3). The lawn strip polygon (`ground_plan_picasso.json picasso-west-lawn-strip`, west edge
   o 6.6-7.4, drawn from that Google view) therefore leaves a 0.2-1.0 m generic terracotta gap before the path's
   east edge (o 7.6). In IMG_3131 the path runs right against the lawn. This is within the stated 1.5 m
   registration. Reconcile the two when the north entrance is next re-traced: widen the lawn strip west, or record
   the 1 m offset in the discrepancy.
2. **Car-park west edge vs the survey bank (minor, layout and levels).** The aerial supports o = 4.0 (green onset
   3.5-4.5), but the survey's rise from the bays to the hedge strip is mostly between o ≈ 1.5 and 3.5. The asphalt
   outline may therefore run 0.5-1.5 m up the unbuilt bank. It is already covered by the open edge in
   `picasso-west-path-open-levels`; add the o ≈ 2.5-3.5 survey reading there.
3. **Juan Gris hedge "slid" is not what was done (minor, records).** `juan-gris-east-hedge` kept its west end
   (-126.8,-56.581) and only its east end moved, so it shrank from 5.07 m to 1.94 m. The hedge's own basis says this
   correctly; the README ("It and the low hedge wall west of it are slid 3.1 m west") and discrepancy
   `juan-gris-east-walls-order` ("both were slid") do not. Fix the wording.
   IMG_3134 (looking south-west along a narrow lane, heading 234) is most likely taken west of the path's mouth.
   It constrains the wall order along Juan Gris, not the mouth itself. The mouth being open rests on IMG_3131 and
   the Google view, which is enough for removing the screen.
4. **No `gaps` entry for what was left out (minor, records).** The garden walls bounding the path's west side
   (white lines at o ≈ 9.5-10 on the aerial; the low hedged wall in IMG_3131) and the retaining edge at the back
   of the bays are not built. They appear only in discrepancies and the README, not in `confidence.json` `gaps`,
   which AGENTS.md asks for. Add them (`needs-photos`).
5. **Upper flight reads weakly in Inspect (minor, visual).** In `inspect-upper-flight.jpg` the flight shows as a
   tilted tiled slab with one white side face. The three risers are hard to make out at 0.15 m. The Cervantes
   flight's three white risers read clearly. In the overview the path is legible only as two white lines through
   generic terracotta (as the README says). The north opening and the plinth, lantern and lawn are clear in
   `inspect-north-end.jpg`.
6. **Placement gate red (information).** See Checks. It is not caused by a bypass; record it in the PR comment.

Grades and honesty: the path and both flights are `inferred`. The flights' whys say plainly that the drop and its
position come from the survey and the step form, number and side are guesses. Nothing is graded photographed or
estimated beyond what the sources support. "0.45 m rms" in the records is the author's figure; mine is 0.38 m rms
with a -0.12 m bias, consistent with it. The README's statement that the cm terrain grid is untouched is true:
only the two `ramps` entries were added, and the base and rise reproduce from the survey.

## Verdict

- **Layout: APPROVED WITH NOTES.** Centreline within 0.38 m rms (max about 0.9 m locally) of my independent aerial
  trace; 1.8 m width plausible; car-park west edge on the aerial's hedge line with the Cervantes notch confirmed;
  the Juan Gris screen slide is justified and better than before. Notes 1-4 to tidy.
- **Levels: APPROVED WITH NOTES.** Three level stretches and both drops (0.45 m at t 39.0-41.4; 0.42 m at
  t 80.7-83.5) match the 2021 survey to ±0.05 m on the path. The flights are on the stated (house) side and every
  tread is above the ramp (`check_terrain.py` passes). The step form remains a recorded guess pending photo request
  `picasso-west-path-drops`.

Overall: **APPROVED WITH NOTES.**
