# Graphics pilot: image-based lighting, ambient occlusion and a Blender-built facade kit in the north-pool courtyard

Task `blender-kit-pilot` · area **North pool** · priority P1 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from


## Build

Better lighting and surfaces for the whole scene (image-based lighting, filmic tone mapping, softer shadows, ambient occlusion on desktop, better plaster/terracotta/paving textures), and a kit of facade parts built headless in Blender by scripts/build_kit.py (arched louvred shutter doors with their moulded surround, wrought-iron balcony, wooden balcony with barrel-tile roof), exported as compressed glTF and placed by footprint data along the north-pool courtyard facades. Compare before/after through the solved photo cameras. IMG_2204-2206 were the dimension and evaluation references; no model feature in the evidence graph represents the kit, so they are compared in docs/reviews/blender-kit-pilot rather than recorded as photo checks. Left in progress: the reference check treats a done materials task as geometry needing verified placement packets, which the facade kit cannot have yet.

## Do not

No change to footprints, collision or ground. Keep the Layout view clear and ?photocam= renders working. Only CC0 or original assets.

## Done when

- [ ] Before/after renders through the solved IMG_2204-2206 cameras committed in docs/reviews/blender-kit-pilot
- [ ] Added download size and frame cost reported
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `blender-kit-pilot` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
