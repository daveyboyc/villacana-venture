# Paseo east: registry house 6465801UF1366N_part5 blocks the walk

Task `paseo-house-clearance` · area **The paseo** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/paseo.md` and the contact sheet `villacana-reference/contact-sheets/paseo.jpg`
- docs: `docs/SEAFRONT.md`
- data: `data/coastal_gate.json`, `data/paseo_wall.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/paseo-wall.ts`

## Photos to build from

- `public/photos-ref/IMG_2226.jpg`: From the beach looking back at the resort frontage (ground — pin ±2.0 m)
- `public/photos-ref/IMG_2227.jpg`: From the beach looking west along the white seafront houses (ground — pin ±2.5 m)

## Build

Further east than the boardwalk the mapped paseo passes 0.64 m from registry house 6465801UF1366N_part5, so the player is blocked. Find whether the paseo line or the footprint is wrong (aerial, photos) and fix the one that is.

## Do not

Registry footprints stay unless a photo-backed correction is the point; prefer re-tracing the paseo.

## Done when

- [ ] layout browser test walks the whole paseo end to end
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `paseo-house-clearance` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `paseo-retrace-line`
