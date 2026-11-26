# Independent review: Calle de Picasso raised grass strip and retaining wall

Reviewer: independent reviewer subagent (did not make the change), 26 November 2026.
Branch `claude/calle-picasso-path-ramps-9boalk`, commit f6c65bd8 on origin/main 2bf1821e.
Scope: `picasso_west_lawn.json:picasso-west-lawn`, the terrain hold in `scripts/lidar_check.py grid`
and its 103 cells in `data/terrain.json`, and `street_layout.json mainParkingRing` west edge (3.1 m).

**Verdict: layout APPROVED WITH NOTES (the records must be corrected, see finding 1); levels APPROVED.**

The frame throughout is the author's: s metres along the bays' car line from (-110.2, -57.2) towards
(-61.5, 26.3), w metres west of it. Survey heights are model metres above datum 5.05 m (median of the
2020-21 1 m ground model within 4 m of the middle pool ring, recomputed: 5.050).

## What I checked

1. **Laser survey (PNOA-LiDAR 2020-21 MDT 1 m; 2014-15 MDT/MDS 2 m).** Cross-profiles every 3 m,
   each a median over ±1-1.5 m along s, from w -2 to 14 m.
2. **Aerial** (`public/map/ground.jpg`, 4.16 px/m, georef `ground.json`): brightness and greenness
   (G - (R+B)/2) profiles on the same stations, and a straightened crop with lines at 0, 3.1, 3.3 and 4.0 m.
3. **Survey-to-aerial registration here:** the round island (aerial edges x -61.3, x -50.3, z 15.7).
4. **Model:** `site_y` from `scripts/check_terrain.py` every 0.5 m along each span; terrain diff cell by cell.
5. **Checks** and the Inspect image; the records.

## Numbers

### Heights (survey, strip middle w≈5.5 minus car park at w 0.5)

| s | step | | s | step |
| --- | --- | --- | --- | --- |
| 0-3 | -0.02-0.10 | | 33-72 | 0.43-0.57 |
| 6-15 | 0.24-0.51 | | 75-78 (Cervantes) | 0.21-0.24 |
| 18-27 | 0.57-0.77 | | 81-105 | 0.19-0.26 |
| 30-31.5 | 0.80-0.87 (most, just north of the upper drop) | | | |

The author's 0.84 m about s 30, 0.45-0.6 m in the middle and 0.1-0.3 m south of Cervantes are right.
The strip stands at the path's level: survey strip minus path -0.05 to +0.10 m (up to +0.1 near the wall
top at s 7-25). The strip's drop at the upper flight is centred about s 32.5, 0.5-1 m south of the
path's (s 31.5-32); the grass, which follows the path, is within that.

### Where the level changes (wall line)

| Source | North of Cervantes (s 4-73) | South (s 79-104) |
| --- | --- | --- |
| 2020-21 survey, half-height crossing | median **2.9 m** (IQR 2.6-3.0) | median **2.25 m** (2.25-2.6) |
| 2014-15 survey (2 m), half-height | median 2.4 m | |
| Aerial bright-to-dark edge | median **4.0 m** (IQR 3.75-4.3) | median **3.1 m** (3.1-3.1) |
| Aerial green edge | median 4.1 m (3.9-4.25) | median 3.1 m (2.9-3.75) |
| Model wall face | 3.1 m | 3.1 m |

Survey-to-aerial registration at the island, about 60 m east: west edge x -61.25 (aerial -61.3), east edge
about -50.9 (aerial -50.3), south edge z 15.1 (aerial 15.7), so the two agree to about 0.2-0.6 m here. The
resort-wide roof fit (0.25 m E, 1.5 m N, docs/reviews/lidar-levels) would explain a 0.97 m offset along w, but
along s the survey's Cervantes drop (s 74.3) and the aerial's gap edge (s 73.6-74.0) do not show its
predicted 1.2 m shift, so I do not rely on it.

### Model (`site_y`)

- Car park from w 0.5 m to the wall foot (w 3.05) varies at most **0.11 m** inside the spans (2 m from
  their ends): the asphalt meets the wall foot level.
- Terrain under the grass is everywhere at least **0.14 m** below the grass top: nothing pokes through.
- Wall height above the drawn asphalt: 0.15 (s 6), 0.51 (s 18), **0.76 (s 30)**, 0.43-0.56 (s 36-72),
  0.08-0.25 (s 84-102). At s 84-90 it is about 0.1 m under the survey's 0.19-0.23 because the model's car
  park reads about 6 cm high there; within tolerance.
- Cervantes gap: the hold's 2 m blend pulls the gap's ground at w 1.6-4.6 part way down, leaving a
  0.22 m fall over about 4 m from the lane to the car park. Acceptable.
- `data/terrain.json`: exactly **103 cells** differ from origin/main, all within s -0.9 to 106.8 and
  w 0.6 to 4.5. No other cell changed. One cell at (s 86.9, w 4.2) rose 0.06 m instead of falling; it is
  under the grass and harmless.

### Checks run (all pass)

`check_picasso_west_lawn.py` (103 stations, wall up to 0.79 m), `check_terrain.py`, `check_street_layout.py`,
`check_boundary_reference.py`, `check_map.py` (105 objects, 0 problems), `build_references.py --check`
(683 references, 0 problems), `test_confidence.py` (5 OK), `npx tsc --noEmit` (clean).

## Findings, most important first

1. **North of Cervantes the aerial shows pale ground, not grass, between the model's wall and a
   straight green edge about 0.9 m further west (records need correcting).** Over s 5-70 the aerial
   is asphalt-bright with no green (greenness about that of the car park) from the car rears out to a
   straight edge at w 3.75-4.3 m (median 4.0), with a bright line at w 3.5-4.0 in several profiles (the
   earlier trace's "thin white kerb line at about 4.3 m"). So the model's wall (3.1-3.3 m) and the first
   0.6-0.8 m of its grass (3.3-3.9 m) sit where the aerial shows something pale. Both surveys put the level
   change east of 3.1 m (2.4-2.9 m), and the survey and aerial agree to about 0.5 m at the island. The same
   difference of about 0.9 m shows south of Cervantes, where the aerial edge (3.1 m) matches the model and
   the survey reads 2.25 m. So 3.1 m is a fair line for the level change (between the two sources, within
   each one's uncertainty). What fills the pale 0.7-0.9 m band is open: a wide coping, a paved verge on top
   of the wall, or a pale sloping bank. **The records are not accurate about this.** `data/picasso_west_lawn.json`
   `trust` and the README say "the aerial shows dark green hedge or shrub canopy overhanging to 3.5-4.5 m and no
   clear coping line". The edge is straight over 65 m, not a canopy outline. Canopy hanging over the wall
   would also put the wall at or west of that edge, not 0.9 m east of it. **Required:** rewrite that sentence to
   give the aerial edge (about 4.0 m north of Cervantes, 3.1 m south) and the survey's level change
   (2.4-2.9 m north, 2.25 m south), and add the pale band as an open item in discrepancy
   `picasso-west-path-open-levels` and photo request `picasso-west-path-drops`. Do not move the geometry
   until a photo settles it.
2. **Minor, south end:** the survey and aerial show the raised, green strip (0.15-0.2 m above the ground
   east of it) continuing past the span's end at s 105.5 to about s 112-115. Something 0.3-0.76 m high
   stands at s 106-110, w 2-3. The model closes the strip with an end face at the car park's south corner.
   Record it as a gap or an open item. It does not block this change.
3. **Minor, Cervantes gap:** the aerial's pale crossing starts at s 73.6-74.0 and the survey's drop is at
   s 74.3. The model's gap runs from 74.5 to 78.5 (the aerial ends about 78.2), so the gap is 0.3-0.9 m
   south of the aerial at its north end. Within tolerance.
4. **Note, hedge:** the 2014-15 surface model (MDS minus MDT, 2 m) shows nothing above 0.4 m on the strip
   at w 3-6, apart from trees at about s 9-21, s 45 and s 105. That supports a grass strip with no hedge
   along the wall top, and is worth adding to the trust text in place of "whether a hedge stands on it is
   not seen".
5. **Levels:** no issues. The heights, the strip at the path's level, the car park level to the wall
   foot, the grass above the terrain, and the terrain change limited to the strip all check out.

## Inspect image

`inspect-grass-strip.jpg` (Layout) looks sensible. It shows a level car park up to a white wall, the raised
grass at the path's level stepping down with the upper flight, and the strip broken at Cervantes. The wall
reads clearly in Layout. Nothing generic is added.

## Records

Graded `inferred` with empty `evidence`, and every record says it is not photographed. That is honest and
not overclaimed, apart from the aerial sentence in finding 1, which must be corrected. Listing the strip in
build_queue, areas.json and the feature inventory is consistent.
