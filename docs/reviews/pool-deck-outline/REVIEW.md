# Review: north pool ring tongues (measured-north-pool-ring-tongues)

Reviewer: a second agent that did not make the change (reviewer-subagent-rv7k2p), 2026-11-15.
**Verdict: approved-with-notes.** The correction meets Dave's measured-approval rule and is clearly
closer to the photos than the registry ring. The notes below record the limits and two problems that
were already there before this change. None of them blocks approval.

## What I inspected

- The full-size photos `public/photos-ref/IMG_2204.jpg`, `IMG_2205.jpg` and `IMG_2206.jpg`. I looked at
  the whole frames, then at 4–8× zooms with a pixel grid on both tongues, the ladder pocket and the
  ladder recess.
- The overlays `ring-IMG_2204.jpg`, `ring-IMG_2205.jpg` and `ring-IMG_2206.jpg`, at the same zooms
  and side by side with the raw photos.
- The before and after renders `IMG_220{4,5,6}-{before,after}.png`, cropped to the same regions as
  the photos.
- `ring-residuals.json` (per pick), `README.md`, `data/pool_ring_corrections.json`, the o2, o3 and o4
  entries in `data/objects.json`, the north pool in `public/map/skeleton.json`,
  `scripts/measure_pool_ring.py` and the `pool_ladder` and `pump_box` code in `src/slice.ts`.

## Residuals confirmed

`python3 scripts/measure_pool_ring.py` (report only) reproduces the README and the record exactly:

| picks | n | rms after | worst after |
| --- | --- | --- | --- |
| fit | 39 | 0.14 m | 0.29 m |
| held-out | 9 | 0.18 m | 0.28 m |
| unchanged | 19 | 0.25 m | 0.43 m |

Per camera, the after values are 2204 fit 0.16 / held-out 0.21, 2205 0.09 / 0.09 and 2206 0.16 / 0.28 (one
point). `python3 scripts/measure_pool_decks.py` also matches the README: the deck fit is 0.18 m rms
(worst 0.53 m) and the aerial check 0.39 m.

I also checked the following:
- The ring in `skeleton.json` matches `correct_pool_ring` and `smooth_ring` to within 0.009 m.
- The corrected ring does not cross itself.
- The deck polygon contains every ring point, with at least 1.18 m of deck all round.
- o2 and o3 sit on the new ring, 0.004 m and 0.014 m from it.
- All 13 artifact sha256 values in the record match the files.

## Pick spot-checks (16 picks, 8× zoom with a crosshair)

| photo | pixel | role | result |
| --- | --- | --- | --- |
| 2205 | (404.25, 820) | fit, east corner | on the coping nose's water edge |
| 2205 | (550, 739.5) | fit, east north end | on the tongue's north-east corner |
| 2205 | (586, 724) | fit, pocket | on the pocket's east corner, at the coping edge |
| 2205 | (500, 767.5) | held-out, east edge | on the edge |
| 2205 | (137, 896.25) | fit, SW NE corner | on the corner |
| 2205 | (107.5, 895), (130, 907.5), (96, 940) | fit, SW tongue | on the edge; (110, 927.5) is about 2 px onto the deck, which is negligible |
| 2205 | (82.5, 897.5) | held-out, SW north edge | **not on a visible edge**: it lies over the ladder recess, interpolated along the coping line (see note 2) |
| 2204 | (1236.7, 730) | fit, pocket | on the pocket corner |
| 2204 | (1145, 758.75) | held-out, east edge | on the edge |
| 2204 | (817, 817), (738, 794), (713, 811), (770, 809) | fit / held-out, SW tongue | on the edge and corners |
| 2204 | (688, 828) | fit, SW west face | on the edge exactly where a life ring starts to hide it; acceptable but marginal |
| 2206 | (1551.25, 907.5), (1470, 871), (1380, 887.5) | fit, SW tongue | on the corner, at the recess, and at the west face's visible end |
| 2206 | (1491.7, 883) | held-out, SW north edge | **interpolated over the recess** (see note 2) |
| 2206 | (1512.5, 897.5) | excluded | correctly excluded |

## Visual findings

- **East tongue:** in IMG_2204 and IMG_2205 the photo shows one straight coping run from a sharp nose
  to the north end, then a ladder pocket.
  - Red (registry) stops about 0.6 m short with a round nose. It also puts the pocket floor on the
    deck where the ladder's feet stand.
  - Yellow follows the coping along the whole run and turns at the nose. In IMG_2205 it sits within
    about 1–4 px. In IMG_2204 it runs about 4–5 px onto the deck side, which fits that camera's known
    bias.
  - The pocket in yellow matches the photographed notch.
- **SW tongue:** all three photos show a square tongue about 1.4 m wide, with the ladder over its
  north edge. Red draws a round nose about 0.9 m short. Yellow has the right shape and width in every
  camera.
  - IMG_2205: on the edge within a few px.
  - IMG_2204: about 7 px west of the photographed tongue, perpendicular to the west face (about
    0.15 m).
  - IMG_2206: about 10–15 px north and east of the photographed tongue, into the water (about
    0.2–0.28 m).
  - These offsets come from the cameras disagreeing with each other, not from the fit (note 1).
- **Renders, after against before:** both tongues now look square, as in the photos, and the corner
  sits where the photo puts it.
  - The pixel positions of the corners:

    | corner | photo | after render |
    | --- | --- | --- |
    | east corner, IMG_2205 | (405, 820) | (410, 815) |
    | SW north-east corner, IMG_2205 | about (138, 896) | about (136, 898) |
    | SW north-east corner, IMG_2206 | (1550, 905) | about (1570, 907) |

  - There are no water or deck artefacts at the sharp corners. The coping follows the corners
    cleanly, and the deck still surrounds the water.
  - o3 now stands at the pocket and o2 over the SW tongue's north edge, which matches where the photos
    show the ladders. Before the change, o3 stood on the tongue tip, where there is no ladder.
  - The pocket reads weakly in the render. In plan the pocket floor turns only about 19° from the
    tongue edge, which is consistent with the casts, so this is acceptable.

## Notes and limits

1. **The cameras disagree, and there is only one station.** On the SW tongue's north edge the three
   cameras put z at about 22.25 (2204), 22.55 (2205) and 22.8 (2206). That is about 0.25 m from one
   camera to the next and about 0.55 m end to end. The model uses the mean, so every camera stays
   within 0.3 m. The absolute position of that edge is therefore only good to about ±0.25 m, even
   though the shape (square, 1.4 m wide) is consistent across all three cameras. A camera from a
   second station would make this firmer.
2. **The ladder recess is larger than "small", and two held-out picks lie on it.**
   - In IMG_2205 the coping between the rails (x about 48–100 px) is set back to y about 903, while
     the lip on either side is at about 890–895. IMG_2206 shows the same between x 1475 and 1510.
     The recess is about 0.5–0.6 m wide.
   - Excluding it is correct, but the held-out picks 2205 (82.5, 897.5) and 2206 (1491.7, 883) lie
     over it on the interpolated coping line, not on photographed coping.
   - Without those two picks, held-out is n = 7 with 0.17 m rms, worst 0.26 m. The conclusion does
     not change.
3. **Pump box o4 is misplaced. This was already the case before the change, and it is outside this
   change's scope.**
   - o4 (-172.66, 20.19) projects to about x 543 in IMG_2205 and x 1175 in IMG_2204. The photos show
     the box's centre at about x 640 and x 1290.
   - The box's base corners cast to about (-172.0, 19.5) and (-171.5, 20.4) through IMG_2205, and to
     about (-171.9, 19.3) and (-171.2, 20.1) through IMG_2204. The box is about 1 m east of o4.
   - Now that the tongue is longer, the box in the after renders sits close to the tongue's coping,
     where the photos show about 2 m of deck. A follow-up should move it under the same measured
     rule.
4. **The ladders render low. This is the same before and after.** o2 and o3, and the other ladders,
   appear as small arcs just above the coping. The photos show tall goose-neck rails standing on the
   deck. The fitting is placed at `groundY` on the wall point (`src/slice.ts`, `pool_ladder`); it looks
   sunk below deck level or too small. The positions are right; the look is not. This is a follow-up,
   not a defect of this change.
5. **Small trade-offs, reported honestly by the author:** the deck refit is slightly worse than before,
   0.15 → 0.18 m rms against the photos and 0.36 → 0.39 m against the aerial. The SW tongue's west foot
   keeps the registry vertex because strelitzias hide it. This is not a survey.

## Verdict

**approved-with-notes.** The rule is met:
- **Cameras:** at least two solved cameras on each changed edge. The east tongue has IMG_2204 and
  IMG_2205; the SW tongue has all three.
- **Residuals:** 0.14 m rms on the fit picks and 0.18 m on the held-out picks, both under 0.3 m, with
  the worst point (0.29 m) and the held-out points reported.
- **Comparison:** the overlays and the full-size photos show the corrected ring on the real coping
  edge and clearly better than the registry ring.
- **Renders:** the renders show the photographed square tongues with no artefacts at the corners.

Follow-ups, none of them blocking:
- Move o4 to the photographed position.
- Fix the ladder fitting's height or scale.
- Model the ladder recess, or say in the record that it is about 0.5 m wide.
- Get a view from a second station to tighten the absolute position of the SW tongue.

## Pump box o4 (measured-north-pool-pump-box)

Reviewer: reviewer-subagent-rv7k2p, 2026-11-15. **Verdict: approved-with-notes.**

The change moves o4 from (-172.66, 20.19) to (-171.37, 19.45) and turns it 52.6°, using the new
`turn` on pump boxes in `src/slice.ts`.

**What I inspected**
- Gridded 8× zooms of the box in `IMG_2205.jpg` and `IMG_2204.jpg`.
- The model box's base and top projected through both solved cameras.
- `IMG_2204-pumpbox.png` and `IMG_2205-pumpbox.png`, next to the `-after.png` renders and the photos.
- The code diff in `src/slice.ts` and `src/types.ts`.
- o4 in `data/objects.json` and in the skeleton props; the two entries agree.
- The three artifact hashes, which match.

**Picks**
- (591, 805) is on the left face's base corner.
- (629, 826) is on the front base corner, between the plain face and the louvred face.
- **(684, 799) is not the base corner.** It is where the green glass panel's edge crosses the box's
  right vertical edge, about halfway up the box. The other vertical edges are about 36 px tall: the
  left runs 770→806 and the front 793→829. The right edge's top is at about (686, 779), so its base is
  hidden behind the glass at about (684, 813).
  - Cast at deck level, (684, 813) lands at (-170.67, 19.80). The recorded point is (-170.69, 19.30),
    about 0.5 m north of that.
  - The record blames the top-corner misfit on IMG_2204's lean, but the error is mostly this pick.
    IMG_2205's own top-right corner misses by 16 px: the model gives (686, 763), the photo shows
    (686, 779). The "2 px" fit in the limitations holds only for the left corner.

**Independent check**
I picked the visible corners myself: in IMG_2205 the base left and front, and the top left, front and
right; in IMG_2204 the top left (1243, 781), front (1280, 816) and right (1342, 808).

- **The placement as committed:** it misses these by 1.6–15.8 px. That is about 0.02–0.23 m (68 px/m
  in 2205, 79 px/m in 2204), **0.14 m rms, worst 0.23 m**. It is inside the 0.3 m tolerance in both
  cameras.
- **A joint fit to the same corners**, with the model's 1.1 × 0.9 × 0.57 m box: centre about
  (-171.28, 19.62), turn about 40°.
  - It misses by 2–10 px.
  - It differs from the record by 0.19 m in the centre and about 12° in the turn. At the right
    corner the difference is about 0.34 m.

**Visual**
- Both renders now put the box where the photos show it: across about 2 m of deck from the tongue,
  next to the glass fence.
  - IMG_2205: the front corner is at (637, 817) in the render and (630, 830) in the photo.
  - IMG_2204: the render is about 10–15 px left of the photo.
- The box sits on the deck, with no gap or overlap. This is a clear improvement over the old position,
  which crowded the tongue's coping.

**Notes and limits (not blocking)**
1. **Refit before merge, then re-check.** Re-pick the right base corner at about (684, 813), or fit
   the top corners in both cameras; that gives about (-171.28, 19.62) and a turn of about 40°. The
   record's third base point and its explanation of the residual should be corrected. The current
   placement already meets the rule, so this improves it rather than fixing a failure.
2. **Faces:** the photo shows louvres on the front-right face only; the left face is plain. The model
   puts louvres on all four sides. The measured box is about 1.2 m long, against 1.1 m in the model.
3. **Shower post:** the post beside the box is not modelled.

**Re-check of the refit (2026-11-15): approved.** The refit puts o4 at (-171.28, 19.60), turned
40.1°.

- **Script:** `scripts/fit_pump_box.py` reproduces my joint fit, missing the eight corners by
  1.2–10.2 px. The recorded misses (0.08 m rms, worst 0.15 m) match.
- **The changed pick is fine:** top front in IMG_2205 is now (630, 790) instead of my 794. Both are on
  the lid's front corner.
- **Overlay:** projecting the refit box at 0.82 m and 1.39 m shows its outline on the photographed lid
  and base in IMG_2205, within 2 px except the top-right corner at 10 px. In IMG_2204 the outline sits
  a steady 8–10 px left, which fits that camera's known lean.
- **Reviewer's held-out check:** the IMG_2204 base front (about 1275, 852) and base left (about
  1237, 819) corners were not used in the fit. The model misses them by about 9 px each, about 0.11 m.
- **Renders:** the `-pumpbox` renders now match both photos in position and turn, with the box on the
  deck by the fence.
- **Remaining limits:** the model box is 1.1 m long against about 1.2 m measured, and it has louvres on
  all four sides; both are follow-ups.
