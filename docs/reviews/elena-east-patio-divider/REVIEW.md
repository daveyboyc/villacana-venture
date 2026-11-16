# Review: Elena east patio divider (south) and pergola move

Reviewed 2026-11-16 by an independent reviewer subagent that did not make the change.
Scope: `data/elena_east_patios.json` walls `elena-east-patios-divider-south` (new) and
`elena-east-patios-pergola` (moved 1.2 m north); `src/elena-east-patios.ts`; the three
Inspect renders in this folder. No files other than this one were edited, nothing was
re-rendered, and no git commands were run.

**Verdict: satisfactory-with-notes.** The wall line is real and drawn in the right
place. Two independent sources agree on it: the aerial and the registry party-wall jog.
But the photo citation for it is wrong. IMG_2366 does not show this wall, and the claim
contradicts other records in the repo, so the citation must be corrected before merge
(fix 1). The pergola move is weaker than claimed (fix 2). The joins are cosmetic only
(fix 3).

## Method

The aerial is `public/map/ground.jpg`, Esri World Imagery z19, about 0.240 m per pixel,
with bounds from `ground.json`. I resampled it bilinearly into a frame aligned with the
wall:

- origin P0 = (-140.604, 42.782), the divider's house end;
- `t` runs along the divider towards the garden wall, u = (-0.859, 0.512);
- `s` is the normal, positive towards Cervantes (south), n = (0.512, 0.859).

I drew the registry rings from `skeleton.json`, the garden, Cervantes and divider walls,
the garden door and the pergola. Then I took brightness profiles across the band. The
working images are in the scratchpad, so they will not last. If you want to keep them,
copy them here:
`/tmp/claude-0/-home-user/1b524a2d-dec4-58c5-8325-52660f543558/scratchpad/review4/`
(`aerial_overlay.png`, `aerial_wide.png`, `rotated_overlay.png`, `rot_zoom.png`).

Reference positions in this frame:

| Feature | s (m) | t (m) |
|---|---|---|
| Divider centreline | 0 | 0 → 5.50 |
| Registry jog segment (-140.03,42.67)–(-140.39,42.89) | +0.20 | -0.55 → -0.13 |
| Registry face north of the jog | -0.13 … -0.07 | (runs north along s) |
| Cervantes wall centreline | +4.22 | |
| Garden-wall door centre (-144.63, 46.79) | +1.38 | 5.51 |
| Garden-wall door, north edge of leaf | +0.90 | |
| Next registry jogs | -4.62 and -8.55 | |
| Pergola (new) | -3.25 … -0.55 | 2.6 … 5.1 |
| Pergola (old) | -2.05 … +0.65 | 2.6 … 5.1 |

The garden wall is perpendicular to the divider to within 0.1°. The Cervantes wall and
the jog are parallel to it to within 1°.

## 1. Aerial: is there a wall, and is it on the line?

**Yes.** Averaged over t = 1–4.5 m, the profile across the line has a sharp white top
and a dark band just north of it:

- white top: peak 211 at s = 0.00, about 0.5 m wide;
- dark band: trough 67 at s = -0.70.

The Cervantes wall has exactly the same signature:

- white top: peak 194 at s = +4.25, against its modelled +4.22;
- dark band: trough 60 at s = +3.50.

The shadow is the same width (about 0.6 m) on both walls. That means similar heights, so
1.85 m against the Cervantes wall's 1.9 m is consistent.

Traced along the wall in 0.25 m steps:

- **t = 1.0–4.0 m.** The top sits at s = +0.07 ± 0.06 m with strong contrast (120–196).
  It is parallel to the drawn line to within about 2°.
- **t = 0.25–1.0 m.** It reads 0.1–0.25 m further north, with weaker contrast, because
  this end lies in the house shadow.
- **t > 4.3 m.** The white top is lost under the foliage along the garden wall. The dark
  shadow band continues weakly up to t = 5.5. The last 1.2 m and the junction with the
  garden wall are therefore inferred, not seen.

On accuracy: the aerial's absolute registration here is only good to about 1 m. The
useful cross-check is independent of that. The registry jog (s = +0.20) and the line on
the aerial (s = +0.07) agree to about 0.15 m normal to the wall. The divider's position
is therefore set by two independent sources, and grading it `inferred` is right. It does
not meet "Measured approval": that needs at least one solved camera, and none exists here.

**Other wall lines in the band:**

- **None clear between the divider and the canopy (s = 0 … -4.6).** There is only a
  patchy pale area, discussed under the pergola below.
- **The second jog line (s = -4.62)** coincides exactly with the south edge of the
  magnolia canopy. A wall there could be hidden under the overhang, but nothing shows.
- **The third jog (s ≈ -8.55)** is entirely under the canopy.

So the canopy really does hide the other likely dividers. `gap:elena-east-patio-dividers`
and photo request `elena-east-patios-inside` are the right response.

**Bright line south of the divider (not a defect).** A second bright line sits at
s = +1.0 … +1.5 (t = 1.5–4.5), with a dark band at s = +0.6 between it and the wall. The
same pattern appears 1.0–1.25 m south of the Cervantes wall, where it is the white kerb
of the plumbago bed (IMG_2356). It is probably a raised bed or bench along the divider's
south face. It is not a wall line, and it is left unbuilt, which is correct.

## 2. IMG_2366 at full size

What it shows, nearest to the camera first:

1. An artificial-grass patio with a grey table and chairs. A long white wall with a
   planter bounds it on the right, and a white wall with a timber lid-box bounds it at
   the far side.
2. Beyond that, a bare-earth bed with a clipped hedge border and the magnolia.
3. A **terracotta-tiled strip** with a narrow hedge along it.
4. A white wall carrying a thick trained trunk and creeper, which runs into the brown door
   under the raised curved coping.
5. Beyond that wall, a cane-roofed timber pergola against a house with a timber balcony,
   a blue-and-white tiled bench and round topiaries.

**The grass patio and the pergola patio are not two neighbours across a party wall.** A
paved walkway, a hedge and the trunk-and-door wall lie between them. Nothing in the
photo can be identified as a wall running from a house face to the garden wall. IMG_2366
therefore does not show "the patio nearest Cervantes walled off from the patios north of
it", and it is not evidence for this divider. Three further points:

- **The same arrangement appears in IMG_2197.** That photo shows a hedged bare-earth bed
  with a magnolia, a terracotta lane, and a white wall with a trained trunk. Its heading
  is 58°, which is the bearing of Cervantes (59°).
- **The repo already places these features south of Cervantes.**
  `cervantes_east_south_patios.json` builds IMG_2366's trunk wall, curved-coping door and
  cane pergola there. This file's own top-level `trust` says the same, and so does the
  26 October review in `elena-patio-wall-correction/independent-review.md`. The new
  divider text contradicts all three without addressing them. Re-using IMG_2366's cane
  pergola for the Elena pergola counts one object twice.
- **The aerial does not support the grass patio being the band's Cervantes patio.** On the
  aerial that patio is grey-beige (mean RGB 180,169,157), not green. A green
  (87,105,88), white-edged rectangle at about x -153.8…-149.9, z 50.3…53.6 sits right
  beside the IMG_2366 camera pin (-152.2, 47.6). It is the more likely grass patio. I
  have not confirmed this, because the camera is not solved.

**What I cannot tell:** the exact camera pose (GPS ±3.9 m, no solved camera), or whether
the grass was laid after the aerial was flown. Even so, the photo's own layout of
walkway, wall and door stands between the two patios, whatever the camera pose.

## 3. The pergola move

The pergola's real source is IMG_2199 (and IMG_2200). A dark timber beam lies along the
top of the garden wall to the left (north) of the door. It is visible from the edge of
the raised coping, about 0.3 m north of the door leaf in the wall plane, to about 1.7 m
north. Its southern end is hidden behind the coping.

- **Where IMG_2199 puts the beam end.** The tagged camera is almost square-on to the door
  (lateral offset about 0.0 m, distance about 2.8 m). For a beam 0.4–1.5 m behind the
  wall, the visible south end then lies at about s = +0.2 … +0.5. That is at or just south
  of the divider.
- **Where the move puts it.** The new pergola's south edge is at s = -0.55. That is
  0.7–1.0 m further north than IMG_2199 suggests.
- **What the move fixes, and what it costs.** The move clears the wall, but it makes the
  match with the pergola's own photo worse.
- **A possible reading.** The pergola belongs to the north patio and its beam bears on or
  over the divider. That would explain both the photo and the aerial wall.

The aerial "pale block" north of the wall is not a clean rectangle:

- main patch: s = -2.9 … -1.6, t = 2.4 … 4.1;
- smaller patches: around (s -3.6, t 1.7) and (s -3.9, t 4.2).

It is brighter than the wall tops (mean 216,207,197). IMG_2366's cane is weathered
grey-brown, so the patch could as easily be a parasol, a sail or a table. It sits inside
the pergola's footprint, so it does not contradict the pergola, but it is not evidence of
a cane roof. The renderer draws rafters only, with no cane, which is consistent with the
real evidence.

A pergola north of the divider is plausible. The best-supported position is up against
the divider, not 0.45 m clear of it.

## 4. Renders

- **Layout** (`patios-layout.png`). The divider reads clearly as a full-height white wall
  with the same coping as the garden and Cervantes walls. It closes the patio band into
  a Cervantes patio and a pergola patio. At the garden wall end it meets the wall top
  flush (same 1.85 m height), just north of the door, which still opens into the
  Cervantes patio. At the house end it stops at the jog in the face and reads as joined
  at this scale.
- **Details** (`patios-details.png`). The wall is visible. The bougainvillea at
  (-144.90, 45.44) sits on the junction of the divider and the garden wall (s = +0.09,
  t = 5.05), which is fine. The pergola stands clear of the wall: about 0.45 m, with posts
  and rafters intact.
- **Nothing broken.** No z-fighting, no floating parts and no missing faces were visible.
  The other features are unchanged against `patios-before-details.png`.
- **Geometry.** The house end is not quite closed:
  - The wall ends at t = 0, but the registry face north of the jog is at t = -0.13,
    which leaves a slot of about 0.13 m. This is hidden at the render's scale but real in
    the geometry.
  - The wall's south face (s = +0.10) is 0.10 m north of the jog face (s = +0.20).
  - At the garden end, the divider runs to the garden wall centreline, overlapping it by
    0.13 m. That is clean.
- **Checks.** `scripts/check_elena_east_patios.py` passes. The map (`blueprint.ts`) and
  collision (`elenaEastPatioRings`) both read the shared `walls` list, so the divider is
  drawn on the map and is solid in collision.

## Fixes

**Fix 1 (required before merge): correct the evidence record.**

- Remove the IMG_2366 claim from the divider's `trust` and from its
  `confidence.json` "why".
- Say instead that the line comes from the georeferenced aerial (Esri World Imagery z19,
  `public/map/ground.jpg`) and the registry party-wall jog. They agree to about 0.15 m
  normal to the wall. No photo shows the wall, and its last 1.2 m to the garden wall lies
  under foliage on the aerial.
- `check_elena_east_patios.py` requires `evidence` to be a non-empty list of photos. Use
  `["IMG_2199.jpg"]`, described honestly as showing the garden wall at the junction and
  the beam that bounds it, not the divider. Alternatively, extend the check to accept the
  aerial as a source.
- Correct "about 1.6 m north of its closed door". It is 1.38 m from the door centre and
  0.90 m from the leaf's north edge.
- Update the outdated statements, which say that internal partitions are not modelled and
  are hidden from every roof camera:
  - this file's `scope`;
  - this file's top-level `trust`;
  - the "why" of `gap:elena-east-patios`.
  They should say that one partition is now built from the aerial.

**Fix 2 (recommended): pergola.**

- Remove "(IMG_2366 shows a cane-roofed pergola in these patios)" and the "cane roof"
  reading of the pale block. Both double-count `cervantes-east-south-pergola`.
- Move the pergola 0.3 m south, back towards the divider, so its south posts stand just
  clear of the coping (post faces at s = -0.18 … -0.21, coping at -0.13). That is
  0.9 m north of its original position instead of 1.2 m. New ring:
  `[[-145.124, 45.168], [-142.964, 43.909], [-144.324, 41.577], [-146.484, 42.836]]`
- Record the remaining tension in `data/discrepancies.json`: IMG_2199's beam seems to
  reach the divider line or south of it.
- Add "where the pergola beam meets the divider at the garden wall" to photo request
  `elena-east-patios-inside`.
- Keep the pergola `inferred`.

**Fix 3 (cosmetic): house-end join.**

- Shift the divider 0.10 m south, so its south face lies flush with the registry jog. The
  aerial reads +0.07, so this is within the evidence.
- Extend its start 0.1 m into the registry footprint, so there is no slot against the face
  north of the jog.
- New points: `[[-140.36, 42.75], [-145.28, 45.68]]`. The end stays on the garden-wall
  centreline, because the shift runs along the garden wall.
- With fix 3 applied, the divider's north coping edge moves to s = -0.03. The fix-2 ring
  then keeps about 0.15 m of post clearance. To sit just as close as fix 2 intends
  (about 0.05 m), move the pergola 0.4 m south instead. That ring is
  `[[-145.073, 45.254], [-142.913, 43.995], [-144.273, 41.663], [-146.433, 42.922]]`.

No other wall lines should be built in the band from this evidence.

## Author's response (after review)

All three of the reviewer's fixes are applied, apart from the join at the house end:
- **Fix 1, evidence:** the divider now cites the aerial and the registry party-wall jog. It states that no photo shows the wall, and uses the corrected 1.38 m door distance. The IMG_2366 claim is gone from the data, the confidence entries and the gaps, and the old scope and gap wording are updated.
- **Fix 2, pergola:** moved to the ring the reviewer gave. The cane-roof reading of the aerial's pale patch is dropped. The tension between the IMG_2199 beam and the divider is recorded as discrepancy `elena-east-pergola-divider`, and the photo request now asks for that junction.
- **Fix 3, house-end join:** not applied. It would put the wall's end inside the registry footprint, which `check_elena_east_patios.py` forbids, and the 0.1 m offset does not show at render scale.
