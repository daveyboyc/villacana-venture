# Calle Alberto 22-40: the covered porch off Calle Eva east, and its likely passage

Task `alberto-passage-porch` · area **Calle Eva** · priority P2 · facades

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`, `docs/EVA_LANE.md`, `docs/ALBERTO_PASSAGE.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`, `data/eva_lane.json`, `data/alberto_passage.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`, `src/eva-lane.ts`, `src/clipped-plants.ts`, `src/alberto-passage.ts`

## Photos to build from

- `public/photos-ref/IMG_2792.jpg`: Passage mouth with a CALLE ALBERTO 22-40 sign (ground — pin ±4.7 m; looks at The CALLE ALBERTO 22 40 covered porch: arch, red studded ramp, tiled step, plaque and AGUA POTABLE hatch on the back wall)

## Build

Build the porch IMG_2792 shows in the recess of registry block 6265601UF1366N_part1: arch on square piers, red studded ramp, tiled step platform with a potted jade, CALLE ALBERTO 22 40 letter tiles and an AGUA POTABLE hatch on the back wall, the house closed over it. Draw the likely passage to the block's inner courtyard as inferred on the map; do not cut it through the house until photos show it.

## Do not

Do not invent the passage's turn or line in 3D; do not move registry footprints.

## Done when

- [ ] Before/after render through IMG_2792's camera recorded in data/photo_checks.json
- [ ] Porch estimated and route inferred in data/confidence.json; tunnel listed as a gap
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `alberto-passage-porch` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
