# Smooth ground plan: shared vector paths, patios and green spaces with their edges and boundaries

Task `ground-plan-framework` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`, `docs/LANTERN_POST.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`, `src/lantern-post.ts`

## Photos to build from


## Build

Dave (13 Nov): the paths are clunky and should be smooth throughout the model, with the correct walls and boundaries for patios and green spaces. Turn the main-pool pilot (src/smooth-path.ts) into a shared ground plan, as docs/SMOOTH_PATHS.md describes: a data file per area of paths (centreline, width, finish), patios and green spaces (outline, finish, raised height) and their edges (none, kerb or brick border, planter wall, hedge, patio wall with height and openings, fence), each with evidence and confidence; a renderer drawing smooth unioned surfaces with rounded joins (hard corners where a shape says so) laid on the surveyed ground, edges along the same outlines, and the ground texture mask painted from the same polygons where an area is traced; scripts/check_ground_plan.py. Move the main-pool lawn onto it first.

## Do not

Do not move registry footprints or pool rings. Keep protected routes clear and openings open unless a photo shows them shut. Do not invent walls or gates to fill untraced edges: record them as gaps or build them as inferred. Leave Walk alone.

## Done when

- [ ] The main-pool lawn draws from the ground plan with no visible change
- [ ] check_ground_plan.py passes
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `ground-plan-framework` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
