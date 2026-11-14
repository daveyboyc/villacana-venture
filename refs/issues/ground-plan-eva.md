# Calle Eva: smooth paths, patios and green spaces with their edges and boundaries

Task `ground-plan-eva` · area **Calle Eva** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`, `docs/EVA_LANE.md`, `docs/ALBERTO_PASSAGE.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`, `data/eva_lane.json`, `data/alberto_passage.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`, `src/eva-lane.ts`, `src/clipped-plants.ts`, `src/alberto-passage.ts`

## Photos to build from


## Build

Trace the area's paths, patios and green spaces as smooth vector shapes from the georeferenced aerial and the photos, with what bounds each (kerb, brick border, planter wall, hedge, patio wall with openings, fence), and bring the existing features under the ground plan (eva_walled_lawn.json, the Eva lane strips (src/eva-lane.ts)). The raster ground classes give way to the traced shapes. Photo-check from the area's best cameras.

## Do not

Do not move registry footprints or pool rings without a measured correction. Keep lanes and openings clear. Untraced edges become gaps or inferred, never repeated invented walls. Leave Walk alone.

## Done when

- [ ] check_ground_plan.py passes for the area
- [ ] Photo checks recorded
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `ground-plan-eva` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `ground-plan-framework`
