# Calle Eva: clipped shrub and tree shapes, climbers on the house walls

Task `eva-planting-shapes` · area **Calle Eva** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`, `docs/EVA_LANE.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`, `data/eva_lane.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`, `src/eva-lane.ts`

## Photos to build from

- `public/photos-ref/IMG_2503.jpg`: Eva tiled footpath beside lawn with magnolia and lamp post (ground — pin ±2.8 m; looks at North-east end of the Eva lawn: the kerbed bed with a clipped oleander, the lantern and the round clipped tree, looking west across the lawn to the walled corner)
- `public/photos-ref/IMG_2504.jpg`: Long tiled path to an arched iron gate (ground — pin ±2.8 m; looks at Eva tiled lane looking south-west to the middle pool east gateway: white rounded kerb and hedge on the left, lawn on the right)
- `public/photos-ref/IMG_2677.jpg`: Calle Eva path to the middle pool east gateway with bougainvillea and house beyond (ground — pin ±2.7 m; looks at Eva tiled lane at the middle pool east gateway: kerbed bed on the left, lawn with a tiled spur and clipped hedge on the right)
- `public/photos-ref/IMG_2549.jpg`: Calle Eva: lane between a white wall and planted beds, towards the middle pool (ground — pin ±3.8 m; looks at Eva west stretch looking south-west between a white wall and a raised planted bed)
- `public/photos-ref/IMG_2553.jpg`: Calle Eva west footpath looking east between white houses and a planted bed (ground — pin ±2.6 m; looks at Eva west stretch looking north-east from the Dali end: kerbed lawn left, kerbed planted bed right)

## Build

Replace the box hedges in the Eva beds with clipped, rounded shrub shapes of the photographed heights (low box edging on the west bed, about 0.8 m shrubs on the east bed, the rounded oleander at the north-east end), give the round clipped tree a less spherical crown, and add the jasmine and bougainvillea climbers on the house walls behind the beds as flat wall-aligned planes.

## Do not

Keep every plant footprint clear of the protected routes; do not move the lane, kerbs or beds (eva-lane-details).

## Done when

- [ ] IMG_2503 render no longer shows a cube hedge
- [ ] Climbers cite the photos that show them
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `eva-planting-shapes` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `eva-lane-details`
