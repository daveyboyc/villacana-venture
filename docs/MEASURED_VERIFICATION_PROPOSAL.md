# Proposal: let measurements verify placement

Status: **proposal for Dave to decide**. Nothing here is in force; `docs/PLACEMENT_VERIFICATION.md`
and `scripts/check_placement_changes.py` are unchanged.

## The problem

- **No feature has ever passed.** Approval needs an independent reviewer with a different
  identity, who is not the author. No such person exists in this project, so 0 of 359 model
  features are verified.
- **Every renderer change fails.** Editing any non-UI file under `src/` changes the shared renderer
  digest, and the gate flags every feature (230 on PR #117), whether or not any geometry moved.
  PRs #110–#117 were all merged with the check red, so the check no longer tells anyone
  anything.
- **The current evidence is weak.** The packets ask for hand-entered pixels, transforms and
  residuals. The validator checks their arithmetic and hashes, but not that they describe the image.

Meanwhile there are now two independent, repeatable measurements:
- **Solved photo cameras** with held-out checks (`scripts/photo_pose.py`, `docs/PHOTO_ALIGNMENT.md`).
- **The national laser survey** (`scripts/lidar_check.py`, `docs/reviews/lidar-levels`).

## Proposal

**1. Fail only when exported geometry changes.** In CI, export the model on the base and head
commits (`node scripts/shoot_views.cjs --model`: buildings, pools, the 2 m walkable-ground grid)
and compare them. Identical exports mean the renderer edit moved nothing that the export
covers. Only features whose exported geometry differs need approval. Features the export does
not cover yet (walls, steps, planters) keep today's rule until the export includes them. This
needs Playwright in the Evidence graph workflow, about a minute per run.

**2. A measured route to `placement-verified-by`**, alongside today's packet route:

| Feature kind | Measurement | Passes when |
| --- | --- | --- |
| Ground levels, streets, pool decks | `lidar_check.py` against the 1 m survey ground model | within 0.3 m along the feature |
| Roof heights | `lidar_check.py`, roof surface above the building's ground | median within 0.3 m |
| Footprints, walls, gates, steps seen in photos | held-out checks through a solved station camera | every check within 0.3 m, and the station solve stable (each photo alone within 2 m) |

The measurements come from the committed script, rerun in CI, never typed in by hand.

**3. Dave's own approval is the review.** The reviewer is the repository owner approving the PR
on GitHub. That is an authenticated identity, which today's free-text reviewer field is not.
Agents never approve. A discrepancy stays open until a measurement inside tolerance resolves it.

## What stays

- Discrepancy history, supersession and the ban on deleting reports stay as they are.
- A survey grid's limits are stated with each measurement: 1 m ground, 2 m roofs, about 1 m in
  plan. Nothing is called verified more precisely than its source allows.
- Photo checks by eye stay as diagnostics.

## What it would take

| Change | Size |
| --- | --- |
| Base-versus-head export comparison in `check_placement_changes.py` and the workflow | about a day |
| `lidar_check.py` writing per-feature results the graph can read; feature kinds mapped to the table above | about a day |
| `photo_pose.py` checks keyed by feature ID; a `verified-by-measurement` edge in `build_references.py` | about a day |
| Policy tests for each route, including failures | half a day |
