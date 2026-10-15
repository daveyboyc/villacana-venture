# Paseo: re-trace the promenade line from the retaining wall

Task `paseo-retrace-line` · area **The paseo** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/paseo.md` and the contact sheet `villacana-reference/contact-sheets/paseo.jpg`
- docs: `docs/SEAFRONT.md`
- data: `data/coastal_gate.json`, `data/paseo_wall.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/paseo-wall.ts`

## Photos to build from

- `public/photos-ref/IMG_2350.jpg`: Paseo looking north-east: stamped walk, sandstone retaining wall (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2352.jpg`: Paseo looking west: sandstone wall, mesh fence, lamp posts (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2354.jpg`: Paseo curving north-east beside the sandstone wall (ground — pin ±3.4 m)
- `public/photos-ref/IMG_2349.jpg`: From the paseo: sandstone retaining wall and fence below the south pool (ground — pin ±3.3 m)

## Build

The mapped (OSM) paseo is 1-3 m off the real one: in places a sand strip shows between the paseo and the wall that the photos do not have, elsewhere the wall had to be held 1.8 m in. Re-trace the paseo centreline about 1.5 m seaward of data/paseo_wall.json, regenerate skeleton.json and remove the 1.8 m hold-in.

## Do not

Keep the coastal gate connector and the Barraka boardwalk joins; regenerate skeleton.json with scripts/build_skeleton.py, never by hand.

## Done when

- [ ] check_seafront.py and check_paseo_wall.py pass
- [ ] paseo still walks end to end
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `paseo-retrace-line` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
