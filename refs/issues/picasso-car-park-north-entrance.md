# Main car park north entrance: asphalt apron, lanes, separator and the CALLE DE PICASSO plinth

Task `picasso-car-park-north-entrance` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`

## Photos to build from

- `public/photos-ref/IMG_3131.jpg`: CALLE DE PICASSO plinth, barrier arm and ramp between white walls (ground — pin ±1.5 m; looks at barrier and CALLE DE PICASSO plinth at the north end)
- `public/photos-ref/IMG_3130.jpg`: Low white wall with sign post at the north end of the car park (ground — pin ±21.1 m; looks at low white wall and sign post at the north entrance)

## Build

Lay out the car park's north entrance between Calle Loira, Calle Bolivia and the planted island: the asphalt apron and its lanes, the white kerb nose and bougainvillea bed beside the barrier's rest post, the brick-edged terracotta path, lawn strip and CALLE DE PICASSO plinth, and the ramp between white walls. Then check both barriers (data/picasso_car_park.json barriers) against the traced lanes.

## Do not

No change to Walk. Do not grade positions measured without a solved camera.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Photo checks recorded for IMG_3131 and IMG_3130
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-car-park-north-entrance` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
