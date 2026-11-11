# A realistic lantern post, replacing the stand-in lamps

Task `lantern-post-asset` · area **The whole resort** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`, `docs/LANTERN_POST.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`, `src/lantern-post.ts`

## Photos to build from

- `public/photos-ref/IMG_2552.jpg`: Curved kerbed footpath meeting the Dali car park aisle (ground — pin ±3.1 m; looks at Eva west end: the tiled path curving onto the Dali footpath between white kerbs, slot drain, lawn and lantern)
- `public/photos-ref/IMG_2597.jpg`: Calle de Jorge sign post beside the lawn wall and tiled path, mountain beyond (ground — pin ±2.6 m; looks at Calle de Jorge sign post)
- `public/photos-ref/IMG_2336.jpg`: Calle Eva east of the middle pool: tiled path between lawns (ground — pin ±3.3 m; looks at Eva tiled lane beside lawns, clipped trees and dark lantern posts)
- `public/photos-ref/IMG_2234.jpg`: Tiled lane with a wall plaque, lamp post and lawn (ground — pin ±3.1 m; looks at square tile path, CALLE DE TEODORO plaque and a black lamp)

## Build

Model the resort's traditional lamp post once (src/lantern-post.ts) from IMG_2552, IMG_2336, IMG_2597 and IMG_2503: tapered green post on a bolted plate, collar, ball and four cradle arms, a frosted four-sided lantern taller than wide, a weathered pyramid roof with vent cap and finial. Use it for the Calle Jorge lamps, the two Calle Eva lamps, the ten Pintor Dali lanterns and the generic lamp_post prop. Positions do not change.

## Do not

Do not move any lamp. Leave the passage hanging lanterns, wall lanterns, bollard lights and the paseo's solar lamps: they are different fittings.

## Done when

- [ ] Asset sheet beside the photo crops
- [ ] Before/after renders recorded in data/photo_checks.json
- [ ] scripts/check_lantern_post.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `lantern-post-asset` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
