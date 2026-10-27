# Beach gateway beside the paseo ramp, survey paseo levels, grass and shrubs in front of the railings

Task `beach-gate-verge` · area **Main pool** · priority P1 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`

## Photos to build from

- `public/photos-ref/IMG_2226.jpg`: From the beach looking back at the resort frontage (ground — pin ±2.0 m; looks at big-pool lawn frontage: white railings, Guillermo gateway at left)
- `public/photos-ref/IMG_2488.jpg`: Calle Guillermo from its seaward end, looking up the lane (ground — pin ±4.7 m; looks at Calle Guillermo from its seaward end)

## Build

Dave (27 Oct): the beach entrance from the big pool is not at the end of the slope but to its left looking at the beach, the height there is wrong, and there is grass and planting in front of the gateway and the railings alongside Barraka. Move the arched gateway to the lawn's south-west corner (aerial, IMG_2226 bearing), wall the paseo ramp beside it, take the paseo and Guillermo levels from the laser survey (data/main_pool.json seafront profile, data/terrain.json), and outline the verge (data/beach_verge.json).

## Do not

Do not invent gate leaves or fences not seen; keep the verge a rough outline until close photos arrive; shrubs are Details only.

## Done when

- [ ] check_seafront_fence, check_pool_levels, check_lowered_lanes, check_beach_verge pass
- [ ] paseo within 0.25 m of the survey from the Guillermo foot to Barraka
- [ ] layout, overview and photo-map browser tests pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `beach-gate-verge` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
