# Calle Eva: the tiled lane with aggregate margins, white kerbs, lawns, beds and lanterns

Task `eva-lane-details` · area **Calle Eva** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`, `docs/EVA_LANE.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`, `data/eva_lane.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`, `src/eva-lane.ts`

## Photos to build from

- `public/photos-ref/IMG_2336.jpg`: Calle Eva east of the middle pool: tiled path between lawns (ground — pin ±3.3 m; looks at Eva tiled lane beside lawns, clipped trees and dark lantern posts)
- `public/photos-ref/IMG_2504.jpg`: Long tiled path to an arched iron gate (ground — pin ±2.8 m; looks at Eva tiled lane looking south-west to the middle pool east gateway: white rounded kerb and hedge on the left, lawn on the right)
- `public/photos-ref/IMG_2677.jpg`: Calle Eva path to the middle pool east gateway with bougainvillea and house beyond (ground — pin ±2.7 m; looks at Eva tiled lane at the middle pool east gateway: kerbed bed on the left, lawn with a tiled spur and clipped hedge on the right)
- `public/photos-ref/IMG_2676.jpg`: Terracotta path between hedge and lawn at the Teodoro Rojo end of Calle Eva (ground — pin ±2.9 m; looks at Eva tiled lane looking south-west: grey aggregate margins, white raised kerb and hedge on the left, lawn on the right)
- `public/photos-ref/IMG_2553.jpg`: Calle Eva west footpath looking east between white houses and a planted bed (ground — pin ±2.6 m; looks at Eva west stretch looking north-east from the Dali end: kerbed lawn left, kerbed planted bed right)
- `public/photos-ref/IMG_2551.jpg`: Calle Eva west footpath at the Dali end, terracotta path beside a lawn island (ground — pin ±3.5 m; looks at Eva west stretch looking south-west to the Dali car park: kerbed bed left, kerbed lawn island and lantern right)
- `public/photos-ref/IMG_2552.jpg`: Curved kerbed footpath meeting the Dali car park aisle (ground — pin ±3.1 m; looks at Eva west end: the tiled path curving onto the Dali footpath between white kerbs, slot drain, lawn and lantern)
- `public/photos-ref/IMG_2549.jpg`: Calle Eva: lane between a white wall and planted beds, towards the middle pool (ground — pin ±3.8 m; looks at Eva west stretch looking south-west between a white wall and a raised planted bed)

## Build

Along the photographed stretches of Calle Eva (east gateway to the Teodoro Rojo junction, and the west stretch from the middle pool corner to the Dali car park), dress the lane as the photos show it: four large square terracotta tiles across with pale grey joints, a grey exposed-aggregate margin each side, a white rounded raised kerb where a bed or lawn is kerbed, flush lawn where it is not, planted beds against the houses, and in Details the clipped hedges, round trees and black lantern posts. Measure the lane against the east gateway and the house fronts from solved cameras.

## Do not

Do not build Eva east of the Teodoro Rojo junction (no photos; photo request eva-east). Do not model the covered passage off Eva (gap:eva-covered-passage). Do not move registry footprints or the middle pool east gateway. Do not start walking or collision work.

## Done when

- [ ] Before/after renders through each photo's camera, recorded in data/photo_checks.json
- [ ] Kerb, lawn and bed extents graded estimated or inferred in data/confidence.json
- [ ] Lane offset against the east gateway measured, not guessed
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `eva-lane-details` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
