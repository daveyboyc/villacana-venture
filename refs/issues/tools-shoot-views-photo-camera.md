# scripts/shoot_views.cjs renders the whole-resort overview instead of the photo camera

Task `tools-shoot-views-photo-camera` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`, `docs/LANTERN_POST.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`, `src/lantern-post.ts`

## Photos to build from


## Build

node scripts/shoot_views.cjs IMG_xxxx (with or without --task/--as or --pose) now renders the whole-resort overview rather than the view from the photo's pin, on main as well (found 26 Nov 2026). Find which query parameter src/slice.ts no longer honours (compare the at=/look= and photocam= URLs the script builds with what slice.ts reads), fix the script or the page, prove it on IMG_3124 and IMG_2613, and note the fix in docs/HANDOVER.md. Package 1 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

No geometry change. Do not change Walk.

## Done when

- [ ] shoot_views.cjs IMG_3124 shows the green sliding door and the long wall, not the overview
- [ ] --pose --initial works for IMG_3099
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `tools-shoot-views-photo-camera` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
