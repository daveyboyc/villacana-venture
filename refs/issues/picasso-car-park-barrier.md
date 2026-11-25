# Main car park: the security barrier at the north entrance (asset and placement)

Task `picasso-car-park-barrier` · area **Pintor Picasso and the car park** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`

## Photos to build from

- `public/photos-ref/IMG_3131.jpg`: CALLE DE PICASSO plinth, barrier arm and ramp between white walls (ground — pin ±1.5 m; looks at barrier and CALLE DE PICASSO plinth at the north end)

## Build

Dave, 25 November 2026: in the main car park add the security barriers, create the asset and place it. Build a reusable barrier asset from IMG_3131 (white boom with red edges, red rest post with fork and photocell, red-white bollard, drive cabinet inferred) and place the barriers, closed, at the north entrance: the entry barrier in the west lane and the exit barrier in the east lane (Dave, 25 November: there is a second barrier; Street View Oct 2024 and a Google 3D top-down screenshot).

## Do not

No change to Walk. Do not grade the positions photographed or measured: no camera is solved; the Google screenshot registration is good to about 1.5 m.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Photo check recorded for IMG_3131
- [ ] scripts/check_car_park_barrier.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-car-park-barrier` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
