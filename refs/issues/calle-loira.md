# Calle Loira resort boundary and the adjacent Juan Gris footpath

Task `calle-loira` · area **Loira, Bolivia, Alberto and Isabel** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-lanes.md` and the contact sheet `reference/contact-sheets/north-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/calle-loira/README.md`
- data: `data/street_layout.json`, `data/loira_boundary.json`, `data/gregorio_restaurant.json`, `data/ground_plan_north_lanes.json`
- src: `src/loira-boundary.ts`, `src/gregorio-restaurant.ts`

## Photos to build from

- `public/photos-ref/IMG_3133.jpg`: Juan Gris street plaque and inside face of the Loira boundary (ground — pin ±2.6 m; looks at White boundary wall and terracotta path)
- `public/photos-ref/IMG_3141.jpg`: Juan Gris: terracotta lane alongside the white outer wall (ground — pin ±2.3 m; looks at Terracotta paving between the white wall and houses)
- `public/photos-ref/IMG_3150.jpg`: Juan Gris barred arch looking over the Loira verge and asphalt (ground — pin ±2.3 m; looks at Barred opening, sill and grass outside)
- `public/photos-ref/IMG_3153.jpg`: Western Juan Gris path with arched grille and raised sill (ground — pin ±2.4 m; looks at Terracotta paving, wall and grille along Juan Gris)

## Build

Model the visible resort-side wall, interior terracotta path and evidence-backed grass verges while retaining the existing Loira asphalt alignment.

## Do not

Do not invent the opposite frontage or hidden junction connections, or move the road, footprints or survey datum.

## Done when

- [ ] Review Layout and Show details in Inspect
- [ ] Record estimated placement and request outside coverage
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `calle-loira` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `ground-plan-framework`
