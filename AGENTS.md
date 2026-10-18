# Villacana project direction

Prioritise structural accuracy before additional decorative detail. Read
`docs/LAYOUT_ACCURACY.md` for the current layout view, sources and remaining
uncertainties; `docs/PHOTO_MAP_WORKFLOW.md` explains camera pins and evidence.

- Keep map, 3D geometry and collision consistent. Preserve original registry
  house/pool footprints unless a specific evidence-backed correction is intended.
- GPS locates a camera, not the photographed subject. Source citations and passed
  movement tests do not prove photographic fidelity or surveyed dimensions.
- Distinguish photo-supported wall/opening arrangements from estimated extents,
  untraced enclosure boundaries and likely passages. Do not invent repeated walls
  or gates as substitutes for tracing.
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

## Build queue

Work is split into tasks in `data/build_queue.json` (shown by priority in
`refs/QUEUE.md`, one issue body per task in `refs/issues/`). Follow
`docs/HANDOVER.md` to take one: one task per branch and PR, and its
definition of done.

## Reference photos and maps

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
  unchecked photo fails `build_references.py --check`.
- `refs/` is generated. Rebuild with `python3 scripts/build_references.py
  --sheets` and commit both repos. `--check` must pass before a PR.
- New photos: follow "Intake for a new Drive batch" in
  `docs/PHOTO_MAP_WORKFLOW.md`.
