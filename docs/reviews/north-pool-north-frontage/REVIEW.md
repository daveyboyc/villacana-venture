# Independent review: north-pool-north-frontage

Reviewer: an agent that did not make the change. Reviewed on 2026-11-15, at commit cca16ef.

## What I inspected

- The full-size photos `public/photos-ref/IMG_2204.jpg` and `IMG_2205.jpg` (1600x1200), and the wider private
  `07-north-pool-whole-courtyard-looking-north.jpg`.
- The before and after renders through the solved cameras, at 1600x1200, compared region by region in
  stacked crops zoomed 1.3-3x.
- `north-row-layout.png` and `north-row-details.png`.
- To check positions in world coordinates, I projected the registry corners, the terrace outline, the
  openings and the frontage data through the solved poses in `data/photo_poses.json`, using
  `scripts/photo_pose.py` `project`/`rotation`. I also cast photo pixels onto the wall planes and the
  floor planes. No new renders were made.

All pixel coordinates below are full-size photo pixels. The cameras are IMG_2205 and IMG_2204.

## Findings by region

| Region | Result |
|---|---|
| Plinth wall | **Good.** The wall foot is at y 610-615 in IMG_2205, against y 612 in the render. Its curve and white finish match. |
| Plinth steps | **Good.** The openings project to these spans: 315-370, 493-547 and 693-743 in IMG_2205, against 312-370, 505-537 and 700-732 in the photo. In IMG_2204 they are about 20 px west, which is in line with that camera's larger residual. |
| Path and lawn edge | **Good, and better than before.** The path band is at y 612-632 and the lawn starts at y 630, as in the photo. The tan colour is a little more yellow than the photo's grey-beige crazy paving. The lawn's north-east corner is sharp where the photo shows it rounded (x 880-930, y 630-680). |
| Patio extent | **Plausible.** The floor runs to the house walls, and Layout shows it clearly. The floor is barely visible in the photos, so I can't confirm its finish. |
| East end | **Short, as declared.** The plinth and the hedge stop at about x 955. In the photo they continue to x 1000, with a step and the gate pier at x 1000-1050. The README declares this (it keeps the lane clear), but the gap is visible. |
| Hedges | **Not right.** See fixes 3 and 4. (a) The west run over-runs step 1. In IMG_2205 the render hedge covers x 205-357, where the photo's covers x 210-315. In IMG_2204 it covers 890-1025, where the photo's covers 905-990. It hides the loungers and side table, which the photo shows in that gap. (b) The runs are rows of rounded 1.2 m cushions with deep notches between them: at IMG_2205 x 617-627, at IMG_2204 x 1285-1297, and in `north-row-details.png`. The photo's hedges are flat-topped and unbroken between the steps. (c) The runs between steps 2 and 3 stop about 1 m short of the steps, at x 678 instead of 700. |
| Parasol | **Wrong colour.** The position is good: x 255-372 against the photo's 245-375. It renders cream-white (249,248,240), but the photo's is clearly mid-grey (about 145,150,160). The photo shows a round umbrella with a peaked top, and the model's is square and flat. |
| Loungers and side table | **Mostly hidden.** They are hidden by the hedge over-run in (a). The side table is visible at x 330. |
| Armchair | **OK.** It is faint behind the hedge at x 395-415. |
| Dining set A | **About 0.6-0.8 m too far west.** It renders at x 480-560 against the photo's 507-585 in IMG_2205, and at 1145-1230 against 1180-1275 in IMG_2204. Cast at table height, both cameras put it at about (-174.5, 5.2–5.6). The data has (-175.2, 5.4). |
| Porch chairs, lounger and dining set D | **Acceptable.** The chairs are at x 682-727 against 680-707. The photo's object at x 763-788 could be a low lounger or a table, so it is ambiguous. Dining set D, at x 785-863 against 810-845, is a little large. |
| North-west terrace furniture | **Good.** The dining set and bistro sets are within about 20 px. The folded parasol is about 30 px (0.7 m) west of the photo's, which is at x 375-395. |
| Blue awning | **Good.** It is at x 640-785 against 645-800 in IMG_2204, and at x 0-53 in IMG_2205. Its colour is right. |
| Grey awning | **Wrong colour.** Its span, x 447-600 against 443-593, and its mounting height (about 4.2-4.4 m from the wall casts) are right. But `#c4c3bb` renders as near-white (221,225,210), much like the white awning. In the photo it is clearly grey (161,161,164), while the white awning is (217,209,196). The leafy canopy of o12 also hides its upper half. |
| White awning | **Fair.** Its position is right. Its east end is 0.5-1 m short: it ends at x 735 against 752 in IMG_2205, and at 1440 against 1480 in IMG_2204. In the photos the white and grey awnings fall more steeply (58-60 px deep against 22-30 px), so `drop` of 0.45 m looks low. |
| Bougainvillea | **Wrong.** All three render as small clumps about 1.5 m tall, set 1.5-2 m too high, at about half the photographed spread. The sprite base is `floorY + height - 1.3`, so only the top of each climber is drawn. Details per climber are in fix 2. |
| Alley arch | **Present, but the form and span differ.** The render shows a solid masonry arch with piers, at x 794-906 in IMG_2204 and x 67-209 in IMG_2205. The photo shows a thin white curved canopy on slender posts, at x 835-922 and x 110-223. Cast onto the arch line, both cameras put the canopy's west end about 0.8 m east of the model's, near (-183.45, 8.93). Its top is at about 3.7-3.9 m. |
| Pollarded tree o12 | **Right place, wrong form.** The trunk is at x 497-510 against the photo's 480-530, and at 1170 against 1180. The model has a green umbrella canopy, but the photo shows bare pollard knuckles. The canopy hides the grey awning. |
| Feathery lawn tree o9 | **Missing.** The guard drops it. This is a known gap. |
| Generated balconies | **Not fixed. The README's claim is wrong.** (i) A wooden balcony with a tiled roof is still in both after renders: in IMG_2205 at x 808-940, y 330-440, and in IMG_2204 at x 1550-1600, y 335-445. The photos show plain wall with arched shuttered windows there. It sits on the return face from (-166.83,-0.9) to (-164.15,3.54), whose outward normal is about (-0.856, 0.517). The new `north-pool-north-row-recess` front covers the next face west. On that face it removed only an iron railing and a generated awning, not this balcony. (ii) A generated black iron balcony is still on the parasol-house front, at IMG_2205 x 343-485, y 398-438, and IMG_2204 x 1028-1165, y 392-430. The photos show the moulded sill and bougainvillea there, not a railing. |
| Porch roofs | **Not this change, but visible.** Three porches have tiled pitched roofs on square wooden posts: IMG_2205 x 580-715, and IMG_2204 x 255-440 and 1290-1450. The model draws slatted pergolas over arched openings. |

## Compared with the before renders

**Better:**
- The plinth, steps, path and lawn now match the photos.
- The wrong hedge blob and small arch near IMG_2205 x 640-1000 are gone.
- The generated awnings on the parasol house and the recess face are gone.
- The blue awning, the furniture and the alley arch are added.

**Worse:**
- Bougainvillea 1 on the north-west terrace house. The generated climber before sat at IMG_2204 x 605-675, y 370-470, close to the photo's x 580-690, y 360-420. The new one sits higher, at y 290-355.

## Layout and Show details

This is correct.
- **Layout** shows the arch, the patio floor, the plinth and the steps. It shows no furniture, awnings, hedges or climbers.
- **Show details** adds furniture, awnings, hedges and climbers.

## Remaining differences, worst first

**This change should have fixed these:**
1. The wooden balcony with the tiled roof on the return face east of the recess. The README says it was removed, but it is still there.
2. The grey awning and the parasol render white. The photos show them grey.
3. The bougainvillea are too high and too small, and one is a regression.
4. The west hedge over-runs step 1 and hides the loungers. The hedge runs are notched cushions, not continuous.
5. The generated iron balcony on the parasol-house front. It is in the frontage the change set out to cover.
6. The arch is a solid masonry arch where the photo shows a canopy, and its west end is about 0.8 m too far west.
7. Dining set A is 0.6-0.8 m west. The white awning's east end is short. The awnings fall too little.

**Known, or outside this change:**
- The moulded window surrounds.
- The planting inside the patios and the north-west mixed bed.
- The lawn tree o9.
- The glass pool fence.
- The generic plant models, including o12's leafy canopy.
- The east end left 1 m short for the lane.
- The pergola-style porch roofs.
- The path is a little too yellow.

## Verdict: **not-satisfactory**

The structural re-trace is good, and I would accept it on its own: the plinth, steps, path, lawn, patio extent and the Layout/Details split. The detail layer is a different matter. Several new elements are visibly wrong in colour, height or extent. One stated fix, the balcony removal, does not appear in either render. One climber got worse. All the fixes below are small data or parameter changes.

### Fixes (x east, z south, metres)

1. **Remove the remaining wooden balcony.** In `data/plain_fronts.json`, add a front with these settings:
   - box `[-167.3, -1.3, -163.7, 3.9]`
   - facing `[-0.856, 0.517]`
   - `noPorches: true`, `noOpenings: false`

   This is the face from (-166.83,-0.9) to (-164.15,3.54). Evidence: IMG_2205 x 808-940, y 330-440, and IMG_2204 x 1550-1600. Correct the README and the `trust` text of `north-pool-north-row-recess`: that entry removed an iron balcony and an awning, not the wooden balcony.
2. **Bougainvillea.** Draw each climber from about 1.3-1.5 m above its floor up to its top, for example `y = floorY + 1.3` with `scale ≈ (top - 1.3) / 2.6`, or stack two sprites. Set the spread to about 2.2-2.5 m.
   - np-bougainvillea-3: move to (-177.8, 5.7). Both cameras cast the photographed mass there, at s 0.40-0.66 along the wall and world height 2.7-6.0 m. In the photos it is at IMG_2205 x 370-467, y 360-500, and IMG_2204 x 1065-1145, y 350-480.
   - np-bougainvillea-1: the photo has it at IMG_2204 x 580-690, y 360-420. Its top should be at the first-floor balcony rail, not above the window.
   - np-bougainvillea-2: the photo has it at IMG_2204 x 770-850, y 345-480.
3. **Hedge over-run at step 1.** End the west hedge run at about (-179.3, 9.9). In IMG_2205 its east end should be at x 315, not 357. In IMG_2204 it should be at x 990, not 1025. In `src/raised-terraces.ts`, do not extend pieces by `len*1.25+0.5` past a run end or an opening cut. Today the pieces on the short edges 0-1 stick past vertex 2 and the face line.
4. **Hedge continuity.** Build one flat-topped hull per free run between openings, joined across polyline vertices, instead of separate 1.2 m cushions. Take each run right to the step cut. Between steps 2 and 3, the run should reach x 700 in IMG_2205, at about (-170.9, 9.5).
5. **Colours.** Set np-awning-grey `colour` to about `#8e8e8a`. Make the parasol canopy mid-grey, about `#9da3a9`. If possible, make it round with a peaked top.
6. **Iron balcony on the parasol-house front.** Add a `noPorches` plain front:
   - box `[-182.0, 3.3, -173.9, 8.4]`
   - facing `[0.513, 0.858]`

   Evidence: IMG_2205 x 343-485, y 398-438, and IMG_2204 x 1028-1165, y 392-430.
7. **Alley arch.** Start the arch at about (-183.45, 8.93) instead of (-184.28, 9.32). Make it a thin curved canopy, about 0.15-0.2 m thick, on slim posts, with its top at about 3.8 m. Do not use solid piers and a spandrel.
8. **Minor.**
   - Move np-patio-dining-a to about (-174.6, 5.3).
   - Extend np-awning-white about 0.7 m east.
   - Increase the awning `drop` to about 0.9-1.0 m.
   - Move nw-terrace-folded-parasol about 0.6 m east.

After these fixes, re-render both cameras, and re-review the hedges, the climbers and the balcony faces.
