# Paseo: photo-backed stamped concrete on the existing walk

Task `paseo-stamped-surface` · area **The paseo** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/paseo.md` and the contact sheet `villacana-reference/contact-sheets/paseo.jpg`
- docs: `docs/SEAFRONT.md`
- data: `data/coastal_gate.json`, `data/paseo_wall.json`, `data/paseo_details.json`, `data/registry_corrections.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/paseo-wall.ts`, `src/paseo-details.ts`

## Photos to build from

- `public/photos-ref/IMG_2481.jpg`: Paseo looking north-east towards Barraka: curving pink walk, sandstone wall, dry verge (ground — pin ±2.0 m; looks at Paseo curve and verge towards Barraka)
- `public/photos-ref/IMG_2482.jpg`: Paseo looking north-east: agave verge and Barraka restaurant (ground — pin ±2.6 m; looks at Barraka beach restaurant at the end of the paseo)
- `public/photos-ref/IMG_2483.jpg`: Paseo looking north-east, second shot: agave verge to Barraka (ground — pin ±2.7 m; looks at Barraka beach restaurant at the end of the paseo)
- `public/photos-ref/IMG_2351.jpg`: Paseo looking south: stamped walk, timber edge, beach and sea (ground — pin ±4.7 m)

## Build

Apply muted weathered red stamped-concrete markings to the existing retaining-wall frontage only, with continuous metric UVs along the unchanged centreline; retain the prior eastern material. Preserve geometry, width, levels, wall/fence, terrain and collision.

## Do not

No inferred plant positions, changed wall/path extents or calibrated placement claims. Elena excluded.

## Done when

- [ ] Independent full-source and final-render review
- [ ] Continuous scale/phase through ribbon segments; unchanged vertex positions and traversal
- [ ] Source checks, production build and layout/overview/photo-map browser regressions
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `paseo-stamped-surface` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
