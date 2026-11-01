# Differences between the model and the photos

Step 2 of the photo-to-model loop (`docs/PHOTO_LOOP_PRD.md`). The model is rendered through a
photo's solved camera and laid beside and over the photo; every visible difference becomes one
record in `data/discrepancies.json`. Fixing one is a work item; closing one needs evidence and a
second agent's review.

## Finding them

```bash
node scripts/shoot_views.cjs IMG_2204 IMG_2205 IMG_2206 --pose --details    # render through each solved camera
python3 scripts/compare_photo.py IMG_2204 IMG_2205 IMG_2206 --task <task>     # render, 50% blend, numbered side-by-side
python3 scripts/pixel_to_map.py IMG_2204 1295 848                             # where a pixel meets the ground, ± metres
#   add or edit records in data/discrepancies.json
python3 scripts/pixel_to_map.py --discrepancies --write                      # cast every contact pixel, store positions
python3 scripts/compare_photo.py IMG_2204 IMG_2205 IMG_2206 --task <task>     # again, now with the numbered regions
python3 scripts/build_references.py                                           # graph, brief, scorecard, map
```

Look at the photo and the render at full size, part by part (`compare_photo.py` writes
`<photo>-blend.jpg`; crop and zoom it): the pool and deck, steps and fittings, walls, paths and
steps, lawn, planting, parasols and furniture, facades, openings, balconies, awnings, roofs and
what stands on them, then the surroundings. A thing in one photo only still counts. Things Dave
has decided not to model (the glass pool fence) are recorded as `wont-fix` with his reason, so the
comparison accounts for everything in the frame.

## A record

| Field | Meaning |
| --- | --- |
| `id` | lower-case words joined by hyphens, unique (`np-pump-box-position`) |
| `area` | an area of `data/areas.json` |
| `kind` | `missing` (in the photo, not the model), `extra` (in the model, not the photo), `shape`, `position` or `look` (material, colour, species, size) |
| `description` | what differs, in plain words, with the model's value where it has one |
| `photos` | one entry per photo region: `photo` (catalogue id), `region` `[left, top, right, bottom]` in the photo's pixels (the same pixels in the render), optional `points` `[[u, v], ...]`, and optional `contact` `[u, v]`: a pixel where the thing meets the ground or a known height. `contactHeight` is `"ground"` (default; the model ground, `src/terrain.ts` `siteY`) or a height in scene metres (for a trunk foot on a raised terrace, a parasol canopy), with `heightSigma` its one-sigma uncertainty. `cast` is written by `pixel_to_map.py`: that photo's own position and uncertainty. A photo may appear more than once for separate regions. |
| `at`, `uncertaintyM` | map position `[x, z]` (+x east, +z south) and its uncertainty in metres, or `null` |
| `positionBasis` | how `at` was found (written by `pixel_to_map.py` for contact pixels), or why there is none |
| `features` | what it concerns: model features in the evidence graph (`pool:north`, `raised_terraces.json:...`, `building:<id>`, `street:<id>`), props in `data/objects.json` (`objects.json:o4`), known gaps (`gap:...` in `data/confidence.json`) or a proposed new feature (`proposed:<what>`) |
| `status` | `open`, `fixed` (changed, awaiting review), `closed` (reviewed) or `wont-fix` |
| `followUp` | the open task in `data/build_queue.json` that will fix it (required while open) |
| `reason` | for `wont-fix`: whose decision and why |
| `fix` | `{evidence: [committed files: re-renders, overlays, residuals], note}`; required for `fixed` and `closed` |
| `reviewer` | `{id, date, note}`, an agent or person other than the author; required for `closed` |
| `created`, `author` | when and by whom it was recorded |

Records are numbered per area in file order (D1, D2...): the comparison images, the area brief and
the map use the same numbers, so append new records rather than reordering.

## Positions

`scripts/pixel_to_map.py` casts the ray through a pixel of a solved camera (`data/photo_poses.json`,
the renderer's convention in `src/photo-camera.ts`) until it meets the model ground or the stated
height. Its uncertainty re-casts the pixel through 400 cameras drawn from the solve's one-sigma
`sigma`, with a 3 px pick error and the height's own sigma. The parameters are drawn independently,
which ignores how the solve ties them together, so near the pool the figure (about 1-1.5 m at 20 m)
overstates the error: at the north pool the three cameras put the same ground point within 0.2-0.7 m
of each other. Several photos give an inverse-variance mean; photos from one station share its
position and lens errors, so the combined uncertainty is the best single photo's, or half the
cameras' disagreement when that is larger. Only a pixel where the thing meets the ground or a known
height gives its position: a crown or a roof casts past it.

## Checks and where they show

- `scripts/discrepancies.py --check` (and `scripts/build_references.py --check`, run in CI) fails on
  an unknown area, photo, feature, object, gap or task; a region outside the image; a contact pixel
  without a solved camera; an open record without a follow-up; a `wont-fix` without a reason; a
  `fixed` or `closed` record without committed evidence; a `closed` one without a different
  reviewer; or a stored position the cameras no longer give (re-run `pixel_to_map.py --discrepancies --write`).
- `refs/graph.json`: a `photo-discrepancy:<id>` node each, with `in-area`, `seen-in` (photos),
  `concerns` (model features) and `follow-up` (task) edges.
- `refs/areas/<id>.md`: "Differences from the photos", every record with its number and position.
- Scorecard (`docs/SCORECARD.md`): open, fixed, closed and won't-fix counts per area; open or fixed
  records keep an area amber.
- Map & photos: the **Differences** button shows a numbered pin, coloured by kind, at each position
  with a dashed ring of its uncertainty; tap one for the description and photos (`src/differences.ts`).

## Closing one

A geometry fix closes only with measured evidence (`docs/PLACEMENT_VERIFICATION.md`, "Measured
approval"): the re-render lines up through the cameras, residuals within tolerance. A look (material,
species) closes on a recorded side-by-side judgement. Set `status: fixed` with `fix.evidence` and
`fix.note`; a second agent that did not make the change looks at the evidence and sets `closed`
with `reviewer`. A difference that cannot be fixed without new photos becomes a photo request
(`data/photo_requests.json`) rather than a guess.
