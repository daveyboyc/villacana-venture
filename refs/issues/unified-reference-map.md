# One canonical resort map with overview and searchable photo references

Task `unified-reference-map` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Unify the current overview, detailed map and labelled photo evidence into one canonical entry. Give agents stable photo IDs, searchable subjects, source paths, copyable reference links and explicit camera-versus-subject positions. Include unplaced and private references without exposing private pixels. Trace the Barraka Beach boat example through this workflow.

## Do not

No competing OSM-based default map, hidden photo labels, unsupported location snapping or private image publication. Preserve local annotations and existing deep links.

## Done when

- [ ] Canonical entry offers overview, map/photos and walk modes using the existing shared geometry
- [ ] All catalogued references discoverable by ID and label; boat search finds actual boat references
- [ ] Stable links reopen selected photo and mode; reference text includes source and uncertainty
- [ ] Desktop/mobile browser regression and standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `unified-reference-map` set to done
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
