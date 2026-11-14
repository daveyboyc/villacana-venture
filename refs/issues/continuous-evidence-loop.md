# Continuous model development: tracked discrepancies, scoped photo/map requests and current acceptance

Task `continuous-evidence-loop` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`, `docs/LANTERN_POST.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`, `src/lantern-post.ts`

## Photos to build from


## Build

Extend the graph with persistent discrepancies and scoped evidence requests. Provide an area command, acceptance packets, generated work reports, scorecard flags and recurring validation. Continue supported work while specific evidence is missing.

## Do not

No geometry changes, invented photographic matches, automatic approvals, or closure of the original five loop tasks without completing their definitions.

## Done when

- [ ] Adversarial acceptance and scoped blocker tests pass
- [ ] Graph, scorecard and work report regenerate consistently
- [ ] Production build and Inspect/map browser checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `continuous-evidence-loop` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
