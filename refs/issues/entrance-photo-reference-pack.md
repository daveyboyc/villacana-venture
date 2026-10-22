# Entrance photo inventory, annotated drawings and repeatable map rollout

Task `entrance-photo-reference-pack` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from

- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±1.5 m; looks at south gate, double iron leaves and the planter to its right)
- `public/photos-ref/IMG_2189.jpg`: Calle Silvia north: tiled lane looking to the middle pool south gateway (ground — pin ±3.0 m; looks at The middle pool south gateway at the end of Calle Silvia north, about 28 m ahead)
- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2191.jpg`: Passage plaque reading CALLE SILVIA 1-15 (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2185.jpg`: Covered arched passage, patterned terracotta tiles, sea at the far end (ground — pin ±2.9 m)
- `public/photos-ref/IMG_2187.jpg`: Arched passage with a street and house-number plaque (ground — pin ±2.9 m)

## Build

Create numbered source-photo annotations, independent scene drawings, feature/source/model-status inventory and machine-readable reference-pack template. Include covered-passage structure and identity/registration blockers. Generate a rollout backlog for every existing area using the current reference catalogue.

## Do not

No geometry changes, invented measurements, inferred hidden connections, private source pixels, or inventory/diagram completion treated as placement approval.

## Done when

- [ ] Observed source features have stable IDs, pixel locators and source hashes
- [ ] Silvia and Jorge passages and unresolved entrance correspondence remain distinct
- [ ] Interactive photo/trace/checklist viewer works on desktop and mobile
- [ ] Reusable template, validation and catalogue-driven rollout inventory cover every fixed area
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `entrance-photo-reference-pack` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
