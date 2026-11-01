# PRD: photo-to-model loop

**Status:** approved by Dave, 1 November 2026. Pilot area: the north pool.
**Owner:** Dave. **Delivery:** agents, one slice per task and PR (`data/build_queue.json`).

## 1. Intent

Dave should only have to upload photos. An agent then finds where the model differs
from the photos and maps, fixes it, and proves the fix by measurement, until the model
looks like the real place from every photographed viewpoint.

Today the reference graph records sources, citations, camera poses and checks, but it
does not find or close differences. Of 166 photos, 7 have solved cameras; of 48 photo
checks, 44 are "not comparable"; no placement review has ever been recorded, so every
geometry change is "not verified" and agents avoid correcting shapes. Dave found three
misses at the north pool after five build steps: the pool's shape (the squared deck
tongue east of the steps), the white pump box's position, and missing parasols,
plants and trees. The loop must catch differences like these without Dave pointing
them out.

## 2. The loop

For an area:

1. **Cameras.** Every photo that shows the area gets a solved camera, or a recorded
   reason why it cannot (no landmarks, too close, blurred).
2. **Compare.** The model is rendered through each solved camera, beside and over the
   photo. An agent lists every visible difference: missing, extra, wrong shape, wrong
   place, wrong look. Each becomes a **discrepancy** record with the photo, pixel
   region, what differs, and, where the camera geometry allows, a map position from
   the camera ray meeting the ground (or a known height).
3. **Fix.** Each open discrepancy is a work item. An agent fixes it in the model data
   or renderer and re-renders.
4. **Prove.** A discrepancy closes only when the re-render lines up: measured residual
   within tolerance for placement (see "Measured approval" in
   `docs/PLACEMENT_VERIFICATION.md`), or a recorded side-by-side judgement for looks
   (material, plant species), reviewed by a second agent.
5. **Score.** Each area reports open and closed discrepancies, solved cameras, and
   measured residuals, so "how close is it?" has a number.

Uploading new photos to the Drive folder and asking an agent to "run the loop" starts
steps 1-5 for the areas those photos show.

## 3. Requirements

- **Discrepancies live in the graph.** `data/discrepancies.json` (one record per
  difference: id, area, photos with pixel regions, kind, description, map position and
  uncertainty, feature IDs, status open/fixed/closed/wont-fix, evidence of the fix,
  reviewer). They appear in `refs/graph.json`, the area brief, the scorecard and the map.
- **Pixel to map.** A script turns a pixel in a solved photo into a map position by
  intersecting the camera ray with the model ground (or a stated height), with the
  uncertainty from the camera's solved sigma.
- **Comparison artifacts.** For each solved camera: photo, render, a blended overlay and
  a labelled side-by-side, saved under `docs/reviews/<task>/`.
- **Camera solving at scale.** Solving a camera must not need hand-picked control points
  for every photo: propose correspondences automatically (model edges, pool rings,
  building corners, aerial landmarks) and let the agent confirm them; report held-out
  residuals.
- **Measured approval in the gate.** `scripts/placement_verification.py` accepts the
  measured-approval records, so a correctly measured, agent-reviewed change turns the
  gate green instead of red.
- **Honest limits.** Features no photo shows stay estimated or inferred. A discrepancy
  that cannot be fixed without new photos becomes a photo request
  (`data/photo_requests.json`), not a guess.

## 4. Slices

Each slice is one build-queue task, one GitHub issue and one merged PR, and is
demonstrated on the north pool.

| Task | What it delivers | After |
| --- | --- | --- |
| `loop-discrepancies` | Discrepancy records, pixel-to-map projection, comparison artifacts, and a first full comparison of IMG_2204-2206 at the north pool listing every difference (including pool shape, pump box, parasols, plants, trees). Shown in graph, brief, scorecard and map. | - |
| `loop-measured-approval` | `placement_verification.py` and `check_placement_changes.py` accept measured, agent-reviewed records; tests. | - |
| `loop-north-pool-fixes` | Fix the north pool discrepancies: pool ring and deck tongue, pump box, parasols, plants, trees, and anything else listed; each closed with residuals and a second-agent review. | both above |
| `loop-camera-solving` | Semi-automatic camera solving; solve IMG_2207, IMG_2208 and every other north-pool photo that can be solved; record reasons for the rest. Re-run the comparison through the new cameras. | `loop-discrepancies` |
| `loop-photo-intake` | One command (`scripts/photo_loop.py --area <id>`) and an agent recipe: new Drive photos are imported, tagged, solved, compared and turned into discrepancies and tasks. Documented for Dave as "upload, then ask an agent to run the loop". | all above |

## 5. Out of scope for now

Walking and collision (paused), areas other than the north pool until the pilot loop
works, and photogrammetry or scans.
