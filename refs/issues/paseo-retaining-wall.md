# Paseo: sandstone retaining wall, mesh fence and level drop

Task `paseo-retaining-wall` · area **The paseo** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/paseo.md` and the contact sheet `villacana-reference/contact-sheets/paseo.jpg`
- docs: `docs/SEAFRONT.md`
- data: `data/coastal_gate.json`
- src: `src/seafront.ts`

## Photos to build from

- `public/photos-ref/IMG_2350.jpg`: Paseo looking north-east: stamped walk, sandstone retaining wall (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2349.jpg`: From the paseo: sandstone retaining wall and fence below the south pool (ground — pin ±3.3 m)
- `public/photos-ref/IMG_2352.jpg`: Paseo looking west: sandstone wall, mesh fence, lamp posts (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2354.jpg`: Paseo curving north-east beside the sandstone wall (ground — pin ±3.4 m)

## Build

Yellow sandstone retaining wall about 1.2 m high with a green mesh fence on top along the landward side of the paseo, and the level difference it holds.

## Do not

Keep the coastal gate and every lane reaching the paseo open.

## Done when

- [ ] paseo walks end to end
- [ ] check script for the wall
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `paseo-retaining-wall` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
