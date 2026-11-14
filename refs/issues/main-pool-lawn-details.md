# Main pool lawn: pink paths, deck and step finish

Task `main-pool-lawn-details` · area **Main pool** · priority P1 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`, `docs/SMOOTH_PATHS.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`, `data/main_pool_lawn.json`, `data/ground_plan_main_pool.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`, `src/main-pool-lawn.ts`, `src/ground-plan.ts`

## Photos to build from

- `public/photos-ref/IMG_2764.jpg`: Main pool lawn and the wave-roofed building (ground — pin ±3.8 m; looks at tall slender palm on the main-pool lawn, the pool and the wave-roofed building beyond)
- `public/photos-ref/IMG_2765.jpg`: Main pool lawn and wave-roofed building, second view (ground — pin ±3.9 m; looks at pink path to the main pool, the tall palm at the pool corner and the wave-roofed building)
- `public/photos-ref/IMG_2603.jpg`: Pink lawn path with bollard lights and a pool-side white curved-roof building (ground — pin ±2.2 m; looks at pink lawn path to the main pool with bollards and a slatted bin beside it)
- `public/photos-ref/IMG_2761.jpg`: Lawn and pink path towards the seafront railing (ground — pin ±2.9 m; looks at lawn beside the pink path: square service lid, bin and bollard, the hedge along the sea railing)
- `public/photos-ref/IMG_2762.jpg`: Strelitzia in a white walled corner on the lawn (ground — pin ±2.6 m; looks at strelitzia and silver bush in a white walled corner on the lawn)
- `public/photos-ref/IMG_2763.jpg`: Pink path curving round a white wall to the sea fence (ground — pin ±2.9 m; looks at flagstone path between the hedge and the round white wall, mesh sea fence beyond)
- `public/photos-ref/IMG_2602.jpg`: Arched white gate pillar with iron gate, signs and bollard light at the lawn corner (ground — pin ±2.3 m; looks at coastal lawn gate pier and iron gate)
- `public/photos-ref/IMG_2775.jpg`: Lane down to the pool building with slot drains (ground — pin ±4.7 m; looks at Enrique's shop front with three blue awnings at the head of the steps)
- `public/photos-ref/IMG_2776.jpg`: Steps and ramp at the foot of the lane by the pool building (ground — pin ±4.7 m; looks at marble-nosed blue-tiled steps up to Enrique's shop beside the lantana planter)
- `public/photos-ref/IMG_2777.jpg`: Marble-edged steps down to the main pool deck (ground — pin ±2.0 m; looks at marble nosing and blue risers at the top of Enrique's steps, terracotta paving and the pool below)

## Build

From the November lawn and step photos: pink resin paths, the flagstone apron at the existing arched gate, bollard lights and slatted bins, the short white walls and strelitzia bed, a hedge and shower in front of the sea railing, a terracotta patch at the foot of the steps (the lawn views show a pale deck), and marble nosings, blue risers, a handrail, lantana and a fan palm on Enrique's steps, plus the shop awning at their head. The iron leaf on the beach gateway is drawn open.

## Do not

Do not move the registry pool rings. Do not replace the green bar railing, which the closer paseo photos set. Do not close the gateway. Leave Walk alone.

## Done when

- [ ] scripts/check_main_pool_lawn.py passes
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `main-pool-lawn-details` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
