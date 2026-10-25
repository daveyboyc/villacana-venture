# Facade kit on every house: Blender doors, windows and balconies resort-wide

Task `facade-kit-resort` · area **The whole resort** · priority P1 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Extend the north-pool facade kit (facade-kit-traced) to every house: walls traced in data/facade_kit.json keep their parts, all other walls get generated doors, shuttered and arched windows and balconies from the kit instead of flat shutter planes. Keep it in the Details view, instanced, and cheap on small screens.

## Do not

No change to footprints, ground or collision. No new heavy assets.

## Done when

- [ ] Whole-resort Details view draw calls and frame time measured before and after
- [ ] Layout and mobile views stay usable
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `facade-kit-resort` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `facade-kit-traced`
