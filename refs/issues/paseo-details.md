# Paseo: hedges behind the fence, windbreak cloth, lamp posts

Task `paseo-details` · area **The paseo** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/paseo.md` and the contact sheet `villacana-reference/contact-sheets/paseo.jpg`
- docs: `docs/SEAFRONT.md`
- data: `data/coastal_gate.json`, `data/paseo_wall.json`, `data/paseo_details.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/paseo-wall.ts`, `src/paseo-details.ts`

## Photos to build from

- `public/photos-ref/IMG_2350.jpg`: Paseo looking north-east: stamped walk, sandstone retaining wall (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2352.jpg`: Paseo looking west: sandstone wall, mesh fence, lamp posts (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2354.jpg`: Paseo curving north-east beside the sandstone wall (ground — pin ±3.4 m)
- `public/photos-ref/IMG_2349.jpg`: From the paseo: sandstone retaining wall and fence below the south pool (ground — pin ±3.3 m)

## Build

Clipped hedges behind the mesh fence, the green windbreak cloth on parts of it, the slim white lamp posts and the service cover, all Details only.

## Do not

Details must keep the paseo route clearance.

## Done when

- [ ] render from IMG_2352
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `paseo-details` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
