# Paseo east end: wall height towards the big pool

Task `paseo-east-end-height` · area **The paseo** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/paseo.md` and the contact sheet `villacana-reference/contact-sheets/paseo.jpg`
- docs: `docs/SEAFRONT.md`
- data: `data/coastal_gate.json`, `data/paseo_wall.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/paseo-wall.ts`

## Photos to build from

- `public/photos-ref/IMG_2227.jpg`: From the beach looking west along the white seafront houses (ground — pin ±2.5 m)
- `public/photos-ref/IMG_2350.jpg`: Paseo looking north-east: stamped walk, sandstone retaining wall (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2226.jpg`: From the beach looking back at the resort frontage (ground — pin ±2.0 m)

## Build

The model makes the wall rise to 3 m over its last 40 m because the paseo falls to big-pool level; IMG_2227 from the beach suggests it stays about 1 m. Settle it (a new photo from the paseo near Calle Guillermo would decide) and adjust the paseo or big-pool levels in data/main_pool.json.

## Do not

Do not change the big-pool level without evidence; Dave set it. Ask for a photo if the existing ones do not decide it.

## Done when

- [ ] check_pool_levels.py and check_paseo_wall.py pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `paseo-east-end-height` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `paseo-retrace-line`
