Verdict: approved with changes (R1 wall height, R2 door position and size, R3 Elena-arm lane face, R4 records). Detail can go on once R1-R3 are built and re-rendered.

# Structure review: Elena north mouth, west corner on Cervantes (18 November 2026)

Reviewer: an independent subagent that did not build this change. Scope: `lane_walls.json`
`elena-north-corner-patio-wall`, `elena_north_corner.json` `elena-north-corner-bed`, `cervantes_lane_edges.json`
`cervantes-elena-corner-bed`, and the removal of `cervantes_patio_walls.json` `cervantes-patio-north-east`.

## What I looked at

- The full-size photos IMG_2455, 2463, 2514, 2686, 2799, 2800, 2965, 2966, 2967, 2969, 2197, 2360, plus IMG_2196 and
  IMG_2265 (garden door and the view east along Cervantes), the renders `IMG_2800-after.png`,
  `corner-overhead-layout.png`, `corner-overhead-details.png`, `corner-from-north.png` and `aerial-plan-after.jpg`.
- `scripts/check_elena_north_corner.py`: PASS. `scripts/lidar_check.py` could not run here (matplotlib missing). Its
  2 m surface model could not resolve a 0.25 m wall anyway. The lane ground is unchanged.
- **My own rough camera fits (not solved cameras, not placement evidence).** For IMG_2455, IMG_2800, IMG_2966 and
  IMG_2967 I fitted position, heading and pitch to the bed's outer corner (top and foot, 0.5 m kerb) and the
  directions of its two top edges. Settings: f = 1235 px (the 26.8 mm lens prior) and eye height 1.4-1.8 m, giving
  1.4-8 px rms. Then I back-projected wall features onto the wall face (Elena frame o = -2.115). Results are relative
  to the bed corner. The tile check gives 0.42-0.47 m for the 0.4 m path tiles at the bottom of IMG_2800 and IMG_2967,
  so the scale is right to about 5-10 %. Pixel picks (x, y in the 1200 x 1600 originals):

| Photo | bed corner top / foot | Cervantes top edge | Elena top edge | wall edge | door jambs at head | plaque bottom | lamp |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IMG_2455 | (425,850) / (425,940) | (320,760) | (1040,795) | (490,600) | 730, 840 at y 420 | 508-685 at y 552 | (400,480) |
| IMG_2800 | (495,763) / (495,913) | (305,555) | (1187,687) | (595,300) | 990, 1150 at y 40 | 630-910 at y 250 | (450,150) |
| IMG_2966 | (700,813) / (700,917) | (600,703) | (1200,767) | (773,400) | 1090 (left) at y 297 | 805-1027 at y 450 | (677,330) |
| IMG_2967 | (490,890) / (490,1080) | (228,600) | (1200,712) | n/a | 1030 (left) | 585-935 at y 180 | n/a |

  The back-projected positions agree across the photos to about 0.2 m along the wall and 0.2 m in height. That
  agreement is what the required changes below rest on.

## 1. Corner, wall arrangement and door

- **Corner: correct.** IMG_2800, 2966, 2455 and 2799 look west along Cervantes. The CALLE DE ELENA plaque faces the camera
  (IMG_2800 x 630-910, y 205-250), so the plaque wall faces east and runs along Elena north. It stands behind the
  raised fan-palm bed. The red drain lies across the Elena north mouth (IMG_2967 (555,1060)-(850,1380)) between this
  bed's corner and the hedged tree bed. IMG_2197, looking the other way, shows the same drain, tree bed and white bed
  corner (bottom left). The Elena 24 garden door with the curved coping is further west in the same wall line
  (IMG_2463 x 470-580, IMG_2196).
- **Arrangement: correct.** The plaque run faces Elena north and turns west along Cervantes behind the hedge and
  plumbago to the garden-door wall: IMG_2463 shows the wall continuous east of the door, and IMG_2360 from the roof
  shows it from inside. No second door, gap or step shows on the Elena run. No opening shows on the Cervantes run
  between the garden door and the corner (IMG_2463, IMG_2265).
- **Door: right run, wrong place and too big (R2).** Back-projected door jambs at head height:

| | Elena s of jambs (m) | width | head above lane |
| --- | --- | --- | --- |
| IMG_2455 | 3.07-3.81 | 0.74 | 2.69-2.73 |
| IMG_2800 | 3.19-3.92 | 0.73 | 2.74-2.79 |
| IMG_2966 | 3.02 (left jamb) | (cut by frame) | 2.51 |
| IMG_2967 | 3.13 (left jamb) | (head out of frame) | n/a |
| with R3's bed face (-0.75) | 3.2-4.1 | ~0.77 | 2.55-2.85 |
| **model** | **4.31-5.51** | **1.2** | **2.0** |

  The door is about 1.3 m further south than built and about 0.8 m wide between its pilasters (IMG_2455 pilasters at
  x 705-730 and 840-865). IMG_2455 shows about 2 m of plain wall north of the door (x 865-1000+) before the
  house. The model leaves 0.4 m. The plaque-tile basis for 1.2 m does not hold: the letter tiles are tall and narrow,
  about 0.1 x 0.2-0.25 m. "CALLE" in IMG_2967 is 125 px wide by 65 px tall for five letters, so the plaque is only
  about 1.1-1.2 m long (s ≈ 1.8-3.0). The model's own `IMG_2800-after.png` shows the same: the render's door head is
  at y ≈ 345 against the photo's y ≈ 40. A 66 px rms pose cannot account for 300 px.

## 2. Raised bed

- **Shape and height: right.** The bed is one L, white, about 0.5 m: 150 px at the corner against 0.4 m tiles of
  about 125-140 px in IMG_2800. The fits close at 0.5 m. The arms meet without a gap. The Cervantes face at 0.95 m
  north of the axis is confirmed: in IMG_2800 the tree bed's kerb corner (640,1110) lies on the extension of this
  bed's Cervantes foot line (310,600)-(495,913), within about 30 px. In IMG_2799 the same holds within about 25 px, and
  the drain runs corner to corner (IMG_2514, IMG_2967). Back-projected, the tree-bed corner is at Cervantes o ≈ -0.9.
- **Elena face: about 0.25 m too far west (R3).** The mouth is about 1.45-1.5 m, not 1.8 m:
  - IMG_2686, bottom rows (y ≈ 1400): bed face, then grey margin 90 px, three tile columns of about 270-300 px each,
    then margin 85 px and kerb. With 0.4 m tiles that is 0.13 + 1.2 + 0.12 ≈ 1.45 m, with the margins equal on both
    sides.
  - IMG_2800 fit: the tree-bed kerb corner is 1.35-1.5 m east of this bed's face.

  The lane paving the model draws is 1.45 m wide (`elena_north.json` lane width), centred on the centreline. The tree
  bed opposite is at +0.76. The built face at -1.0 leaves a 0.27 m strip of ground between the paving margin and the
  bed. The photos show no such strip.
- **Extent: right.** West: the arm runs to the garden-door steps (IMG_2800 bed end at about (300,590), IMG_2463 steps
  at x 395-490), meeting the 0.45 m garden-door planter at s 50.34. North: the Elena face is visible to at least
  s ≈ 4.5 (IMG_2455 at (1040,795), before the lantana hides it), past the door. An end at the house corner
  (s 5.91) is not contradicted.
- IMG_2686 is misdescribed in the README ("the raised bed's north end under the house's barred windows"). The
  raised bed ends at the left (215,1040). A separate **lower** kerbed bed of jade and euonymus then runs north along the
  house under the barred windows, past the two white planter boxes (IMG_2686 x 215-420, y 830-1100; IMG_2969
  bottom). It is not modelled: `corner-from-north.png` shows paving there. It is out of this scope; record it (R4).
- **Planting split: wrong.** Fix it at the detail stage, not here. In IMG_2800 (x 280-490), IMG_2966 and IMG_2455 the
  clipped hedge runs the whole Cervantes front to the corner, with plumbago behind it. The fan palms fill the Elena
  arm and the corner behind the hedge. The model puts palms on the Cervantes front from s 52.6 to 55.55.

## 3. Wall height and contradictions

- **2.2 m is too low (R1).** Heights above the lane:

| Feature | Photo | Height |
| --- | --- | --- |
| Plaque bottom | IMG_2455, 2800, 2966, 2967 | 1.8-2.0 m |
| Door head | same | 2.5-2.85 m |
| White wall at the top edge of the frame, above the plaque (750,0) | IMG_2800 | 2.8 m, and it continues up |
| Coping just above the door | IMG_2966 (1060-1150, 262) | 2.65 m |

  The model's 2.2 m top projects only just above the plaque. The photos show 0.6-0.8 m more wall above it.
  IMG_2463 is an independent check, scaled by the 1.8 m garden door on its 0.45 m threshold. The wall just east of the
  garden door is about 2.4 m. It steps up at a pier about 2-3 m east of the door (crop at x 770-820, y 260-300) to
  about 2.6-2.7 m. The pier is probably where the east partition meets the lane wall (s 50.55). The "as the CALLE
  ELENA wall across the junction" basis does not apply here.
- **Lamp: on this corner.** It hangs at s ≈ 1.1-1.2, about 2.3 m up, about 0.5 m south of the visible wall edge. It is
  on a bracket off the Elena/Cervantes corner (IMG_2967 bracket at (330-390,150)). That is not a different corner.
- **Door sill: open.** The bottom of the double door is hidden behind the bed in every photo. A 2.7 m head on a 0.8 m
  door suggests either a tall door from the lane or a sill about 0.45-0.5 m up, like the Elena 24 garden-door patio
  next door (+0.45). Do not guess. Record it (R4).
- **Wall corner: within tolerance.** The visible white edge of the plaque wall is at s ≈ 1.6-1.75 (with R3), against
  1.92 for the model's corner face. Bougainvillea may hide the true corner, which can only be further south. That is
  0.2-0.3 m, within the stated 0.5 m, so it is not required. Record it.

## 4. Changes

### Required before detail goes on

- **R1. Wall height.** Raise `elena-north-corner-patio-wall` from 2.2 m to about 2.8 m (2.7-2.9). The Cervantes run
  can be 2.6-2.8 m. Rewrite the height basis with the measurements above.
- **R2. Door.** Move `elena-north-corner-patio-door` to about (-148.85, 50.72): Elena s ≈ 3.6 ± 0.3 on the wall line,
  about 1.3 m south of (-149.507, 49.584). Set its width to about 0.8 m and its head about 2.7 m above the lane. Either
  make it 2.7 m tall from the lane or about 2.2 m on a 0.5 m sill, and say which and that the sill is unseen. About
  2 m of plain wall should then remain between the door and the house corner, as IMG_2455 shows.
- **R3. Elena arm lane face.** Move the face of `elena-north-corner-bed` from o = -1.0 to about -0.75 (s 0.93-5.91
  unchanged; bed about 1.37 m deep). This puts the bed on the lane's grey margin, as the tree bed is opposite, and
  leaves a mouth of about 1.5 m. Correct "about 1.8 m" in the basis and the README. The outer corner stays on the
  Cervantes face (0.95 m). The Cervantes arm is unchanged.
- **R4. Records.** In `data/discrepancies.json` and the area notes, record:
  - the double door's sill or patio level (unseen);
  - the 0.2-0.3 m corner offset;
  - the unmodelled lower bed along the house north of the raised bed (IMG_2686, IMG_2969);
  - `elena-north-tree-bed-2`: its south face is modelled at Cervantes o = -1.5, but the photos put it in line with this
    bed's Cervantes face at about -0.9 (IMG_2800, 2799, 2514, 2967). It is pre-existing and not this task's;
  - the Elena 24 garden-door wall at 1.9 m, where IMG_2196 and IMG_2463 read about 2.4-2.5 m above the lane (out of
    scope).

  Update the README and the `basis` text to match.

### Optional remarks

- Each arm draws its own kerb walls, so a kerb runs across the inside of the L at the seam (`corner-overhead-layout.png`
  around (760-790, 380-520)). The photos read as one bed. Plants hide the seam, so this is cosmetic.
- For the detail stage:
  - Hedge along the whole Cervantes front with plumbago behind it; palms on the Elena arm and the corner.
  - Plaque at s ≈ 1.8-3.0, bottom about 1.9 m, tall narrow letter tiles.
  - Bracket lamp off the corner at about 2.3 m.
- Magnolia: in IMG_2686, IMG_2197 and IMG_2514 the magnolias stand in the hedged beds east of the mouth, and the
  magnolia in IMG_2455 (upper right, trunk near x 1000-1100) is most likely that tree in the foreground. "Magnolia
  over the wall" and "the walled patio with the magnolia" are not established. IMG_2360 and the aerial show a dark,
  glossy canopy in the pocket, but that view is not solved. Settle it with the photos before placing a tree inside
  the patio.
- The floating paving slab across the Elena north mouth (pre-existing, noted in the README) is still in the renders.

These are photographic diagnostics through rough, unsolved fits relative to the bed corner. They are not measured
placement approval. The `estimated` grade stays.
