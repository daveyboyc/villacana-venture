# Villacana project direction

## Current focus (Dave, 2026-10-31)

The goal for now is a good, detailed 3D model of Villacana that looks like the
photos when inspected, not a walkable game. Prefer work that makes what you see in
Inspect closer to the photos: pools, materials and surfaces, facades, planting and
small built details. Walking is paused: do not start work whose purpose is
walking, collision, route connectivity or Walk-scene integration, and leave Walk
working as it is. The path, tunnel and boundary inventories still matter where they
fix what the model shows, but they no longer come first. Detail still goes on
geometry the evidence supports; it no longer waits for every route to be mapped.

Prioritise structural accuracy alongside photo-matched detail. Read
`docs/LAYOUT_ACCURACY.md` for the current layout view, sources and remaining
uncertainties; `docs/PHOTO_MAP_WORKFLOW.md` explains camera pins and evidence.

- Keep map, 3D geometry and collision consistent. Preserve original registry
  house/pool footprints unless a specific evidence-backed correction is intended.
- GPS locates a camera, not the photographed subject. Source citations and passed
  movement tests do not prove photographic fidelity or surveyed dimensions.
- Follow `docs/PLACEMENT_VERIFICATION.md` before changing geometry. Declare the
  task's affected feature IDs; save measured overlays/comparisons, keep open
  discrepancies, and obtain independent review of actual maps/full-size photos.
  Only a current `placement-verified-by` graph edge grants scoped placement
  approval. Photo diagnostics and earlier task completion cannot grant it.
- Run `scripts/check_placement_changes.py --base origin/main` after regenerating
  references. Fix every Evidence graph failure your change can fix; a red placement
  gate does not hold up the merge (see Merging), but say in the PR what it flags.
  Do not bypass a disputed/stale placement by deleting reports, inventing review
  identities, changing task kind or treating unavailable calibration as a match.
- Distinguish photo-supported wall/opening arrangements from estimated extents,
  untraced enclosure boundaries and likely passages. Do not invent repeated walls
  or gates as substitutes for tracing.
- Every feature has a confidence level shown by the map/Overview "Sure / unsure"
  overlay (`docs/CONFIDENCE.md`): photographed, estimated, inferred, plus known gaps.
  When you build or change a feature, set its level and reason in `data/confidence.json`.
  Structure that is plainly there but only partly visible or seen only on the aerial
  may be built as `inferred` (orange) instead of being left out; never grade it
  photographed. Record anything left out under `gaps`. Respect Dave's decisions there:
  `accepted` means leave it alone, `needs-photos` means improve it when photos arrive.
- Default to the clear Layout view. Decorative objects must respect the shared
  route-clearance guard, including their visible footprint. Keep Details optional.
- Buildings keep a level datum, opaque materials and extrusion material groups.
  Terrain refinement is for ground surfaces and must preserve drawable groups.
- For geometry/collision/terrain changes, run relevant source and route checks,
  production build and the layout browser regression test. Summarise the observed
  outcome and remaining accuracy limits rather than claiming the whole resort is
  fully verified.
- Keep Google keys in ignored private environment files. Never publish API keys,
  signed download URLs, original photo metadata blobs or fetched Google imagery.

## Merging

Dave's rule: never wait for him. When your work is done and its checks pass, merge
your own PR into `main` yourself (or push straight to `main`) and push. Do not leave
a PR open for approval. If a check is red for a reason outside your change, such as
the placement gate flagging a renderer edit, merge anyway and record in one PR
comment what failed and why.

## Build queue

Work is split into tasks in `data/build_queue.json` (shown by priority in
`refs/QUEUE.md`, one issue body per task in `refs/issues/`). Follow
`docs/HANDOVER.md` to take one: one task per branch and PR, and its
definition of done.

## Reference photos and maps

Use the canonical app root (`/?view=map`) for maps and photos, not separate
worlds. Find sources by ID/place/visible subject with
`python3 scripts/find_reference.py <query> [--area <id>] [--json]` or search
`public/reference-index.json`. It includes private and unplaced references and
stable `?view=map&photo=<ID>` links. Open full images at the returned source path;
a thumbnail, citation or camera pin is not proof of the pictured location.
Do not revive the retired OSM default or simplified photo-map renderer.

Before a new scene build, use `docs/REFERENCE_PACK_WORKFLOW.md` to inventory
visible openings, covered connections, levels and boundaries with numbered source
references. Keep uncertain identities/connections explicit. A material citation
does not account for an entire structure. Update an existing pack when applicable.

All reference material is catalogued by area. Before changing anything in an
area, read `refs/README.md`, then that area's brief in `refs/areas/<id>.md`, and
look at its contact sheet in the private `villacana-reference` repo
(`contact-sheets/<id>.jpg`). The brief lists the area's photos, map
screenshots, docs, data and source files, known facts and open questions.
For cross-cutting work (slopes, paving, planting) use `refs/topics/<id>.md`.
Heights (slopes, steps, raised patios) are in `data/levels_survey.json`, read
from the photos; see `docs/LEVELS.md` and check with `scripts/check_levels.py`.

- Areas and topics are fixed in `data/areas.json`. Do not invent new ids in a
  tag; add the area there first if one is genuinely missing.
- What a picture shows goes in `data/reference_tags.json` (`shows`,
  `viewpoint`, `useFor`, `looksAt`, `subject`, `note`). Tag only after looking at the image. A
  camera position is only a suggestion: roof and upper-floor shots stand
  inside a building and show areas far away.
- After building something from a photo, cite it in that feature's
  `evidence`, and add any new fact or open question to the area's `notes`.
- A citation is not a check. Render the build from each photo's camera
  (`scripts/shoot_views.cjs --task=<id> --as=after`), compare it with the photo,
  and record the result in `data/photo_checks.json`; a done task with an
  unchecked photo fails `build_references.py --check`. These remain photographic
  diagnostics, separate from the measured placement gate and its limitations.
- To measure rather than eyeball, solve the photo's camera and render through it
  (`docs/PHOTO_ALIGNMENT.md`: `scripts/photo_pose.py`, `shoot_views.cjs --pose`).
  Held-out checks give the model's misfit in metres; they are not placement approval.
- Each area's scorecard (`docs/SCORECARD.md`, `refs/SCORECARD.md`, a panel in the game, colours
  on the map) is red while photos are wanted there (`data/photo_requests.json`), amber while photos
  or build work wait, green when nothing is open, and counts what is measured there. Add a photo
  request instead of guessing when a build needs a view nobody has taken. Re-run
  `scripts/build_scorecard.py measure` after changing ground, footprints or the facade kit;
  it is a summary, not placement approval.
- Ground levels, street slopes and roof heights can be measured against the national
  laser survey (`scripts/lidar_check.py`, docs/reviews/lidar-levels). Check a level or
  height change there before building it.
- `refs/` is generated. Rebuild with `python3 scripts/build_references.py
  --sheets` and commit both repos. `--check` must pass before a PR.
- New photos: follow "Intake for a new Drive batch" in
  `docs/PHOTO_MAP_WORKFLOW.md`.
