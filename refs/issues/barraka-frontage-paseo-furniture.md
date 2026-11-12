# Barraka frontage and paseo furniture: roped lounge garden, green bar railing on sandstone, solar-head lamps, painted crossing

Task `barraka-frontage-paseo-furniture` · area **Barraka and the beach** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/barraka-beach.md` and the contact sheet `villacana-reference/contact-sheets/barraka-beach.jpg`
- docs: `docs/SEAFRONT.md`, `docs/LEVELS.md`
- data: `data/levels_survey.json`, `data/barraka_frontage.json`, `data/barraka_facade.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/barraka-frontage.ts`, `src/barraka-facade.ts`

## Photos to build from

- `public/photos-ref/IMG_2604.jpg`: Paseo past the Barraka restaurant with lamp post and lounge seating (ground — pin ±2.1 m; looks at Barraka beach restaurant)
- `public/photos-ref/IMG_2609.jpg`: Barraka beach-side lounge garden looking south-west along the paseo (ground — pin ±12.3 m; looks at Roped rattan lounge set on the beach-side verge)
- `public/photos-ref/IMG_2631.jpg`: Looking south-south-west from Barraka's awning across the roped lounge garden and paseo (ground — pin ±4.0 m; looks at Roped rattan lounge set on the beach-side verge)
- `public/photos-ref/IMG_2607.jpg`: From the Barraka terrace over rattan lounge seating and the paseo (ground — pin ±18.8 m; looks at Roped rattan lounge set on the beach-side verge)
- `public/photos-ref/IMG_2608.jpg`: From the Barraka terrace looking SW along the paseo to the white houses (ground — pin ±12.6 m; looks at Paseo and lawn railing towards the white houses)
- `public/photos-ref/IMG_2610.jpg`: Barraka terrace paving, slot drain and curved sandstone wall under green railings (ground — pin ±4.2 m; looks at Curved sandstone wall and green railing at Barraka's west corner)
- `public/photos-ref/IMG_2630.jpg`: Barraka's glazed north-west frontage with sandbags along the slot drain (ground — pin ±6.8 m; looks at Barraka north-west glazed frontage)
- `public/photos-ref/IMG_2618.jpg`: Barraka's north-east facade seen from the beach side of the paseo (ground — pin ±2.4 m; looks at Barraka restaurant, north-east and north-west faces)
- `public/photos-ref/IMG_2480.jpg`: Paseo looking east with solar lamp and sandstone wall (ground — pin ±3.6 m; looks at Solar-head lamp post at the wall foot beside the paseo)
- `public/photos-ref/IMG_2484.jpg`: Paseo near Calle Guillermo with painted crossing (ground — pin ±3.9 m; looks at Painted crossing across the paseo beside the beach gateway)
- `public/photos-ref/IMG_2637.jpg`: Paseo end by the Calle Pintor Dali car park with hedge behind mesh fence (ground — pin ±4.7 m; looks at Dali end of the paseo: wall end, mesh fence and lamp)

## Build

Details-only furniture and finishes read from the 4 Nov photos, on existing geometry: Barraka's roped rattan lounge (timber posts with rope swags, two cream-cushioned wicker sofas, four woven pod armchairs, table, closed parasol, menu stand, easel sign, terracotta pots) beside the paseo; the big-pool lawn railing finished as dark green bars on a sandstone plinth instead of white; the four paseo lamps redrawn with a slim round tube and a solar-panel head at about 4 m; the red and white painted crossing in front of the beach gateway. No registry footprint, wall, terrain, collision or route changes.

## Do not

Nothing positioned from the +-12-19 m pins of IMG_2607/2608/2609 alone (they were taken from under the terrace awning). No new lamps, walls, gates or repeated furniture beyond what the photos show. Do not claim photographic or placement verification: the independent reviewer step is still outstanding. Barraka's building mass, facade windows and glazed frontage are not built here (see barraka-facade).

## Done when

- [ ] Layout view unchanged; furniture only in Details and passing the route-clearance guard with its visible footprint
- [ ] Before/after renders from the photo cameras recorded in data/photo_checks.json with honest differences
- [ ] Standard handover checks and scripts/check_barraka_frontage.py pass; an independent agent reviews the renders against the full-size photos before the task can be done
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `barraka-frontage-paseo-furniture` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
