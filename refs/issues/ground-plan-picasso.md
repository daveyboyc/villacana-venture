# Pintor Picasso and the car park: smooth paths, patios and green spaces with their edges and boundaries

Task `ground-plan-picasso` · area **Pintor Picasso and the car park** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `villacana-reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`
- src: `src/picasso-service-road.ts`

## Photos to build from


## Build

Trace the area's paths, patios and green spaces as smooth vector shapes from the georeferenced aerial and the photos, with what bounds each (kerb, brick border, planter wall, hedge, patio wall with openings, fence), and bring the existing features under the ground plan (picasso_service_road.json). The raster ground classes give way to the traced shapes. Photo-check from the area's best cameras.

## Do not

Do not move registry footprints or pool rings without a measured correction. Keep lanes and openings clear. Untraced edges become gaps or inferred, never repeated invented walls. Leave Walk alone.

## Done when

- [ ] check_ground_plan.py passes for the area
- [ ] Photo checks recorded
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `ground-plan-picasso` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `ground-plan-framework`
