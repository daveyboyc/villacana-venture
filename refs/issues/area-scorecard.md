# Per-area scorecard, visible while playing

Task `area-scorecard` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Generate public/scorecard.json with one entry per area in data/areas.json: plan and level fit against the laser survey, street and pool-deck misfits, roof heights, reference photos (tagged, placed, solved cameras and whether a station passed), traced versus generated facade-kit parts, open discrepancies and tasks, placement state, and a plain-language status. Show the scorecard for the area the player stands in, in Walk and Overview, with a link to the area brief.

## Do not

No fake percentages: show the inputs. No scorecard in automated comparison renders. No geometry changes.

## Done when

- [ ] build_scorecard.py --check passes and runs in the build
- [ ] Panel shows the right area at two spots and toggles (browser test)
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `area-scorecard` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
