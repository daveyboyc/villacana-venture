# Independent review: north-pool-station-details

Reviewer: a second agent that did not make the change. Reviewed 2026-11-15 against the full-size
`IMG_2206`, `IMG_2205` and `IMG_2208`, the before and after renders through the solved cameras, and the
four Inspect views. Pixel coordinates are photo or render pixels at 1600x1200. World coordinates are
metres, x east, z south. Wall-top heights assume ground about 1.2 m, as the README's "2.9 m wall top"
implies.

**Verdict: `not-satisfactory`.** The Calle Isabel half is `satisfactory-with-notes`. The west-gardens
half has a data bug in the wall openings, a south-east wall that both photos contradict, and a parasol
that now hides the west gate.

## West gardens (IMG_2206, IMG_2208)

What is right:
- **West gate (gate 1):** the render's brown planks at x 555-605 sit on the photo's gate (x 542-606,
  y 672-772). It is 1.0 m wide.
- **South-east gate (gate 2):** its position (render x 690-740, y 800-930; photo x 692-735, y 795-945)
  and its raised cap (render x 660-755, y 775-805; photo x 650-740, y 775-830) agree to about 10 px.
- **Gate colour:** a dark brown, slightly warmer than the photo (render RGB 80,50,25; photo 40-60,30-44,26-40).
- **Bougainvillea:** its crown (render x 650-845, y 600-800) covers the photo's mass (x 615-865, y 640-790).
- **Layout and Show details:** the walls, gates, cappings and terracotta floor show in Layout. The
  parasol and bougainvillea show only with details. The generated 1 m walls and hedge inside the box are gone.

What is wrong (this change should fix it):
1. **The wall openings are off by half a gate.** `src/ground-plan.ts` treats `openings[].at` as metres
   to the opening's **centre** (line 26; `cutOpenings`, line 168). The data gives the opening's start:
   - **South-east wall:** `at` 0.45 leaves a gap 0-0.9 m from the pier. Gate 2 stands at 0.45-1.35 m,
     so a 0.45 m hole beside the pier shows the patio floor through the wall (render x 742-776,
     y 800-930; the photo has white wall there). The Layout zoom shows gate 2's cap overhanging empty
     space on its pier side.
   - **West wall:** `at` 0.92 puts the gap at z 31.58-32.08, while gate 1 spans z 30.58-31.58. The wall
     runs through the gate's north half, and a 0.5 m hole opens south of it.
   - **Fix:** set the west wall to `at: 1.42` and the south-east wall to `at: 0.90`. Collision and the map
     use the same runs, so they change with it.
2. **The south-east wall goes the wrong way.**
   - In IMG_2206 the wall top west of gate 2 *falls* to the left, from the cap's end at (650, 830) to
     (595, 885). The modelled wall top *rises* to the left, from (766, 797) to (529, 757). At photo
     x 600 the model's top is at y≈770 and the photo's is at y≈870, about 1.5 m apart at 16 m.
   - IMG_2208 (x 140-300, y 250-600) shows the same wall running from gate 2 towards the camera, with
     its cap stepping down, and the parasol and floor behind it.
   - Cast at its 1.7 m top (y≈2.9), the photographed wall runs from about (-181.4, 32.3) to
     (-180.8, 33.1), a direction of about (0.55, 0.83) from gate 2. The model has (-0.86, 0.52), towards
     (-184.5, 32.5).
   - **Fix:** re-trace this wall and the patio's south side. A second camera would be best; otherwise
     use IMG_2208's camera solved at the same station. Until then, grade this edge `estimated` and do
     not count it under the patio's `photographed`.
3. **The parasol hides the west gate.**
   - The canopy renders at x 545-680, y 640-735. It covers gate 1's top half and its capping, which the
     photo shows clearly.
   - The photo's canopy is at x 530-650, y 770-855: below gate 1, about 120 px lower.
   - At (-184.6, 31.3), with a canopy 2.3-2.8 m up, it cannot match. The photo ray through the canopy
     centre (590, 805) reaches y 3.1-3.5 at about (-182.2..-181.3, 32.6..32.9).
   - **Fix:**
     - Move it to about (-182.0, 32.7), inside the re-traced wall from item 2, and lower the canopy to
       about 2.1 m.
     - Colour: the photo is lilac-grey (lit 175,171,189; shade 131,130,147). The render's `#c9cdd2`
       comes out almost white (233,238,244). Try about `#b4b0c6`.
4. **The wall east of gate 2 is missing.**
   - Both photos show the white patio wall at full height continuing about 1.2 m east of gate 2
     (IMG_2206 x 735-830, top y≈785, base y≈960; IMG_2208 x 400-500, y 240-440).
   - The render has the hole from item 1, then a 1 m generated wall stub (render x 765-800, y 880-990).
     The stub comes from the generated points (-181.0..-179.0, 31.0), which lie outside the
     `replacesGardenWalls` box (it stops at x -181.4).
   - **Fix:** build the wall and the white pier at the patio wall's height along z≈31.0 from the pier to
     about x -180.0, where the photo's stone path starts. Extend the box east so the 1 m stub goes.

Lesser points (fix while here):
5. **Bougainvillea shape:**
   - It reads as a small tree with a bare trunk (render x 740-790, y 700-800). The photo shows a broad
     mass draped over the wall top, with no trunk.
   - The pale-blue plumbago over the west wall's pier (photo x 610-690, y 690-790) is missing.
   - With details, a magenta vertical streak rises through the crown (west-gardens-details).
6. **The map is inconsistent:** `src/blueprint.ts` lines 505-506 filter `skeleton.gardenWalls` and
   `gardenGates` without `replacedGardenWall`. The map therefore probably still draws the suppressed
   1 m walls, and the gate at (-184.51, 32.5), in both boxes. Check the map and add the filter.
7. **Stale confidence entries:**
   - `gap:north-pool-gated-patio-walls` still says the model has the generated 1 m walls.
   - The `plain_fronts.json:north-pool-gated-patio-walls` entry says the heights, cappings and doors are
     "not yet modelled".
   - Update or close both.

## Calle Isabel side (IMG_2205)

- **East block's face:** now plain white with two arched, shuttered first-floor windows (render
  x 1320-1480, y 440-520; photo x 1380-1480, y 450-530). The iron balcony and awning are gone. This
  matches the photo apart from the archway (known).
- **The removed hedge, low wall and white arched gate:** removing them is correct. The photo has none
  there.
- **Paving, partly right:**
  - The photo shows one continuous grey crazy paving from the lawn's edge up to the step at the iron gate
    (photo x 880-1060, y 560-720).
  - The render has three finishes there: a beige flagstone path, terracotta squares (render x 950-1220,
    y 540-650, where the photo has crazy paving, a white wall and the iron gate), and the crazy-paving
    band.
  - **New and visible:** a green bed patch at render x 1085-1175, y 665-705, about (-161.3, 11.5).
    The removed hedge used to hide it. Pave it with crazy paving, or record it as the dropped yucca's bed.
  - The terracotta squares and the missing iron gate and wall (photo x 1000-1140, y 520-600) were there
    before this change.
- **A white stub remains** at render x 1330-1370, y 700-755. It is probably the generated wall run at
  (-159.8..-159.5, 17.5-19.0) and the gate at (-160.0, 17.0), just south of the `calle-isabel-paving`
  box. The photo shows only the yucca there. Extend the box, or confirm that the wall exists.

## Regressions against the before renders

- **IMG_2206:**
  - The gate 1 capping is now hidden behind the parasol.
  - Patio floor shows through the pier-side gap.
  - The rest is better than before. The before render had a 1 m curved wall and crazy paving where the
    photo has the gated walls.
- **IMG_2205:** the green bed patch and the white stub. Nothing else changed outside the suppressed area.

## Remaining differences, worst first

This change should fix:

| # | What | Fix |
|---|------|-----|
| 1 | Parasol over the west gate and its cap | Item 3 |
| 2 | South-east wall direction, and the patio extent that follows from it | Item 2 |
| 3 | Pier-side hole and missing wall east of gate 2 | Items 1 and 4 |
| 4 | West wall opening off by 0.5 m | Item 1 |
| 5 | Calle Isabel finishes, and the green patch | Pave the area as crazy paving |
| 6 | Bougainvillea and plumbago shape | Item 5 |
| 7 | Map and confidence consistency | Items 6 and 7 |

Known, out of scope (not counted against this change):
- the near block's corner and height next to the camera;
- the trees and yucca dropped by the route guard, which leave the east side bare;
- the big creeper on the near block;
- the east block's archway;
- generic plant models;
- the glass pool fence.

Remeasure after the fixes. Re-render IMG_2206 and IMG_2205 through the solved cameras, and check
these against the photo:
- the gate 1 cap at y 655-680, clear of the parasol;
- the parasol canopy at x 530-650, y 770-855;
- the south-east wall top falling to (595, 885);
- a continuous white wall from x 735 to 830 east of gate 2.
